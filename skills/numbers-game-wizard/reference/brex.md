# Brex — a separate, read-only connector

Some clients run their company cards, reimbursements and bill pay in **Brex**. A firm
links the client's Brex account, the whole account or one legal entity, to the company
on its Brex card in the portal, and the company's .md file then has a
**Brex (read-only)** section.

- **Two connectors, two systems.** Brex data comes from the Brex connector; the books
  come from the ledger connector. Pass the same realm_id to both. Every Brex tool's name
  begins with brex_ or names Brex; a Brex expense and a ledger transaction are different
  records, so say which system each figure comes from. `list_brex_businesses` says which
  clients are linked, and to which Brex account or legal entity.
- **Brex is not the books.** Brex's own accounting integration exports card spend,
  reimbursements and bills to QuickBooks or Xero. Before creating in the ledger anything
  that exists in Brex, compare with the ledger and ask: a hand-made copy becomes a
  duplicate when Brex's export catches up.
- **Read-only.** Nothing can be approved, paid, coded or edited in Brex here, and no
  money moves. Name the record and send the user to Brex.
- **Which tool.** Spend: `brex_search_expenses` (card, reimbursement and bill pay),
  `brex_get_expense`, `brex_search_card_transactions`. Totals: `brex_spend_summary`,
  never pages added up by hand. Bills: `brex_search_bills`, `brex_get_bill`. Vendors:
  `brex_search_vendors`, `brex_get_vendor`. Cash: `brex_list_cash_accounts`,
  `brex_search_cash_transactions`. Setup: `list_brex_entities`,
  `brex_list_accounting_fields`.
- **Problems.** `brex_find_problems` sweeps for possible duplicate charges or bills,
  declined payments, overdue bills and out-of-policy spend. Its findings are leads to
  check with the client, not conclusions.
- **Month-end tie-out.** `brex_list_statements` (card or cash) gives opening and closing
  balances. Compare the closing balance with the ledger's Brex account, read with the
  ledger connector as of the statement's last day, and explain any difference.
- **Each answer carries its own notes** (amount units, missing due dates, withheld
  records, a missing permission): pass them on rather than working around them.
- **No Brex tools in the conversation?** The user has not added the Brex connector in
  Claude yet; its address is in the Brex setup guide (/guide/brex). A company without a
  Brex section in its .md file is not linked to Brex. Every Brex refusal names its way
  forward; relay it.
