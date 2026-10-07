## Workflow 5: Historical Vendor Mapping or Bank Rule Enrichment

**Trigger:** Run this when the user says "vendor mapping", "vendor map", or "Bank rules". Typically run once right after onboarding so future weekly reviews can auto-categorize known vendors.

This workflow learns each vendor's usual account from QBO history and stores it in the Numbers Game vendor-mapping table via `upsert_vendor_mapping`, so future transaction classification books each vendor's spend to the right account. Mappings are read back by `get_vendor_mappings` during the weekly review — they live in Numbers Game, **not** in any external database.

### Step 1 — Pull ~6 months of QBO transaction history
Include realm_id (from the project's COMPANYNAME.md) in every call.
- `search_purchases` with `start_date` / `end_date` covering the last 6 months and `fetchAll: true`
- `search_deposits` with the same range and `fetchAll: true`

### Step 2 — Extract vendor → account mappings
From each purchase:
- Vendor name: `VendorRef.name` (fallback `PayeeRef.name` or `EntityRef.name`)
- Account: `AccountRef.name` and `AccountRef.value` from the line items or header
From each deposit:
- Source name: any payee/entity field available
- Account: `DepositToAccountRef.name`

### Step 2b — KEY THE RULE ON WHAT THE BANK SENDS

**This is the single most common reason a rule library does nothing.** The bank
feed matches a rule to a transaction by comparing the rule's `vendor_name` with
the bank's **descriptor**, normalized and **exact** — not fuzzy, not substring,
deliberately. A QuickBooks vendor name and a bank descriptor are rarely the same
string:

```
rule "Regence BL"                 descriptor "INSTAMED - REGENCE BL"   no match
rule "Alaska Air"                 descriptor "ALASKA AIRLINES"          no match
rule "RocketReach"                descriptor "ROCKETRE"                 no match
rule "Hilton"                     descriptor "HILTON NEW YORK"          no match
```

On one real company, **57 rules had never fired once**, covering 115
transactions and $92,468. Every one of those lines then held as
`first_time_unknown` and looked to the bookkeeper like low confidence, when the
truth was that the rule they wrote was never being read.

**So, where the company has a bank feed:** before writing rules, call
`search_plaid_transactions` and collect the DISTINCT descriptors. Write one rule
per descriptor, with `vendor_name` set to the descriptor as the bank sends it,
and put the QuickBooks vendor name in `notes`. Where several descriptors are the
same merchant, write a rule for each — they are cheap, and one that matches
beats one that reads well.

**Never guess a match.** `PLEX` (the streaming service) and `Googleplex` are one
substring apart and are not the same company. If you are not sure two names are
the same merchant, write the rule for the descriptor you actually saw and leave
the other alone.

### Step 3 — Classify each vendor by usage pattern

| Usage pattern | Classification |
|---------------|----------------|
| 3+ transactions, always same account | HIGH confidence |
| 3+ transactions, multiple accounts | INCONSISTENT — flag for bookkeeper review |
| 1–2 transactions only | LOW confidence |
| No vendor name found | skip entirely |

### Step 4 — Store each mapping via `upsert_vendor_mapping`

Process vendors in order: HIGH first, then INCONSISTENT, then LOW. The Numbers Game table supports two confidence levels (`high` / `low`), so map the usage pattern as follows:

| Usage pattern | `confidence` | `notes` |
|---------------|--------------|---------|
| HIGH | `high` | optional |
| INCONSISTENT | `low` | `INCONSISTENT — coded to: <each account + count>. Verify before trusting.` |
| LOW | `low` | `Low frequency (<N> txns) — verify before trusting.` |

For each call set:
- `vendor_name`: exact name as it appears in QBO — this is the key, so re-using a name updates the existing row
- `account_code`: e.g. `"6050"` (`AccountRef.value`)
- `account_name`: e.g. `"Software and SaaS"` (`AccountRef.name`)
- `confidence`: `high` or `low` per the table above
- `notes`: per the table above; for INCONSISTENT, list every account the vendor was coded to with its count

### Step 5 — Print a summary
- Transactions analyzed: [n]
- Unique vendors found: [n]
- HIGH confidence mappings added: [n]
- INCONSISTENT vendors flagged (stored as low): [n]
- LOW confidence vendors added: [n]

Then remind the user:
- HIGH confidence vendors will auto-categorize on the next weekly review.
- Review all INCONSISTENT entries before the first run.

### Empty-history fallback
### Step 5 — Check the rules actually fire

Writing rules is not the same as rules matching. Where a bank feed exists, run
`propose_bank_coding` afterwards and read the result: a line still scoring
0.30-0.40 with `first_time_unknown` has no rule matching it, whatever the rule
table says. Tell the user which descriptors are still unmatched rather than
reporting the count of rules written — the second number is not the one that
does any work.

If QBO returns no history (brand-new company with no transactions): call `upsert_vendor_mapping` once with `confidence: "low"` and `notes: "Placeholder — no transaction history yet; mappings will build after the first review."`, then tell the user the map will build after the first review.
