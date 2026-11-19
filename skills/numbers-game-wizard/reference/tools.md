## Tool guide

## Contents
- Data Tools (read-only — pull silently, never show raw JSON)
- Transaction Tools (write — always get human approval first)
- Sales Documents (write — customer-facing revenue)
- Purchase Documents (write — vendor-side)
- Void Tools (write — prefer these over delete)
- Reconciled transactions — and the two ledgers behave oppositely
- Send Tools (write — these leave the building)
- Bulk Posting
- Account & Entity Management Tools
- The shape of a transaction line (what 2010 and 2020 actually mean)
- Emptying a field (as opposed to changing one)
- Classification Tools (Class = profit center, Department = cost center)
- Budget Tools (QuickBooks writes; both ledgers read)
- Vendor Mapping or Bank Rules Tools (per-company vendor → account memory)
- Payroll Tools (Xero UK Payroll, read only)
- Task Tools (work that outlives the conversation)
- Report Run Tools (storing what you produced)
- Report Template Tools (the firm's own report, filled by the server)
- Library Tools (the firm's prompts, instructions and report templates)
- Slack Tools
- Search & Lookup Tools
- Bank Feed Tools — the booking pipeline, not a place to read from
- When the feed holds a line
- PDF Output Tools (branded deliverables)
- Attachment Tools
- Time Tracking

### Data Tools (read-only — pull silently, never show raw JSON)
- `qbo_report_general_ledger` — Every transaction for a period, account, or class (`class_id`)
- `qbo_report_profit_and_loss` — Revenue and expenses; use `summarize_column_by: Month` for multi-month periods to surface $0 revenue months. `class_id` restricts the whole report to one class; for a column per class use the by-class tool below
- `qbo_report_profit_and_loss_by_class` — P&L with **one column per class**, plus a **Not Specified** column that is the fastest way to spot transactions which missed a class. This is the only tool that splits P&L into class columns; `qbo_report_profit_and_loss` can only filter to a single class
- `qbo_report_balance_sheet` — Assets, liabilities, equity as of a date. For companies tracking classes: `summarize_column_by: Classes` gives a column per class, and `class_id` filters to one
- `qbo_report_ar_aging` — Accounts receivable aging buckets
- `qbo_report_ap_aging` — Accounts payable aging buckets
- `export_financials_xlsx` — Financial statements as an Excel workbook, built server-side. Never read the reports first or assemble rows yourself. The same file is also a button in the portal — **Export financials** on the company page — which is the better answer for something a client asks for every month
- `qbo_report_cash_flow` — Statement of Cash Flows (operating, investing, financing). Use for board reports and any question about where the cash went, which the P&L cannot answer on accrual books.
- `qbo_report_transaction_list` — Flat transaction listing for a period. `group_by: "none" | "vendor" | "customer" | "splits"`. Cheaper and far more legible than reconstructing the same view from the general ledger — prefer it whenever the question is "what did we spend with X" or "show me every transaction in this range". **`vendor` and `customer` take a QuickBooks Id, never a name** — resolve it with `search_vendors` or `search_customers` first, because a name is rejected outright. It **cannot** filter by class or by account — QuickBooks ignores both parameters on this report, so an account-scoped or class-scoped question goes to `qbo_report_general_ledger` instead.
- `qbo_report_trial_balance` — Only when specifically requested. QBO enforces balance, so a TB pull is unnecessary in standard workflows.
- `search_budgets` / `get_budget` — A company's budgets, and one budget with its lines. Most companies keep one per financial year, so check which exist before assuming which a question means. `get_budget` also returns the `sync_token` `update_budget` needs. **On Xero, read the window it reports:** Xero returns only the periods asked for, so a budget that looks short usually needs wider dates, not a correction.
- `qbo_report_budget_vs_actuals` — Budget against actuals, per account per period, with the variance in money and percent and whether it is **favourable** — worked out from each account's own classification, so above budget is good for income and bad for an expense. Rows include accounts with activity and **no** budget line, which is usually the row worth raising. Both ledgers. Name the budget with `budget_id`; if a company has several and you do not, the tool lists them rather than picking one.
- `qbo_report_deferred_revenue_schedule` — Forward revenue for a company on **automatic revenue recognition** (QuickBooks Online Advanced): what is still to be recognised, by customer and P&L income account, month by month (`detail: 'invoice'` to drill in; `horizon_months` to cap at e.g. 36 or 60 — later months are summed, so totals still tie). QuickBooks has **no readable recognition schedule** and posts nothing ahead of time, so never go looking for one, and do not find the liability by its Deferred Revenue subtype — automatic recognition often posts to a different account, and an old Deferred Revenue account at zero is not a sign the books are wrong. The tool ties its total to the liability balance: if `tie_out.explained_by_unmatched` is true, present the schedule as correct and name the invoices in `notes.unmatched_recognition` for the user to check; rows marked `estimated` are contracts not yet started, projected from the item's usual term. QuickBooks only.

### Transaction Tools (write — always get human approval first)
- `create_purchase` / `update_purchase` / `delete_purchase` — Record, edit or remove expenses, checks, credit card charges. To CANCEL one there are TWO routes and they are not the same instrument: **`delete_purchase`** when the document should never have existed (a duplicate, a row posted twice, an import being undone), and **zeroing every line to Amount 0.00** with `update_purchase` when the transaction was real and is being cancelled, which keeps the record and its number for the audit trail. Ask the bookkeeper which it is rather than choosing. QuickBooks has no void for a purchase, and **never** substitute a token amount like 0.01 for zero — a penny left behind is a real expense in the client's books
- `create_deposit` / `update_deposit` / `delete_deposit` — Record incoming funds (customer payments, bank deposits), correct one in place, or remove one. **Read "The shape of a transaction line" and "Emptying a field" before updating one:** a deposit's lines MERGE by `Id` rather than being replaced, so a line sent without its `Id` is added on top and the deposit's value moves. It is the only document that behaves this way
- `create_transfer` / `update_transfer` / `delete_transfer` — Move money between accounts, correct a transfer, or remove one
- `create_payment` / `update_payment` / `void_payment` / `get_payment` — Customer receipts against invoices. Correct one in place rather than voiding and re-entering. `get_payment` reads one by Id, with its SyncToken and the deposit it has been banked on (a LinkedTxn of type Deposit). To find one, use `search_bank_transactions` on the account it was received into — the Undeposited Funds account for a payment not yet banked
- `create_time_activity` / `update_time_activity` / `search_time_activities` — Log and correct hours for an employee or vendor, billable to a customer or not
- `create_journal_entry` / `update_journal_entry` / `delete_journal_entry` — Manual adjustments, reclassifications
- `create_invoice` / `read_invoice` / `update_invoice` — AR invoices
- `create_bill` / `get_bill` / `update_bill` / `delete_bill` — AP bills. Each `Line` takes `ClassRef` and `DepartmentRef`, plus `CustomerRef` and `BillableStatus` to make a cost billable
- `create_bill_payment` / `get_bill_payment` / `update_bill_payment` / `delete_bill_payment` — Pay bills against vendor balances
- `create_estimate` / `get_estimate` / `update_estimate` — Quotes and proposals for customers. **There is no delete**

### Sales Documents (write — customer-facing revenue)

Read "Choosing the right document" below before using any of these. Picking the
wrong one produces books that foot correctly and age wrongly, which nobody
notices for months.

**Sales tax comes first, and the rule is narrower than it looks.** These three
documents carry tax. Before constructing any of them, check whether the company
has sales tax enabled: **`get_ledger_settings`** answers it from the ledger
itself in one read, on QuickBooks or on Xero (`sales_tax_enabled`). The company
profile in COMPANYNAME.md may also state it; `get_company_profile` does not,
because it reads the NumbersGame record and never touches the ledger. Treat
`sales_tax_enabled: null` as "not known", never as "off" — off is the answer
that licenses posting without a tax code.

Two things were measured against a live California company with automated sales
tax, and both are counter-intuitive:

- **Tax comes from the LINE, not the header.** Set `TaxCodeRef` inside each
  taxable line's `SalesItemLineDetail` (`"TAX"`, or a specific code). Omit it and
  QuickBooks silently defaults the line to `NON` and posts the document with
  **zero tax** — on a taxable customer, with no warning. Setting a tax code on
  the header alone does nothing at all.
- **Never send `TotalTax` yourself.** QuickBooks accepts whatever number you put
  there, verbatim and unchecked: a `TotalTax` of 999.99 on a 100.00 sale was
  recorded as 999.99. Set the line's `TaxCodeRef` and let QuickBooks calculate —
  it does so correctly, and it is the only party here that knows the rate.

If tax is enabled and you cannot determine the right tax code for a line, stop
and ask. A credit memo posted untaxed against a taxed invoice clears the
customer's balance and leaves the tax behind, and nobody finds out until they
file.

- `create_sales_receipt` / `get_sales_receipt` / `search_sales_receipts` / `update_sales_receipt` / `delete_sales_receipt` — Revenue **paid at the time of sale**. One document, no A/R. Use instead of invoice-plus-payment whenever the money arrived with the sale.
- `create_credit_memo` / `get_credit_memo` / `search_credit_memos` / `update_credit_memo` / `delete_credit_memo` — Credit issued to a customer against an existing or future invoice. **Does not apply itself** — see Linking Rules.
- `apply_credit_memo` — Apply an existing credit memo to one or more open invoices. This is the second half of every credit memo. It reports whether the A/R aging actually moved; if it did not, the credit did not land, and you must say so rather than treating the tool's success as the answer.
- `unapply_credit_memo` — Take a credit note back off an invoice on **Xero**, returning the credit unspent and the invoice to AUTHORISED with its full amount owing. Name the credit note and the invoice; a credit spread over several invoices loses only the one you name. This is how an invoice blocked from voiding by a credit note gets voided. On QuickBooks it refuses by name: there the application is a Payment carrying both documents, so `void_payment` on that Payment is the undo.
- `create_refund_receipt` / `get_refund_receipt` / `search_refund_receipts` / `update_refund_receipt` / `delete_refund_receipt` — Money actually returned to a customer. A refund receipt is its own document, not a reversal of a sales receipt.
- **Recurring invoices:** `list_repeating_invoices` / `get_repeating_invoice` / `create_repeating_invoice` / `delete_repeating_invoice` work on QuickBooks as well as Xero (Xero's details are in reference/xero.md). On QuickBooks, create needs a `name`, unique in the company. It always makes QuickBooks' Scheduled type, so each invoice posts to the books and AR on its date (QuickBooks has no draft invoices). Due dates follow the customer's terms; `due_date`, `due_date_type` and `status` are Xero only. Neither ledger can pause or edit a template through the API: say so, then tell the user to pause or change it in QuickBooks or Xero itself, or delete it and create the new version (delete returns the template in full).
- `get_document_pdf` — The ledger's own PDF of an invoice or estimate (on Xero an estimate is a quote), with the company's template and logo. Pass `type` (`invoice` or `estimate`) and `id`, the record's Id from `search_invoices` / `search_estimates`, not the document number. Returns a download link for the user, valid 24 hours, and an `att_` handle for `upload_attachable`, valid 1 hour. Read-only.
- **Duplicating an invoice or estimate:** there is no copy tool. Read the original (`read_invoice` / `get_estimate`) and create a new one with `create_invoice` / `create_estimate` from its customer and lines, leaving out `Id`, `SyncToken`, `DocNumber` and each line's `Id`. Show it for approval like any other create.

### Purchase Documents (write — vendor-side)

- `create_purchase_order` / `get_purchase_order` / `search_purchase_orders` / `update_purchase_order` / `delete_purchase_order` — **Non-posting.** A PO never touches the general ledger, so it will never appear on a P&L, a balance sheet, or a trial balance. If a user expects a PO to show up in the numbers, correct that expectation before posting anything.
- `convert_purchase_order_to_bill` — Turn a PO into a bill and close the PO in one step. Always use this rather than creating a bill separately: a bill raised without the link leaves the PO open indefinitely, and nothing about the books looks wrong when it happens.
- `create_vendor_credit` / `get_vendor_credit` / `search_vendor_credits` / `update_vendor_credit` / `delete_vendor_credit` — Credit from a vendor (return, overbilling, rebate). **Does not apply itself** to a bill — see Linking Rules.
- `apply_vendor_credit` — Apply an existing vendor credit against one or more open bills. Same rule as `apply_credit_memo`: it reports whether the A/P aging moved, and that report is the evidence, not the tool's success.

### Void Tools (write — prefer these over delete)

- `void_invoice` / `void_payment` — Void keeps the document and its number in QuickBooks with a zero amount, so the audit trail survives and an auditor can see the document existed and was cancelled. **These are the only two documents that can be voided through this connector, and there is no delete tool for either** — so for an invoice or a payment, void is not a preference, it is the only option. Say so plainly when a user asks to delete one.
- **Asked to void an expense, purchase or credit-card charge?** These tools do not serve one, and neither does QuickBooks: the API refuses `operation=void` on a Purchase outright. There are two honest routes and the bookkeeper picks: **`delete_purchase`** removes it, which is right for a document that should never have existed — a duplicate, a double post, an import being undone; **zeroing every line to Amount 0.00** with `update_purchase` keeps the record and its number in the books, which is right for a real transaction being cancelled and is what an auditor expects to find. QuickBooks accepts 0.00 on both create and update. **Never substitute a token amount such as 0.01**: it leaves a real one-cent expense that reads as a genuine transaction and has to be hunted down later. Say which one you are doing and why, and get approval first — both are writes.
- **Delete exists for only some document types.** You can delete deposits, transfers, sales receipts, credit memos, refund receipts, purchase orders and vendor credits. You **cannot** delete bills, purchases, journal entries, estimates, bill payments, customers or vendors — those have no delete and no void here, deliberately, to keep the tool surface small. Correcting one of those means updating it in place with the matching `update_*` tool, or removing it in the QuickBooks UI. Say which, rather than reporting that you cannot do it.
- **If COMPANYNAME.md forbids deletes**, use the zero-out route for a purchase that should never have existed (memo `Duplicate of <id>`). Send other removals to the QuickBooks UI as a manual step.
- Deleting removes the record entirely, including its document number. Before deleting anything a client's books depend on, say what will be lost and confirm. Where the user's real intent is "cancel this but keep the record", only invoices and payments can do that here — everything else means the QuickBooks UI.
- **On Xero, a document with anything allocated to it cannot be voided at all**, and the fix is one step, not a dead end. Measured 2026-09-11: read the invoice, then take the allocation off — `delete_bill_payment` for a payment, `unapply_credit_memo` for a credit note — and the document drops straight back to AUTHORISED with its full amount owing, ready to void. The credit is returned to the credit note, unspent. **The one case that needs Xero itself:** a payment already reconciled against a bank statement line, which has to be un-reconciled there first — that is what Xero's "remove and redo" message means. Say which of the two it is; do not report the void as impossible.

### Reconciled transactions — and the two ledgers behave oppositely

A transaction that belongs to a **finished** bank reconciliation is the one place where QuickBooks and Xero need completely different handling, and getting it wrong is expensive in a way nobody notices for a month.

**On Xero, the ledger refuses and says so.** A bank transaction matched to a statement line cannot be edited, deleted or unreconciled through the API at all — Xero answers *"This Bank Transaction cannot be edited as it has been reconciled with a Bank Statement."* The route out is one trip to Xero: Bank accounts → the account → Reconciled tab (or Account transactions) → **Remove & Redo**. The call then works from here. Xero's API has no reconcile, no unmatch and no statement lines, so this is not something to work around; it is a step the user takes.

**On QuickBooks, the ledger does NOT refuse — so this connector does.** Measured 2026-09-16: QuickBooks accepts an update and a delete on a fully reconciled transaction and reports **success**. Nothing warns, nothing fails, and no field on the record says it was reconciled. The only thing that changes is that the reconciliation silently stops balancing, by exactly that transaction's amount, and the bookkeeper meets it at next month's reconcile screen.

So `update_*` and `delete_*` on a bank-affecting document check first and refuse with `reconciled_in_ledger`. Two routes, and **the user picks — say which you are proposing and get approval, as with any write**:

1. **Undo the reconciliation, change it, reconcile again.** In QuickBooks: Accounting → Reconcile → History by account → the period → Undo. This is the right route when the change is a correction and the books should stay balanced.
2. **Proceed deliberately** — repeat the same call with `reconciled_change_reason` saying why. Only when the user has decided the change is right AND knows they are re-doing that reconciliation. It is recorded against the company.

**Look before you write, especially in a batch.** `qbo_report_transaction_list` with `include_cleared_status: true` returns a `Clr` column for every row, so one report tells you which of thirty items will refuse — instead of thirty refusals. On Xero the same triage is `search_bank_transactions`, which carries `is_reconciled` per row.

**Read `Clr` correctly. Three values, and two of them are not "reconciled":**

| `Clr` | means | can you change it |
|---|---|---|
| `R` | **Reconciled** — a reconciliation was finished | refused; use one of the two routes above |
| `C` | **Cleared** — ticked only: saved-for-later, matched from a feed, or one click in the register | yes, nothing blocks it, and nothing is out of balance |
| empty | not cleared — **or a document that has no cleared state at all** | yes |

That last row matters: every Bill, Invoice, Credit Memo and Vendor Credit reads empty, because they never touch a bank account directly. **Empty does not mean "safe to assume unreconciled" for a document type you have not checked**, and it is never evidence that a bank account is unreconciled.

**Do not over-apply this.** `C` is not `R`, and a transaction outside a reconciled period is ordinary work. Do not warn a bookkeeper about reconciliation when nothing refused, and do not offer to reconcile from here — neither ledger exposes reconciling through its API, and on Xero setting the flag directly creates a record that can never be edited again.

### Send Tools (write — these leave the building)

- `send_invoice_email` / `send_estimate_email` / `send_purchase_order` / `send_sales_receipt` / `send_credit_memo` — QuickBooks emails the document, from the client's own QuickBooks sending identity and template. **This is the only category of action in this skill that a third party sees, and nothing can undo it.** Sending is off unless the firm has enabled it; where it is off the tools return `send_not_enabled`. Where it is on, **your approval is the only check on an address already on file**: a send to the customer's or vendor's address, unchanged, goes straight out. The server refuses recipient fields (`BillEmail`, `BillEmailCc`, `BillEmailBcc`, `POEmail`) on every write (`recipient_field_refused`), and a send to an address changed or typed here (an updated customer or vendor email, or the optional `send_to`, which replaces the address on file) is held with `recipient_unconfirmed` until a person confirms it in NumbersGame → Firm settings → Document sending → Recipients. A typo in `send_to` is held, not sent; check the address with the user anyway. Read the sending rules under Always/Never before using any of these.
- **A successful reply means QuickBooks ACCEPTED the send, not that the mail arrived.** `EmailStatus=EmailSent` and the `DeliveryInfo` timestamp are both written the instant Intuit takes the request, before anything leaves; the mail is queued and goes out afterwards. Report it as sent, never as received or delivered, and if it matters that a document arrived, the only way to know is to ask the recipient.
- **Never delete or void a document you have just sent — it cancels the queued email.** Measured on 2026-08-16: two sends reported `EmailSent` with a `DeliveryInfo` timestamp and never arrived, both deleted seconds later; an identical send left in place arrived. If a send needs undoing, the email is already gone or already cancelled, and deleting decides which — so leave the document alone and tell the user what happened instead.
- `list_overdue_invoices` / `send_overdue_invoice_reminders` — Overdue reminders, QuickBooks and Xero. `list_overdue_invoices` lists every open invoice past its due date by any number of days, with the customer, invoice number, amount due, days overdue and the email address the reminder would go to. On Xero only approved (AUTHORISED) invoices are listed, and the address is the contact's email, because Xero always mails the contact. A Xero send that fails with a 400 usually means the organisation's plan has no API invoice email (Partner Edition). Show the user that whole list, every address included, and get one explicit yes. `send_overdue_invoice_reminders` then sends the approved ids in one call, at most 50 per call (send the rest in another call). This is the one exception to one document per approval: one yes covers that list and only that list, so ask again for anything added. Each invoice gets the same send as `send_invoice_email`: one held with `recipient_unconfirmed` is not sent, does not stop the others, and is passed on to the user as above. Never delete or void a reminded invoice straight after: it stops the queued mail.

### Bulk Posting

- `bulk_create_transactions` — Post many `Purchase` and `Deposit` rows in one call, used by the bank CSV import workflow (Workflow 6). Supports `dry_run` for a validation pass that posts nothing. Returns an **import run id**. A large import may return `status: "posting"` and keep going: check it with `get_csv_import_run`. Never call this outside Workflow 6, and never send the same file again, while it posts or after.
- `get_csv_import_run` — The progress and result of a statement import, by its run id, while it posts and after. Read-only. Call it until the status is `complete`, waiting `check_again_in_seconds` between calls.
- `reverse_csv_import` — Undo an entire import by its run id. This is the only clean way back from a bad import: without it, every posted row has to be removed by hand in the QuickBooks UI. Always give the user the run id after an import, and offer this rather than manual cleanup when something is wrong.
- `list_held_statement_lines` — Statement lines an import HELD instead of posting, because the coding check flagged them and nobody had answered yet. They are on the statement and not yet in the books, and they stay held across conversations until resolved. Grouped per import, re-checked now, each saying what clears it: `an_answer`, `its_own_answer` (a sentence about that line), `a_fix` (recode or dismiss), or `nothing`.
- `resolve_statement_lines` — Post (approve, optionally recoding the category, vendor or class) or dismiss held statement lines, many in one call. Each line is checked again and looked for in the register before it posts. A line that needs its own answer takes only that decision's own `reason`, never the batch `reason`. Dismiss needs a reason (for example, already entered by hand). Only resolve what the user decided.

### Account & Entity Management Tools
- `create_account` / `update_account` — Create or modify chart-of-accounts entries
- `create_customer` / `get_customer` / `update_customer` — Manage customer records. **There is no delete**
- `create_vendor` / `get_vendor` / `update_vendor` — Manage vendor records. **There is no delete**. Set `Vendor1099: true` at creation for any contractor who may need a 1099. A contractor created without it looks correct all year and surfaces in January, when the 1099s do not generate and the payments have already been made. Never ask for a TIN, EIN or SSN, and never pass one: a tax id typed into a chat is dropped and the reply says so. The TIN goes in the ledger from the vendor's W-9; `get_vendor` shows its type and last 4, so a 1099 vendor with none on file is an open item to flag
- `create_employee` / `get_employee` / `update_employee` — Manage employee records (on Xero: `get_employee` reads Xero UK Payroll; create and update refuse)
- `create_item` / `read_item` / `update_item` — Products and services used on invoices, bills, and purchases

### The shape of a transaction line (what 2010 and 2020 actually mean)

QuickBooks rejects a misplaced property with `2010 Request has invalid or unsupported property`, and **its `Property Name:` field is empty every single time**. It will not tell you which property is wrong. Do not go looking for it by dropping one field per call: a bookkeeper spent nine `create_deposit` calls in fourteen minutes doing exactly that and posted nothing.

- **Refs go INSIDE the line's detail object**, whose key matches the line's `DetailType`. Only `Amount`, `Description`, `DetailType`, `LineNum`, `Id` and the detail object itself belong beside it. A ref written at line level fails the whole request.
- **The customer field has opposite names on the two line families, and this is the one that bites.** On a **deposit** line it is `Entity` inside `DepositLineDetail`, and a `CustomerRef` there is refused. On a **purchase or bill** line it is `CustomerRef` inside `AccountBasedExpenseLineDetail`, and an `Entity` there is refused. A shape that just worked on a deposit does **not** carry over to an expense — that mistake is what produced two of the fifteen failures above.
- `ClassRef` goes inside the detail object. `DepartmentRef` has no line-level home in either position — it goes on the **document**, once.
- **The connector checks the measured cases before sending** and names the property, the line number and where it belongs. When you get that refusal, **fix the one property it names and call again**; it is not a signal to start rearranging the rest of the payload.
- **A deposit line coded to Accounts Receivable must carry `Entity`.** QuickBooks asks for it as "Received From", which is a column on its deposit screen and not a field you can send; `Entity: { value: "<customer id>" }` is enough. **Check the line should be A/R first:** if this money is a customer payment already recorded in QuickBooks, coding a deposit line to A/R posts a **second** receivable instead of banking the first. A payment cannot be attached to a deposit through the API at all — that one needs the QuickBooks website.
- `2020 Required parameter ... is missing` names the **first** field QuickBooks could not find and stops there. Check the whole line before resending; supplying only the field it named is how one bad line becomes four round trips.

### Emptying a field (as opposed to changing one)

Ordinary updates are **sparse**: a field you leave out is left alone, never emptied. So there are two different moves depending on where the field lives.

- **On a line** — for most documents, sending `Line` replaces the whole line set, so you empty a line-level field by sending the array back with the same amounts and accounts and simply without it.
- **A DEPOSIT IS THE EXCEPTION, and it is the one that costs money.** Measured: QuickBooks **merges** a deposit's lines by `Id` rather than replacing them. A line carrying the `Id` that `get_deposit` returns is edited in place; a line **without** one is **ADDED on top**; a line you leave out is **KEPT**, not removed. So on a deposit you cannot clear a line-level field at all — omitting it and sending `Entity: null` both leave it standing — and you cannot remove a line. Restructuring a deposit's lines means deleting it and creating it again, which changes its document number, or editing it in the QuickBooks website. To re-code or re-price an existing line, read the deposit and send that line back **carrying its `Id`**. This is not a theoretical trap: following the old advice added a duplicate line to a real customer's deposit and doubled it, eleven times across four companies in one week. `update_deposit` now refuses a patch that would add a line or change the deposit's value unless you pass `amount_change_reason` saying you meant it — that refusal is the guard working, not an obstacle to route around.
- **At the top level** — `PrivateNote`, `DocNumber` and the like: name the field in `clear_fields`. Available on `update_deposit`, `update_transfer`, `update_payment`, `update_time_activity`, `update_invoice`, `update_item` and `update_account`.

`clear_fields` costs an extra read and rewrites the record in full, so use it only to genuinely empty a value — to CHANGE one, just send the new value. It cannot clear `Id` or `SyncToken`, and it reports an error rather than succeeding quietly if the field was not set in the first place.

### Classification Tools (Class = profit center, Department = cost center)
- `create_class` / `get_class` / `update_class` / `search_classes`
- `create_department` / `get_department` / `update_department` / `search_departments`
- `bulk_assign_classification` — Preview + execute bulk ClassRef/DepartmentRef assignment
- **On Xero:** a class is a tracking-category option and department tools refuse; see the Xero reference.
- **Set class at creation, not afterwards.** `create_bill`, `create_purchase`, `create_deposit`, `create_invoice`, `create_journal_entry`, `create_sales_receipt`, `create_credit_memo` and `create_refund_receipt` all accept `ClassRef` and `DepartmentRef` on the line. `bulk_assign_classification` is for repairing history, not for routine posting.

### Budget Tools (QuickBooks writes; both ledgers read)
- `create_budget` / `update_budget` / `delete_budget` — Build a budget, change one, remove one. **QuickBooks only** — Xero's budget endpoint is read-only, so these refuse there by name; build it in Xero (Accounting → Reports → Budget Manager) and read and report on it here.
- Lines can be given three ways, one per call: `lines` for explicit dated amounts, `accounts` for one array of amounts per account in period order (the shape a spreadsheet or a pasted CSV already has), or `spread` for a single annual figure per account divided across the periods. Where a spread does not divide exactly the **final period absorbs the remainder**, and the reply says so.
- **Pass `dry_run: true` before writing anything you did not type by hand.** It returns every line that would be written, per account and per period, with the totals and any account it could not resolve — and writes nothing. For an import from a client's spreadsheet, do this first and show the user the summary.

**A budget line can be zeroed but NEVER removed.** QuickBooks has no delete for a budget line. Lines MERGE by (period, account, dimension): a line you send replaces the matching one, and **every line you do not send is left exactly as it was** — so you never need to re-send the whole year to change one month. The corollary is the trap: leaving a line out does **not** remove it, and sending an empty list does nothing at all. To empty a line, set it to 0 and say plainly that it remains on the budget showing zero. To truly remove one, the whole budget has to be deleted and rebuilt — so getting the *accounts* right matters more than getting the numbers right first time.

**Only profit-and-loss budgets can be created.** QuickBooks' API accepts a balance-sheet budget and silently stores a P&L one instead, so `create_budget` refuses rather than hand back the wrong thing. Build a balance-sheet budget in QuickBooks itself; it can be read and reported on here afterwards. A budget may also use only **one** of class, customer or department across all its lines.

**Deleting takes every line with it and cannot be undone.** `delete_budget` needs `confirm: true` on the same call; without it you get the budget's name, window and line count and nothing is removed. The success reply carries the full contents — that is the only copy, so show it to the user rather than discarding it.

### Vendor Mapping or Bank Rules Tools (per-company vendor → account memory)
- `get_vendor_mappings` — Read this company's stored vendor → account map (vendor name, account code, account name, confidence high/low, notes, whether the vendor is never billed first or never capitalised, and the bank descriptors already known for it). **Pass `descriptors`** — the bank strings you are about to code — and the server matches them against the rules for you: ranked candidates with the evidence for each, and an explicit list of the ones that matched nothing. Consult it before classifying anything, whatever the source.
- `upsert_vendor_mapping` — Create or update one vendor → account mapping (keyed by vendor name). Persisted in NumbersGame so future reviews book the vendor's spend to the right account. It restates the WHOLE rule: anything you leave out (account, notes) is cleared. Use it to create a rule for a new vendor, passing `descriptors` with the bank string that turned out to be them.
- `add_descriptor_aliases` — Record bank strings the user confirmed against rules that ALREADY exist, every rule in one call. It only adds: the account, confidence, notes and class stay as they are. From then on each string matches its rule exactly, on statements and on the bank feed; that is what stops the same line coming back as manual review every month. A string another rule already owns is not added, and the result names that rule.

### Payroll Tools (Xero UK Payroll, read only)
- `search_employees` / `get_employee` — on a Xero company, the payroll's employees: start and end date, whether on payroll today, employee number and the department saved for them. `search_employees` applies `Id`, `DisplayName`, `GivenName`, `FamilyName` and `Active` (on payroll today) there, so ask for the person you need rather than reading the whole payroll; other QuickBooks fields are not held by payroll, and the result names any it could not apply.
- `report_payroll_costs` — headcount at each month end (joiners, leavers) and employer cost by month, department and employee, from posted pay runs by payment date; drafts are listed, not counted. **Employer cost = earnings + employer pension and benefits + employer National Insurance.** Xero's own pay run `totalCost` leaves employer NI out: never present it as what staff cost. Each run's `tiesToXero` checks the rest against it. At most 60 posted runs a call: for a longer history ask a year at a time and add them up.
- `set_employee_departments` — save which department each employee is in. Xero UK Payroll does not record a department, so this is the company's own answer, saved once and reused every month. NumbersGame data: nothing is written to Xero.

**Headcount and payroll cost by department, the workflow:**
1. `search_employees`. If it refuses, relay the refusal: the organisation does not run Xero UK Payroll, or the connection needs a Payroll Administrator to Reconnect Xero. Payroll totals by account are still available from `qbo_report_profit_and_loss`.
2. `unassignedDepartment` lists who on payroll has no saved department. Ask the user once for all of them, using the business's own department names (its tracking categories, from `search_classes`, if it books by department), and save every answer in ONE `set_employee_departments` call. Never guess a department from a job title or a name.
3. `report_payroll_costs` for the period. Present headcount by month and employer cost by department; name anyone still under "(no department saved)" rather than leaving the split short.
4. Where the business books payroll by tracking category, compare the department totals with `qbo_report_profit_and_loss_by_class` and explain a difference rather than hiding it: timing (payment date against period), accruals, and costs booked outside payroll are the usual causes.
Payslips are named people's pay. Keep individual pay out of anything shared beyond the people who asked, unless the user says otherwise.

### Task Tools (work that outlives the conversation)
- `list_tasks` — Open work recorded for this company. Read it at the start of a session: it is where an unfinished item from last time is written down.
- `create_task` — Record something that needs doing and is not being done now. Anything you promise to follow up belongs here rather than in a sentence the user has to remember. **A title that says daily, weekly, monthly, quarterly, annually, recurring or "every month" is REFUSED**, and deliberately: `create_task` files a SINGLE task that can never repeat, so one filed against a recurring obligation is never completed and never comes back — it just rots. Ask the user which they meant before you call: (1) do it now, and you perform the work instead of filing anything; (2) track it once despite the wording, which is `create_task` with `intent: 'one_off'`; (3) set up the real cadence, which is `create_task_schedule`. Do not pick for them — the wording is ambiguous and only they know. This refusal fired eight times in the week to 2026-09-12, every one of them a round trip that asking first would have saved.
- `update_task_status` — Close or re-open one. A task nobody closes stops being read.
- `create_task_schedule` — A recurring task on a cadence (a monthly close step, a quarterly filing). The portal shows these under Automations.

### Report Run Tools (storing what you produced)
- `list_report_types` — The kinds of report this firm has defined.
- `start_report_run` — Open a run BEFORE producing the output, so a long piece of work has somewhere to land.
- `complete_report_run` — Store the finished text against the company. This is what makes a report readable in the portal afterwards; a report that exists only in the chat is gone when it closes.
- `list_report_runs` / `get_report_run` — What has been produced before, and its text. Read these before regenerating something that may already exist.

### Report Template Tools (the firm's own report, filled by the server)
When the user asks for one of the firm's standard reports ("run the monthly report for September"), use the firm's report template instead of building the report yourself: every run then has the same numbers in the same layout.
- `list_report_templates` — The firm's approved templates: what each contains, its calculations and its commentary slots. Pick the one the request names; if none fits, say so and build the report the usual way.
- `run_report_template` — Runs one for this company and month (YYYY-MM). The server pulls the ledger, does every calculation and fills the firm's Excel or Word layout. Never compute, re-type or "correct" a figure: the numbers in the result are the report. It returns the report as markdown with each commentary slot shown as `[[slot:id]]`, the values each slot may use, warnings for anything left blank, and a download link.
- `write_report_commentary` — Writes the slots, using only the values the run returned. Written text is never overwritten. It also finishes a report someone ran from the portal button or a schedule (it reads "Commentary N not written").
- `set_report_account_group` — Maps a firm group a template names ("Marketing") to this company's accounts. A blank value with a warning means the group is not mapped: propose the accounts from `search_accounts`, confirm them with the user, map, then run again.
- `get_report_run` on a template run also returns its values and a fresh download link: answer follow-up questions about an earlier report from those, without running it again.
- A template is uploaded, checked and approved in the portal (Prompts & instructions, Report templates), not in the chat. If the tools say report templates are not switched on for the firm, write the report from the ledger's reports and store it with `start_report_run`.
- The deliverable is the download link, in the format the user asked for (Excel or Word, PDF, Markdown, text); every format is also on the report's page in the portal.

### Library Tools (the firm's prompts, instructions and report templates)
Everyone in the firm can read its library; only an owner or admin can change it (if not, the tool says so and who can). A change is live at once unless saved as a draft, and every version is kept.
- `list_library` / `get_library_entry` — Read the library before writing a prompt or instruction from scratch: the firm may already have one. `get_library_entry` also shows an entry's history and, for a report template, its layout as text.
- `save_library_entry` — Create or change a prompt or instruction. It publishes at once; pass `publish: false` to leave a draft for someone to review. Publishing an instruction changes the file of every company it is attached to: tell the user which companies the result names.
- `publish_library_draft` / `discard_library_draft` — Publish or throw away an entry's pending draft.
- `revert_library_entry` — Restore an earlier version; it comes back as a new version. This is how a mistaken change is undone.
- `delete_library_entry` — Delete a prompt or instruction. An instruction still attached to companies cannot be deleted: the refusal names them.
- `attach_instruction` — Put an instruction into this company's file, or take it out.
- Categories: `create_library_category`, `rename_library_category`, `delete_library_category` (only an empty one; built-in categories are fixed).
- Onboarding and initial-checks questions (`get_onboarding_setup` lists them with their ids): `add_onboarding_question`, `rename_onboarding_question`, `delete_onboarding_question`, `add_onboarding_answer`, `rename_onboarding_answer`, `delete_onboarding_answer`, and `set_onboarding_prompt_answers` for which answers select each onboarding prompt.
- NumbersGame standard prompts: `copy_library_standard` (the firm's own editable copy), `hide_library_standard`, `offer_library_standard`.
- Converting the firm's own report into a template: have the user upload it (`request_attachment_upload`), create it with `create_report_template` (`file_handle`), read its layout with `get_library_entry`, then `revise_report_template` to replace each typed figure with a marker and write the Definitions, describing every value in plain words. Fix any problem the check names. Run `preview_report_template` on a real company and month, show the user the result, and `approve_report_template` only when they agree.
- A prompt that describes a report can become a template too: `create_report_template` with a `brief` (the layout) and `definitions`.

### Slack Tools
- `refresh_client_canvas` — Rewrite this company's Slack canvas from current data. Use after a close or a material change, so the channel's pinned summary is not stale.

### Search & Lookup Tools

**Some obvious fields are not filterable, and QuickBooks decides which.** A search tool refuses a field its entity cannot be queried on, by name, before spending the call — so read the refusal rather than retrying with a synonym. The two that catch people, both measured:

- **A transfer can only be filtered on `Id`, `TxnDate` and the `MetaData` timestamps.** Not `Amount`, not `FromAccountRef`, not `ToAccountRef` — which is nearly everything interesting about a transfer. To find one by amount or by account, filter a date range and read the rows.
- **A journal entry adds `DocNumber` and nothing else.** `PrivateNote` is not queryable, so you cannot search for the note you wrote on it. If you need to find entries again later, put the marker in `DocNumber`, which is.

- `search_purchases` / `search_deposits` / `search_transfers` / `search_journal_entries`
- `search_invoices` / `search_bills` / `search_customers` / `search_vendors`
- `search_bill_payments` / `search_estimates` / `search_employees` / `search_items`
- `search_sales_receipts` / `search_credit_memos` / `search_refund_receipts`
- `search_purchase_orders` / `search_vendor_credits`
- `search_bank_transactions` — Transactions **already posted** to a QuickBooks bank or credit-card account (Purchases, Deposits, Transfers, Bill Payments, Payments, Journal Entries). This is the QuickBooks **register**, NOT a bank feed: it shows what someone has already entered, not what the bank reports. See "Where bank data comes from" below before using it to answer a question about "the bank".
- `search_classes` / `search_departments`
- `search_accounts` — Chart-of-accounts lookup (also serves as the QBO connectivity check)
- `search_help` / `get_help_article` — NumbersGame's own help center (SOPs, help pages, prompts, this skill), not the books. For "how do I…" questions; see **When the user asks how to use NumbersGame**
- `submit_feedback`: reports to the NumbersGame team that a tool **failed or could not do the job**. Two calls: the first only shows the text; the second sends it after the person agrees. See **When a NumbersGame tool fails**
- `get_purchase` / `get_deposit` / `get_transfer` / `get_journal_entry`
- **To read many records, use one search, not many `get_` calls.** Pass their ids to that type's `search_` tool as `criteria: [{field: "Id", operator: "IN", value: [the ids]}]`, and make QuickBooks calls one at a time rather than in parallel: QuickBooks rate-limits a parallel burst (code 3001). Customer payments have no search tool; list them with `search_bank_transactions` on the account they were received into.

### Bank Feed Tools — the booking pipeline, not a place to read from

Use these ONLY to bring new bank activity into the books: the user asks to
update the bank, reconcile the bank, code the bank feed, or book bank
transactions. They are not how you answer a question about what is on an
account — see "Where bank data comes from" below.

They work only where bank connections are already set up for the firm.
Everywhere else they return `plaid_not_enabled` or an `insufficient_scope`
error. That is expected, it is not a fault, and it is not something the user
can fix by reconnecting. Do not present it as a feature they can switch on.

**Never call these to find out whether a company has bank data.** A question
about what is on an account is answered from QuickBooks (`search_bank_transactions`,
see "Where bank data comes from"), whether or not a feed exists. Reach for
`list_plaid_accounts` only once the user has asked to update, code or book the
bank, or for an account's balance (below) -- on a firm without the feed, calling it
first for anything else is a refusal and a wasted round trip, and the answer was
in QuickBooks all along.

**An account's balance: the books first, the bank beside it.** Answer a balance
question from the ledger, as above. Where the company has bank connections,
`list_plaid_accounts` also gives each account the bank's own balance as Plaid last
saw it (`balance`, with `as_of`, about daily, at no cost): add it beside the book
balance as "per the bank, as of <date>", with the difference, which is what is not
yet reconciled. On a credit card or loan the bank's `current` is the amount owed.
Only when the user then asks for a live, right-now bank balance, use
`refresh_live_bank_balance`. Its first call returns the cached balance and a
`confirm_token` and uses nothing; call again with the token only when they confirm.
Each company has 10 live refreshes per calendar month (UTC), one per bank login,
the same for every firm, and every answer says how many are left and when they
reset. With none left, say when they come back and give the cached balance; there
is no way to get more, so do not offer one.

- `list_plaid_items` / `list_plaid_accounts` — Which banks and accounts are connected to this company, with each account's bank balance as Plaid last saw it (`as_of`)
- `refresh_live_bank_balance` — One bank login's balance fetched live from the bank, only when the user asks for it: first call previews (cached balance + `confirm_token`, nothing used), the second, confirmed call fetches. 10 per company per month
- `plaid_sync_status` — Per-bank freshness: `last_synced_at`, `needs_reauth`, `error_code`, `lifecycle_state`
- `search_plaid_transactions` / `plaid_transactions_summary` — The bank feed itself
- `propose_bank_coding` / `preview_bulk_classification` — Proposed coding for unbooked lines. `propose_bank_coding` also returns `possible_duplicates_after_booking`: an entry NumbersGame did not create, on the same register, for the same amount within 3 days of a line booked in the last 45 days. It is usually the ledger's own bank feed adding that line again. It is a warning, never a hold: tell the user to open both entries in QuickBooks and delete the one NumbersGame did not create. Registers that could not be read are listed in `possible_duplicates_check_skipped`
- `book_bank_transaction` / `bulk_book_bank_transactions` / `reverse_bank_booking` — Write bank lines into QuickBooks (approval required, as with every write)
- `list_held_bank_transactions` — Lines coded earlier and held for review, with the coding that was chosen. **Call this first in any bank session**, and `list_held_statement_lines` too, where the company imports statements: a hold made in a previous conversation is stored, so the categorisation does not have to be worked out again
- `get_booking_run` / `update_booking_run` / `post_booking_run` — The booking run `propose_bank_coding` opens: read it (`latest: true` resumes it in a new conversation), change lines before posting, and post the lines the user has seen and confirmed: lines held on score, and lines held on a veto a person is entitled to answer
- `set_accounting_policy` — Set this company's accounting basis, capitalization threshold, applicable-financial-statement answer, or strict bill matching. Ask the user for the value; never choose one yourself
- `mark_plaid_transaction_ignored` / `report_bank_booking_run` / `propose_never_billed_vendors`
- `propose_descriptor_aliases` — The feed's near misses: bank strings the feed could not code although one of the company's own rules plainly describes them, grouped by rule with the money at stake and the words that matched. Read-only. Show them to the user, and record the ones they confirm with `add_descriptor_aliases` in one call. Run it when many feed lines sit in review for want of a rule.

### When the feed holds a line

**A hold is a question, not a wall.** Booking returns `status: "held"` with a
`reason`, a `vetoes` list and, from `list_held_bank_transactions`, a `reasons`
list in plain language and a `clearance` telling you what that line needs. Read
the clearance. It is the server's own answer and it is more reliable than
reasoning from the veto name.

**Show the user the reasons, never the veto names.** `already_in_general_ledger`
means nothing to an accountant; "QuickBooks already has a $2,317 purchase for
this vendor on 12 August" is something they can answer. The `reasons` field is
written for exactly this.

| `clearance` | What it means | What you do |
|---|---|---|
| `none` | held on score alone, nothing structural | show it, and on their confirmation post it with `post_booking_run` |
| `sweepable` | a judgement a person may overrule | same, and these MAY go in one batch — see "approve all" below |
| `confirm` | a judgement, but one where a wrong post duplicates money | show that line **on its own**, and send the user's own sentence for that line in `post_booking_run`'s `line_reasons` |
| `correct` | the coding itself is wrong | resend it fixed with `book_bank_transaction` — name the destination register, correct the splits |
| `ignore_only` | payroll | never post it; `mark_plaid_transaction_ignored` |
| `settable_in_chat` | the accounting basis has never been stated | ask the user cash or accrual, then `set_accounting_policy` |
| `needs_setting` | a company setting only the portal has | say which, and who can change it |
| `blocked` | QuickBooks could not be read, or nothing moved | retry once, then report it as a connection fault |

Bank feed: `propose_bank_coding` opens a run and writes nothing to the books.
Show the user the lines that need their yes, grouped, with the reasons. Changes
go through `update_booking_run`; its result is what you show next. Post with
`post_booking_run { run_id, review_token }` only after the user's yes to the
lines you showed; it posts the stored coding, so never re-type it. Follow
`state`: `show` means some lines changed or were not shown, so call
`get_booking_run` and ask again; `confirming` means settle the unconfirmed lines
with `reverse_bank_booking`; `done` means report the per-account counts from
the result, including every line left for the user and why. In a new
conversation, `get_booking_run { latest: true }` resumes the work, but a yes
from an earlier conversation does not carry over: show and ask again.

**"Approve all" is a normal thing for a user to say, and you should honour it.**
List the held lines with their reasons first, wait for the user, and when they
say to approve them, post exactly those lines in one `post_booking_run` call,
with the `review_token` from the result that showed them. Never approve a line the user has not been shown. A reason is optional for
`sweepable` lines — do not manufacture one, though offering to record what the
user actually said is good practice.

**The `confirm` three cannot travel in that batch, by design.** They are
`already_in_general_ledger`, `capital_expenditure` and `transfer_leg_missing`,
and each needs the user's own sentence about that specific line, sent in
`line_reasons` for that line. If you sweep them the server refuses those lines by name and
tells you to put them to the user individually. Do that rather than retrying.

- `already_in_general_ledger` — QuickBooks already records this event. Usually
  the right answer is not to post at all: `mark_plaid_transaction_ignored`. Post
  it only if the user says the existing entry is a different transaction.
- `capital_expenditure` — over this client's de minimis threshold, so a person
  decides whether it is a fixed asset. Put both options to them: the account the
  rule proposes, and the asset account the hold already names. If this vendor
  can never sell property — an insurer, a landlord, a tax authority — an owner
  or admin can mark its rule *"never a capital purchase"* on the company page,
  which stops it recurring.
- `transfer_leg_missing` — Plaid calls this a transfer and no matching leg was
  found in any connected account. Ask where the money went. If it is another
  register, resend as a `Transfer` naming it and the hold clears outright. If it
  is not a transfer at all — an owner draw, a payment to an account we do not
  sync — that is a judgement, so confirm it with a reason.

**Payroll is never posted from the bank feed.** The provider posts a journal
entry — gross wages, employer taxes, deductions and net cash, split out — and the
bank line CLEARS that journal rather than creating an expense. Booking it as
wages duplicates the largest single cost most of these companies have. Approving
does not reach it, whatever anyone says. Offer `mark_plaid_transaction_ignored`
instead: the journal is the record, and the bank line is marked accounted for.
Do not send the user to QuickBooks for this.

**`accrual_unmatched_open_bill` — the accrual rule, as it now stands.** On
accrual, money out is normally settling a bill that was entered when the invoice
arrived, so coding the payment as a fresh expense double-counts. The feed
therefore holds a money-out line when **this vendor has an open bill and none of
them fit the payment** — unsettled AP that this payment might be. A vendor with
**no open bill at all** posts as a direct expense, because there is nothing for
the payment to have settled: restaurants, travel, subscriptions and the rest of
what a feed mostly carries.

It is `sweepable`, so a user who has looked at the lines can clear them. Before
they do, `search_bills` for that vendor is worth showing: if a bill is open, book
the line against **that bill** rather than approving past it. Settling a real
bill is always the better answer.

**`accrual_no_open_bill` is the same rule in its strict form**, and it appears
only for a company whose owner has turned **strict bill matching** on, where
every unmatched money-out line holds. It is `confirm`, not `sweepable`: that
company asked to hold these, so clear them one at a time with a reason. The
`never_billed` flag and the unbilled ceiling apply only in this mode, and both
are set by an owner or admin on the company page — you cannot set either, so say
so plainly rather than offering. `propose_never_billed_vendors` is read-only and
hands them a candidate list.

**`basis_not_set` is now yours to fix, with the user's answer.** The feed refuses
to auto-post for a company where nobody has stated cash or accrual. Ask which it
is and call `set_accounting_policy`. **Never choose the value yourself.** Setting
it to cash makes the accrual rule unreachable, which makes it the fastest way to
clear a hold and a serious misstatement of a client's books. It is the
accountant's answer, not yours.

**`multiple_candidate_bills` cannot be resolved by naming the bill yourself.**
When several of a vendor's open bills fit a payment on amount and date, the
matcher deliberately picks none: choosing one leaves the other permanently open
and that vendor's AP wrong. Passing a `matched_doc_id` to force the choice does
not help — the server checks the id you send against the bill **it** matched, and
since it matched none, your id disagrees and you get `bill_match_mismatch`
instead. Show the user the candidates from `search_bills`, let them say which
one it is, and settle it against that bill. If they say it is none of them, the
line is `sweepable` and they can approve it.

**When `bill_lookup_failed` is present, distrust anything else the hold says
about bills.** It means the open-bill query itself failed, so what you are
looking at is not "there is no bill" but "we never managed to ask". Repeating it
to the user is a false statement about their books. Say the lookup failed, retry
once, and if it keeps failing treat it as a connection problem and stop. The
same applies to `gl_lookup_failed`. Neither can be approved past, and that is
deliberate: approving is posting blind.

**Held because the connection posts nothing** (`propose_only`) is not a veto and
approving does not reach it either. The refusal names the portal setting; an
owner or admin changes it on the bank's page.

**NEVER ROUTE AROUND A HOLD WITH A GENERIC QUICKBOOKS TOOL.** If the feed
refuses a line, do not create the same entry with `create_purchase`,
`create_transfer`, `create_deposit`, `create_bill_payment` or `create_journal_entry`.

Those five now REFUSE a write that matches a bank line the feed has not booked,
and name the transaction — so in the common case you will be stopped rather than
trusted. **Treat that refusal as the finding, not as an obstacle:** book the line
with `book_bank_transaction`, or clear the veto that is actually holding it.

**Being allowed through is not evidence you were right.** The refusal matches on
amount, direction and a five-day window, so an entry that differs slightly still
posts, and it still leaves the bank line unbooked for the next run to offer
again. The rule is the rule; the refusal is a backstop under it.

`not_a_bank_line` exists for the genuine exceptions — a correcting entry, an
accrual reversal, an entry predating the connection. It takes a written reason
and is logged. Reaching for it because a refusal is inconvenient is the exact
behaviour that caused this: on 2026-08-22 routing around a hold put **$91,573.59
of duplicate transfers** into one live client ledger, entered with a note saying
it had been verified — it had not — and three months of the same on another
produced five more duplicate pairs. The bypass duplicates because
`book_bank_transaction` claims a line before it writes and these tools do not:
called twice they create two entries and nothing notices.

If you cannot clear a hold, say what is stopping it **in the user's language**,
say who can change it, and stop. "Held on a veto" is not a report; "this needs
the bank account mapped to a QuickBooks register, which an owner or admin does
on the bank's page" is.

---

### PDF Output Tools (branded deliverables)
- `qbo_generate_board_report` — Financial summary for stakeholders. Pass `period_start` and `period_end`; the server reads revenue, net income and the Balance Sheet totals from the ledger, so do not copy them into the call. `cash_position` is still yours to supply
- `qbo_generate_close_report` — Close checklist, adjustments, sign-off. Pass `period_end`; the server reads the Trial Balance and Balance Sheet totals from the ledger, so do not copy them into the call
- `qbo_generate_reconciliation_report` — Bank reconciliation with matched/unmatched items. Pass `bank_account_id` (from `search_accounts`), `statement_ending_date` and `statement_ending_balance`; the server reads the GL balance and computes the difference, so `gl_ending_balance` and `difference` are not needed
- `qbo_generate_issues_report` — Miscategorizations, duplicates, anomalies

The close, board, reconciliation and issues report tools each return two things: a signed download link for the user, valid 24 hours, and an `att_` handle for `upload_attachable`, valid 1 hour, to attach the PDF to a transaction.

If a result says a figure is "not verified against the ledger", tell the user which figure and why: the ledger read failed or an input was missing, so the PDF prints your figure marked unverified.

### Attachment Tools

Two kinds of attachment, and they take different routes. Both work on QuickBooks and Xero.

- `generate_attachment` — Server-side PDF/XLSX generation for a document **you** compose: a supporting memo, a schedule. The close, board and reconciliation reports are not built here: they have their own tools (PDF Output Tools above), which read their figures from the ledger. Returns a **handle** (`att_<32 hex>`). Handles expire after 1 hour. Max 25 MB.
- `request_attachment_upload` — For a file **the user already has**: the PDF they attached to this conversation, a scan, a receipt photo. Returns a one-time upload URL on this connector's own server. PUT the file's bytes to it from your code-execution sandbox (`curl -s -X PUT --data-binary @<path> -H "Content-Type: ..." "<url>"`), and the response gives you a handle. Single use, expires in ten minutes. The handle itself expires 1 hour after the upload: call `upload_attachable` straight after each PUT (upload, attach, then the next file), not as a batch later -- an expired handle means uploading the file again.
- `upload_attachable` — Attaches a handle from **either** of the above, or from `get_document_pdf` or the close, board, reconciliation or issues report tools, to the transaction.
- `get_attachments` — List what is already attached. Check this first, for the reason below.

**Never re-type a user's document into `generate_attachment` and attach it as the original.** You can read their PDF and write a summary of it — say that is what it is. A transcription that looks like a source document is worse on a ledger than no attachment.

**The filename matters, and the ledgers differ. Measured 2026-09-03:**

- **Xero addresses attachments by filename.** Uploading a name the document already carries REPLACES that file, silently and unrecoverably. The connector refuses this collision and tells you; pick a different filename, or pass `overwrite: true` only when the user has said they want the old one replaced.
- **QuickBooks keeps both.** The same name twice leaves two attachments with different ids. Nothing refuses it, so run `get_attachments` first and do not quietly leave duplicates.

If your environment cannot make outbound requests, say so plainly and tell the user to attach the file in QuickBooks or Xero directly.

### Time Tracking
- `create_time_activity` — Record billable or payroll hours against a customer, employee, or vendor. Find one again with `search_time_activities` and correct it with `update_time_activity`. **There is no delete**, and time activities do not appear in the transaction list or the general ledger, so `search_time_activities` is the only way to see one again. Read the fields back before posting anyway — hours and dates are easy to mistype and easy to miss later.

---
