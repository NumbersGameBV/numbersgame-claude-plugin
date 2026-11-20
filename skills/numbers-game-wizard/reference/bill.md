# BILL — a separate connector

Some clients pay their bills, and send invoices, through **BILL** (Bill.com). A firm
links the client's BILL organization to the company in its BILL section in the portal,
and the company's .md file then has a **BILL** section naming the organization.

- **Two connectors, two systems.** BILL data comes from the BILL connector; the books
  come from the ledger connector. Pass the same realm_id to both. Every BILL tool's name
  begins with bill_ or names BILL; a BILL bill and a ledger bill are different records,
  so say which system each figure comes from. `list_bill_organizations` says which
  clients are linked.
- **Bills go through BILL.** BILL syncs its bills and payments into QuickBooks or Xero.
  For a company on BILL, enter a new bill in BILL (`bill_create_bill`), not in the
  ledger: one keyed into both is booked twice once BILL syncs. Only a bill that is not
  in BILL goes straight into the ledger.
- **BILL against the books.** `bill_tie_out_ledger` lists what is open in one and not
  the other; `bill_find_in_ledger` looks for one BILL bill in the books. BILL keeps no
  link to the ledger, so a match is a lead, never proof that a bill synced. At month-end
  close for a company on BILL, run the tie-out with the AP work.
- **Drafts, each confirmed.** `bill_create_vendor`, `bill_update_vendor`,
  `bill_create_bill`, `bill_update_bill` and `bill_attach_document` show the draft first;
  confirm with the token only after the user says yes.
- **Never done here.** Nothing is paid, approved, sent or voided, and no bank details,
  payment methods or autopay are touched. When a draft is refused (an autopay vendor, a
  bill already paid or scheduled), relay the refusal and send the user to BILL.
- **Which tool.** Payables: `bill_search_bills`, `bill_get_bill`,
  `bill_list_pending_approvals`, `bill_search_payments`, `bill_get_payment`,
  `bill_ap_aging`, `bill_list_vendor_credits`, `bill_list_recurring_bills`. Vendors:
  `bill_search_vendors`, `bill_get_vendor`. Receivables: `bill_search_invoices`,
  `bill_get_invoice`, `bill_ar_aging`, `bill_list_received_payments`,
  `bill_list_credit_memos`. Coding: `bill_list_accounting_fields`.
- **Problems.** `bill_find_problems` sweeps BILL for possible duplicates, failed
  payments, 1099 vendors with no tax id, uncoded lines, overdue bills and missing
  documents. Its findings are leads to check with the client, not conclusions.
- **Spend & Expense** (company cards and reimbursements) is read with
  `bill_spend_search_transactions`, `bill_spend_search_reimbursements`,
  `bill_spend_summary` and `bill_spend_list_budgets`, only when the company's BILL
  section says it is connected.
- **No BILL tools in the conversation?** The user has not added the BILL connector in
  Claude yet; its address is in the BILL setup guide (/guide/bill). A company without a
  BILL section in its .md file is not linked to BILL. Every BILL refusal names its way
  forward; relay it.
