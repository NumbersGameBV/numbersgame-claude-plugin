# Ramp — a separate, read-only connector

Some clients run their bills and company cards in **Ramp**. Their Ramp business is
linked to the Numbers Game company on the Companies screen, and the company's .md
file then has a **Ramp (read-only)** section naming the Ramp business and entity.

- **Two connectors, two systems.** Ramp data comes from the **Numbers Game – Ramp**
  connector; the books come from the Numbers Game connector. Pass the same realm_id
  to both. Some tool names exist on both (a Ramp bill and a ledger bill are
  different records), so say which system each figure comes from.
- **Ramp is not the books.** A Ramp bill can be approved and paid in Ramp before
  Ramp's own sync brings it into QuickBooks or Xero, with its invoice PDF. Before
  creating in the ledger anything that exists in Ramp, check why it has not synced:
  `find_unsynced_bills`, then `explain_unsynced` per bill. A hand-made copy becomes a
  duplicate when the sync catches up; only create it if the user insists after
  hearing that.
- **Read-only.** Nothing can be approved, paid, coded or edited in Ramp here. Name
  the record and send the user to Ramp.
- **Totals and problems.** Spend totals come from `spend_summary` (every record,
  exact amounts, never mixed currencies); a sweep for duplicates, personal spend,
  missing receipts and overdue bills from `find_problems`. Its findings are leads
  to review with the client, not conclusions.
- **Setup questions.** `list_ramp_entities` shows each Ramp entity's mapping to the
  ledger; a missing mapping or an unlinked vendor is the usual cause of a sync gap.
- **No Ramp tools in the conversation?** The user has not added the Numbers Game –
  Ramp connector in Claude yet; its address is on the Setup page in Numbers Game.
  A company without a Ramp section in its .md file is not linked to Ramp.
- **Ramp accounts receivable** has no API: customer invoices are in the ledger only.
