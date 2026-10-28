# Ramp — a separate, read-only connector

Some clients run their bills and company cards in **Ramp**. Their Ramp business is
linked to the NumbersGame company on the Companies screen, and the company's .md
file then has a **Ramp (read-only)** section naming the Ramp business and entity.

- **Two connectors, two systems.** Ramp data comes from the **NumbersGame – Ramp**
  connector; the books come from the NumbersGame connector. Pass the same realm_id
  to both. Every Ramp tool's name starts with ramp_ or names Ramp; a Ramp bill
  and a ledger bill are different records, so say which system each figure comes from.
- **Ramp is not the books.** A Ramp bill can be approved and paid in Ramp before
  Ramp's own sync brings it into QuickBooks or Xero, with its invoice PDF. Before
  creating in the ledger anything that exists in Ramp, check why it has not synced:
  `ramp_find_unsynced_bills`, then `ramp_explain_unsynced` per bill. A hand-made copy becomes a
  duplicate when the sync catches up; only create it if the user insists after
  hearing that.
- **Read-only.** Nothing can be approved, paid, coded or edited in Ramp here. Name
  the record and send the user to Ramp.
- **Totals and problems.** Spend totals come from `ramp_spend_summary` (every record,
  exact amounts, never mixed currencies); a sweep for duplicates, personal spend,
  missing receipts and overdue bills from `ramp_find_problems`. Its findings are leads
  to review with the client, not conclusions.
- **Setup questions.** `list_ramp_entities` shows each Ramp entity's mapping to the
  ledger; a missing mapping or an unlinked vendor is the usual cause of a sync gap.
- **Month-end close for the Ramp card.** `ramp_list_statements` lists Ramp's statements
  (opening, charges, credits, payments, ending). `ramp_reconcile_statement` (statement_id,
  or month YYYY-MM) checks one on the server: the statement adds up, its payments equal
  the completed repayments from the bank (`ramp_search_repayments`; ones still in flight
  are listed apart), the cashback on it to book (`ramp_search_cashbacks`), and repayments
  and cashbacks not yet synced to the ledger. It reads Ramp only: compare its ending
  balance with the Ramp card liability account in the ledger at the period end, read with
  the ledger connector, and explain any difference. A company linked to one Ramp
  entity sees that entity's share of the statement, never the whole business's.
- **Purchase orders.** `ramp_search_purchase_orders` lists POs with their receipt and
  billing status; with `po_id` it gives the three-way match per line: ordered, received,
  billed. It compares quantities where Ramp records a billed quantity and amounts
  otherwise, and says which. `ramp_find_problems` also flags POs billed above their
  amount, goods received but not billed, and billed but not received. If it lists these
  under `skipped_checks`, the Ramp business was connected before those permissions were
  requested: it is reconnected from the Ramp bar in the portal.
- **Receipts.** `include_receipt_details: true` on `ramp_search_transactions` or
  `ramp_search_reimbursements` shows each receipt's upload date and who uploaded it.
  The receipt file stays in Ramp.
- **No Ramp tools in the conversation?** The user has not added the NumbersGame –
  Ramp connector in Claude yet; its address is on the Setup page in NumbersGame.
  A company without a Ramp section in its .md file is not linked to Ramp.
- **Ramp accounts receivable** has no API: customer invoices are in the ledger only.
