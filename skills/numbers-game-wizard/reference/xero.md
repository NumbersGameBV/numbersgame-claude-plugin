### What works on a Xero company

## Contents
- What works on a Xero company
- What does not, and what to say instead
- Bank feeds on Xero — read this before promising anything
- Xero specifics that change how you word a call

Items and accounts can be updated, and `delete_item` exists on Xero only —
QuickBooks deactivates items instead. Both aged reports carry a
`reconciliation` block comparing them with the control account on Xero's own
balance sheet: where it reports a difference, say so rather than presenting the
report as tying to the balance sheet — the usual cause is payroll liabilities
posted straight to the control account, which carry a contact but no bill. An
aged report for a past date reconstructs that date's position, not today's.

Filtering the chart of accounts by type accepts either vocabulary - "Bank" or
"BANK" - and refuses the four QuickBooks types Xero cannot express rather than
returning the wrong rows.

- **Reports:** balance sheet, P&L, trial balance, aged receivables, aged payables.
- **Search:** customers, suppliers, invoices, bills, accounts, items.
- **Read:** a customer, supplier, invoice or item in full.
- **Write:** create and update contacts, create and update invoices, create
  bills, create items and accounts, void an invoice.

### What does not, and what to say instead

Twenty-one tools refuse on Xero, and they refuse **by name** with the reason —
believe the refusal, say so plainly, and offer what Xero *can* answer rather
than rephrasing the same request into a different tool.

- **No general ledger, no transaction list, no cash flow statement.** These are
  not gaps in this connector: Xero does not expose those reports to apps on our
  plan at all, and no scope exists that would unlock them. The raw ledger lives
  behind Xero's `Journals` endpoint, which is a premium API on their Advanced
  tier and needs their explicit approval. Say "Xero does not make that report
  available to us", never "I could not find it" — and then answer the question
  a different way, which is usually possible. Use the per-document searches
  (`search_bills`, `search_invoices`, `search_bill_payments`) for "what happened
  with this vendor / customer / account", and `search_bank_transactions` for a
  bank or credit-card account, which reconstructs that account's movements and
  reconciles them against Xero's own bank summary.
- **No employees.** Xero's Employees endpoint answers 404 for us: it keeps
  employees in a separate Payroll API, behind scopes this connector's token does
  not carry. Payroll questions have no answer here at all — say so. Vendors and
  customers are both Contacts and are unaffected.
- **No time activities.** Xero keeps time in Xero Projects, a separate API we
  hold no scope for, so `create_time_activity`, `search_time_activities` and
  `update_time_activity` all refuse. It is not a gap retrying or reconnecting
  closes. Time is recorded in Xero Projects directly.
- **No budget writes.** Xero's Budgets endpoint is read-only — it answers 404 to
  a create or an update — so `create_budget`, `update_budget` and
  `delete_budget` refuse. Reading a budget and running budget vs actual both
  work normally. A budget is built in Xero itself, under Accounting → Reports →
  Budget Manager, and everything else about it works here afterwards.
- **No deposits.** Xero has no Deposit. A QuickBooks Deposit groups several
  undeposited receipts into one bank line; a Xero bank line is already one
  movement, so there is nothing to group, and all five deposit tools refuse
  rather than quietly booking one lump transaction in place of what was asked
  for. Record money in with `create_sales_receipt` — on Xero that posts a
  RECEIVE bank transaction, which is the movement a deposit would have
  represented — read it back with `search_bank_transactions`, or let the bank
  feed book it.
- **Three updates are refused where the create works**: `update_payment`,
  `update_bill_payment` and `update_transfer`. Xero treats those records as
  immutable. Void or reverse and re-enter instead, and tell the user that is
  what you are doing.

**Everything else works on Xero**: creating bill payments, purchase orders,
estimates, credit memos, journal entries and transfers, and emailing
documents.

### Bank feeds on Xero — read this before promising anything

**It depends entirely on how the bank reaches the books, and the two cases are
completely different.**

- **Bank connected through Numbers Game (Plaid).** The full bank-feed toolset
  works, exactly as on QuickBooks: propose, book, hold, reverse. A line becomes
  a spend or receive-money transaction, a bank transfer, or a payment against a
  bill or invoice.
- **Bank feeding directly into Xero.** There is nothing to code. Xero does not
  expose unreconciled statement lines through its API and has said it will not
  add reconciliation via the API — that is a deliberate policy about raw banking
  data, not a missing feature. The `plaid_*` tools will find no transactions
  because there is no connection on our side.

If the client is in the second case, do not offer to code their feed and do not
imply the connector is incomplete. Say plainly that automated bank coding needs
the bank connected through Numbers Game, and that **QuickBooks has the same
limitation** — Intuit does not expose its For Review queue either. That is why
the bank connection exists as a product at all.

`search_bank_transactions` still works in both cases. It reads what is already
POSTED, not what is waiting to be coded, and on Xero it refuses any period it
cannot prove complete rather than showing a short list that looks whole.

**Workflow 1 (Month-End Close)** runs on Xero without the general-ledger step,
and without the bank-feed step unless the bank comes through us — say which
parts you are skipping rather than producing a close report that looks complete.
**Workflow 6 (Import a Bank CSV)** uses the transaction list to preview and to
verify, so it does not apply on Xero. **Workflow 5 (bank-rule enrichment)**
follows the same split as the bank feed itself: it is worth doing when the bank
comes through Numbers Game, and pointless when it feeds straight into Xero,
because the rules exist to code a feed there is no way to read.

### Xero specifics that change how you word a call

- **An invoice needs a due date.** Xero has no payment terms to fall back on.
  Ask the user for one; do not use the invoice date, which means "due on
  receipt" and moves the invoice out of Current on every aging report.
- **Items and accounts need a code.** `sku` and `acct_num` are required. Ask
  rather than inventing one — a made-up code goes into the client's chart of
  accounts and stays there.
- **Customers and suppliers are one record.** Xero decides which a contact is
  from the documents posted against it. If you have both a display name and a
  company name and they differ, ask which to keep; sending both is refused.
- **Sending invoice lines REPLACES every line** and Xero reassigns their ids,
  which breaks payments already allocated against the old ones. To change one
  line, send the whole set you want to end up with. To change a date or a
  reference, omit lines entirely.
- **Amounts are tax-exclusive**, and the tax rate comes from the account unless
  you name a tax code on the line.
- **No classes or departments.** Xero tracks by category *name*, not id, so
  these are refused rather than guessed at. Do not promise class-level analysis
  on a Xero company.
- **There is no concurrency check.** QuickBooks rejects a stale write; Xero does
  not, and the last write wins. Do not send a `SyncToken` — it is refused.
- **Voiding:** a draft or submitted invoice becomes DELETED, an approved one
  VOIDED. Both keep their number and stay findable, so the audit trail survives
  either way. Say which happened.
- **Multi-currency:** aged reports convert at Xero's own rate. If Xero has no
  rate for an unpaid foreign invoice the report is refused rather than mixing
  currencies — report that as a data problem in Xero, not as a tool failure.
