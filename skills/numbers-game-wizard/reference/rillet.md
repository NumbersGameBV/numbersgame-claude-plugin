# Rillet — its own ledger connector

Some clients keep their books in **Rillet** (an ERP with legal entities,
contracts, revenue recognition and consolidation). The Rillet connector serves
them: every Rillet tool's name begins with rillet_. A Rillet company is never
served by the QuickBooks or Xero tools, and the Rillet tools serve no other
ledger.

**Which company you are on.** The firm chose this when it connected the Rillet
organisation; `rillet_list_companies` lists every Rillet company the user may
open, with its entity, currency and group.

| Company | realm_id | What it is |
|---|---|---|
| Entity | `rillet_<org>_<entity>` | One legal entity: its invoices, bills, journal entries, bank lines, contracts and spend; reports in its currency. |
| Combined | `rillet_<org>` | The whole organisation as one company. Reports are consolidated (pass `entity_id` for one entity); every write names its entity with `subsidiary_id`. |
| Group | `pc_…` | The organisation level: consolidated reports (the executive P&L too), every entity's journal entries (read), master data, the close checklist and its task edits, book periods, the health of Rillet's own integrations, and what changed. Entity work is refused with `rillet_entity_only`, naming the entity to use. |

Never guess a realm_id: take it from the company's .md file or
`rillet_list_companies`, or ask. The elimination entity is never a company; its
entries show in the group's and the combined company's reports.

**Rules for every job**

- **Writes are two calls**, like every write here: a draft with a
  `confirm_token`, shown to the user, then the call again with the token only on
  their yes. Name the entity, the accounts (code and name) and the currency in
  the draft you show. On a combined company, ask which entity a write belongs to;
  do not default.
- **Master data is organisation-wide.** Accounts, customers, vendors, products,
  tax rates and fields are shared by every entity: read them anywhere, create or
  change them (`rillet_create_account`, `rillet_save_customer`,
  `rillet_save_vendor`) on the group or the combined company.
- **Accounts by code.** Writes take Rillet account codes; look them up with
  `rillet_search_accounts` and `rillet_list_reference`.
- **Totals come from reports**, never from pages of a search added up.
- **Nothing moves money and nothing is sent.** A payment recorded here was made
  elsewhere; an invoice created here is not emailed.
- A currency is never added to another: each is its own total.

**Month-end close, one entity** (the entity, or the combined company with
`entity_id`):

1. `rillet_list_book_periods`: is the month open, what was last closed. Then
   `rillet_integrations_health`: an UNHEALTHY sync of Rillet's own (Stripe, Brex,
   payroll, a bank feed) means transactions may be missing; it is fixed in
   Rillet's settings before the figures are trusted.
2. `rillet_trial_balance`, `rillet_income_statement`, `rillet_balance_sheet`
   (and `rillet_cash_flow` when asked) for the month; `rillet_general_ledger` for
   an account's postings. The trial balance nets to zero: say so, or show the
   difference.
3. Aging: `rillet_ar_aging` and `rillet_ap_aging`, today or `as_of` the month end.
   Rillet has no aging report of its own; these rebuild it from the documents and
   their payments. Tie each currency's total to the AR or AP control account on the
   trial balance at the same date and show the difference: it is a lead to explain,
   never something to post away.
4. Bank lines not yet reconciled, and the bank balance against the ledger:
   **Bank** below.
5. Prepaids, deferred commissions and intangibles: the balance sheet account
   should equal what `rillet_search_amortisation` says is left; see
   **Amortisation schedules** below.
6. What changed since the last close: `rillet_list_recent_changes` with `since`;
   read each record it names with its own tool before describing it.
7. Adjustments: `rillet_create_journal_entry` on the entity (on a combined company
   with `subsidiary_id`); `rillet_update_journal_entry` replaces every line, so send
   them all. Debits equal credits or nothing is sent. A closed period takes no
   posting: say so, and the user decides whether to reopen it or post in the next.
8. Close tasks and the period: **Close checklist** below.

**Budget against actual.** `rillet_list_budgets`, then `rillet_get_budget_entries`
(per account and month, with totals) for the months asked; compare with
`rillet_income_statement` for the same months, account by account, and show the
difference with both figures.

**Consolidated close** (the group, or the combined company without `entity_id`):
each entity's close first; then consolidated `rillet_trial_balance`,
`rillet_balance_sheet` and `rillet_income_statement` in the organisation's
currency (the combined company adds `breakdown_by: SUBSIDIARY` for a column per
entity). Eliminations show in `rillet_search_journal_entries` and
`rillet_get_journal_entry` on the group; an elimination entry is posted in Rillet
itself. For a board pack: `rillet_executive_pl` (sections and margins, as Rillet
computes them) and `rillet_arr_waterfall`.

**Close checklist.** The checklist and the book periods are organisation-wide.
`rillet_list_close_tasks` and `rillet_list_book_periods` read them anywhere.
`rillet_complete_close_task`, `rillet_sign_off_close_task`,
`rillet_close_book_period` and `rillet_reopen_book_period` run on the group or the
combined company, and only for the person who connected Rillet, on a Rillet
sign-in: otherwise they answer `rillet_connected_user_only`, naming that person.
Closing a period also closes every earlier open period, for every entity;
reopening reopens every later closed one. Say so before asking for the go.
`rillet_update_close_task` changes a task's name, notes, due date, area, preparer
or reviewer queue, on the group or combined company, for anyone; people are the
`user_id`s from `rillet_list_reference` (`kind: members`). Notes are replaced, so
read them first to add to them. A reviewer who already signed off keeps their
place.

**Payables.** `rillet_search_bills`, `rillet_get_bill` (lines, payments, what is
open), `rillet_search_vendor_credits`, `rillet_search_vendors`. Enter a bill with
`rillet_create_bill`; change one with `rillet_update_bill` (its lines replace
every line). Record a payment made elsewhere with `rillet_record_bill_payment`. A supplier's
credit note: `rillet_create_vendor_credit` (lines by account code), then
`rillet_apply_vendor_credit` to that vendor's open bills. Rillet keeps one
application per bill per credit and adds new ones to those already there: a bill
the credit already covers is changed in Rillet, not here.
Spend: `rillet_search_charges`, `rillet_search_reimbursements`,
`rillet_create_reimbursement`, then `rillet_record_reimbursement_payment` once paid.

**Receivables.** `rillet_search_invoices`, `rillet_get_invoice`,
`rillet_search_credit_memos` (what each credit was applied to),
`rillet_search_customers`, `rillet_search_products`. Create with
`rillet_create_invoice`; record a payment received with
`rillet_record_invoice_payment`. **Under an approval workflow Rillet holds a new
invoice for approval and returns a proposal id: report "waiting for approval in
Rillet", never "created", and never create it again.** A credit for a customer:
`rillet_create_credit_memo` (product lines, the revenue it reverses; it refunds
nothing), then `rillet_apply_credit_memo` to that customer's open invoices. Rillet
keeps one application per invoice: a further amount for the same invoice raises
that application, and every earlier one stays.

**Contracts and revenue.** `rillet_search_contracts`, `rillet_get_contract`
(lines, revenue pattern, invoices raised). New: `rillet_create_contract`; its
draft shows Rillet's own invoice schedule. Change from a date:
`rillet_amend_contract`; lines not named stay. Rillet then raises the invoices and
recognises the revenue.

**Amortisation schedules** (`kind`: prepaid, commission or intangible).
`rillet_search_amortisation` (amount, what is left, status, with totals per
currency) and `rillet_get_amortisation` (every period and the adjustments).
`rillet_create_amortisation` posts the capitalisation entry, and with start, end
and method it is created active with every period posted; otherwise
`rillet_adjust_amortisation` activates it later. The same tool impairs (a
write-down to a loss account) or ends one early; an intangible asset is never
ended early (impair its whole carrying amount instead). The draft shows the
entries Rillet itself computes. Rillet takes only matching accounts: a Prepaid
Expense account for a prepaid; a Deferred Commissions or Other Current Asset
account for a commission; for an intangible, an Intangible Assets account, an
Accumulated Amortization contra and a bank, card, equity or operating account as
its source (not accounts payable). `rillet_create_account` makes any that are
missing, on the group or the combined company.

**Bank.** The unit is the Rillet bank account. Rillet's own feed is the default;
`rillet_post_plaid_feed` posts the firm's Plaid lines into a Rillet bank account
only when that account has no live Rillet feed, and is refused with
`rillet_bank_feed_active` when it has: one feed per account. To reconcile:
`rillet_list_reference` (`kind: bank_accounts`), then
`rillet_search_bank_transactions` with `unreconciled_only: true`. Match lines to
records that exist with `rillet_match_bank_transactions`; book a line with no
record (a fee, interest) with `rillet_bank_quick_entry`; pair a transfer between
two of the organisation's accounts with `rillet_match_bank_transfer` (between
entities, on the combined company). **A match cannot be undone through the API**,
only in Rillet: show which lines match which records, with amounts and any
difference, before the go. To tie out: `rillet_bank_balance` gives the bank's
stored balance on or before a date (and the date it is from) beside the ledger
account it maps to; compare it with that account on `rillet_balance_sheet` at the
same date and explain the difference with the open lines. When the stored balance
is older than the date asked, the client's statement gives the balance.

**Stripe, Square and Shopify** book their period totals and payouts into a Rillet
**entity** (not the group or the combined company) with their own tools and
steps, as for QuickBooks or Xero, choosing accounts by Rillet account code. They
are refused with `rillet_native_integration_active` when Rillet's own integration
for that source is connected to the entity: the user keeps one of the two.

**Attachments** go on an invoice, journal entry, contract, bill (the supplier's
invoice), charge or reimbursement (the receipt): PDF, JPEG, PNG or XLSX. Rillet
does not list what is already on a bill, charge or reimbursement, so attach a
document there once. A document the user has: `rillet_request_attachment_upload`, upload with
the commands it returns, then `rillet_attach_document` within the hour; if your
sandbox cannot reach the internet, say so and the user attaches it in Rillet. A
document you write: `rillet_generate_attachment`, then `rillet_attach_document`.
What is there already: `rillet_list_documents`.

**Refusals and failures.** Every refusal names its way forward: give the user
what happened in one line and that step, and never retry it unchanged. A write is
never re-sent blind: search for the record first. A Rillet tool that misbehaves is
reported with `rillet_submit_feedback`, as on every other connector.

**No Rillet tools in the conversation?** The user has not added the Rillet
connector in Claude yet; its address is in the Rillet setup guide (/guide/rillet).
