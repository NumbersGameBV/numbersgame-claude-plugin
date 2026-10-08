## Workflow 6: Import a Bank CSV

## Contents
- Step 1 — Know what is already there
- Step 2 — Parse and map
- Step 3 — Code every row
- Step 4 — Prove you read the file correctly, then preview
- Step 5 — Dry run
- Step 6 — Post
- Step 7 — Reconcile, and hand over the run id

Triggered by "import this statement", "here's the CSV", "code these
transactions" with a file attached, or any bank/card statement the user
provides as a file rather than through a bank connection.

This is for banks and cards that have no connection set up, and for historical
periods that predate one. Where a bank feed exists for the company, use the
bank feed tools instead — they carry duplicate protection this workflow has to
enforce by hand.

**You read the file. The server never sees it.** The CSV is in this
conversation, not on the Numbers Game server. Parse it here, and send only
structured rows to QuickBooks.

### Step 1 — Know what is already there

Re-running the same statement is the failure mode of this entire workflow, and
it is silent: QuickBooks accepts every duplicate happily, the P&L doubles, and
nobody sees it until the close.

`bulk_create_transactions` enforces this itself — it pulls the range once and
refuses any row that matches an existing transaction on date, amount and
account. **You do not need to do the check by hand, and you must not treat its
refusals as an obstacle to work around.**

What you do owe the user first: read the statement's date range and pull
`qbo_report_transaction_list` for it, so the preview in Step 4 shows what is
already on the account. Walking into an import blind and letting the tool
reject half of it is a worse experience than saying up front that the period
is partly booked.

### Step 2 — Parse and map

- Identify the columns: date, description, amount, and any balance column.
- Establish the sign convention from the data, not the header — confirm against
  a row whose direction is obvious, and state your reading back to the user.
- Money out → `Purchase`. Money in → `Deposit`. A statement row is never a
  journal entry.
- Confirm which QuickBooks bank or card account this statement belongs to via
  `search_accounts`. Never guess it from the file name.

### Step 3 — Code every row

- **Call `get_vendor_mappings` once, with `descriptors` set to every bank
  description in the file.** Do not pull the rule table and match it by eye. A
  company can have two hundred rules, the bank writes `SQ *BLUE BOTTLE 0472
  OAKLAND CA` where the rule says "Blue Bottle Coffee", and matching those is
  the server's job — it strips the store numbers and reference codes itself.
  Send the raw descriptors, unedited. What comes back, per descriptor:
  - `alias` or `exact` on a **high**-confidence rule → book it. The firm already
    decided this; asking again wastes the reason they wrote it down.
  - `contains` or `partial` → a proposal. Show the account and the words that
    matched, and let the user confirm.
  - no match → these, and only these, are the rows to ask about. It is a short
    list, and it is the whole of the manual work.
- **When you learn who a descriptor was, record it** — the proposals the user
  confirmed and the unmatched rows alike. If the vendor already has a rule:
  `add_descriptor_aliases`, every confirmed row in one call; it changes nothing
  else on the rule. If it is a new vendor: `upsert_vendor_mapping` with
  `descriptors: ["<the bank string, verbatim>"]`. Never use
  `upsert_vendor_mapping` just to add a descriptor: it restates the whole rule
  and clears what you leave out. Next month that row matches exactly and nobody
  looks at it again. Skipping this is how one statement line gets reviewed by
  hand twelve times.
- A rule may also carry `never_billed` (book direct, do not look for a bill) and
  `never_capital` (never treat as a capital purchase, whatever the amount).
  Those are the firm's decisions — respect them.
- `search_vendors` for anything still unmapped; propose `create_vendor` for
  genuine new vendors, with approval, before posting.
- Apply the classification rules from Project Instructions (Class, Department).
  Where a rule carries `default_class_name`, that is the firm's own answer.
- Every row needs a vendor/payee, exactly as with any other transaction.
- **`description` is the bank's string, verbatim; `memo` is yours.** Put the
  statement's own wording in `description` — do not tidy it, expand it, or
  replace it with what you worked out the transaction was. A bookkeeper
  reconciling against the statement matches on that exact string and an auditor
  expects to find it. Anything you determined goes in `memo`, which is appended
  after it rather than over it.

### Step 4 — Prove you read the file correctly, then preview

**You are the parser, and nothing downstream checks your work.** The user
approves the table you show them, not the file — so a dropped row, a transposed
column, a misparsed thousands separator or an inverted sign convention produces
a preview that looks entirely reasonable and is entirely wrong.

Before showing the preview, ask the user for three numbers off the statement:
**opening balance, closing balance, and transaction count.** Then compute all
three from your parsed rows using code execution, and compare.

**If any of the three does not match, stop.** Do not proceed, do not present the
preview as provisional, and do not ask whether to continue anyway. Say which
figure disagrees and by how much, and re-read the file. A mismatch means you
misread something, and posting is not the way to find out what.

Only once all three reconcile, show the table: date, description, amount,
proposed account, vendor, class, department. Flag every row you were unsure
about rather than burying it.

### Step 5 — Dry run

Call `bulk_create_transactions` with `dry_run: true`. This validates account,
vendor, and customer references and posts nothing. Resolve every error it
returns before going live — a dry run that reports problems and a live run
issued anyway is how partial imports happen.

The dry run also runs every row through the same coding check as the bank feed: the company's bank rules, open bills a payment should settle, capital purchases, payroll and the rest. Each row carries `engine` (a score, `vetoes` and their reasons, the account the company's rule names when it differs from yours), and rows that would be **held** say why (`held_because`) and what clears them (`needs`). **Show the user every flagged row before posting**, fix what they agree with, and collect their answers. The score is information only: it never holds a row. If a row is held for `basis_not_set`, ask the user whether the company is on a cash or an accrual basis and set it with `set_accounting_policy`; never choose it yourself.

On a **Xero** company the dry run may also say **REGISTER INCOMPLETE**: the transactions Numbers Game can read on that account do not add up to Xero's own bank summary for the period, usually because of a Receipt or an Expense Claim that Xero does not let the connector read. The duplicate check cannot see that difference, so posting will be refused (`register_incomplete`). Show the user both totals and the difference. Suggest importing month by month first: only the months holding the unseen item are refused, and the rest post normally. For a month that still reports it, the user looks in Xero for an item of that difference; only once they confirm none of the statement rows is it, post with `register_incomplete_reason` saying what they checked. Never send it pre-emptively, and never on your own judgement.

### Step 6 — Post

Call `bulk_create_transactions` with `dry_run: false`. It chunks internally. Pass the user's answer to the flagged rows as `vetoes_reviewed` (one sentence for the import, e.g. "reviewed the flagged rows with the user; post as shown"), and `veto_reason` on each row the dry run marked `needs: its_own_answer`: a capital purchase, or a payment with no open bill under strict bill matching, which only an answer about that row clears. A flagged row nobody answered is **held**, not posted: it is kept with the import, the statement check still counts it, and the result says the statement is not complete in the books until it is resolved with `resolve_statement_lines`. Tell the user which rows are held and why. On Xero, a post refused as `register_incomplete` is the Step 5 case: go back to the user with the difference rather than retrying.

Report the outcome per row. **If some rows failed, say so plainly and list
them** — a partial import is the dangerous outcome, because re-running the file
to "fix" it double-posts everything that already succeeded. If rows failed,
correct those rows specifically; never re-submit the whole file.

Rows refused as duplicates are a separate case from rows that failed. Show them
with the existing transaction each one collided with, and let the user decide
per row. If they believe a refusal is wrong — a genuine second charge of the
same amount to the same vendor on the same day does happen — override that row
alone. **Never blanket-override an import**, and never re-run a file with the
duplicate check disabled to "make it go through".

### Step 7 — Reconcile, and hand over the run id

Pull `qbo_report_transaction_list` for the range again and confirm the count and
total match the statement. Then offer the normal reconciliation against the
statement's closing balance.

**Give the user the import run id and tell them what it is for**: if anything
about the import turns out to be wrong, `reverse_csv_import` undoes the whole
run in one step. Say this even when the import looks clean — the moment they
need it is the moment they will not want to be searching the transcript for a
number you mentioned once.
