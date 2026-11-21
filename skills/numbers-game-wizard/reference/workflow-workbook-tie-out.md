## Workflow 9: Tie a Client Workbook to the Ledger

**Trigger:** the user uploads a client schedule (a fixed-asset register, an
accruals list, a prepaid or deferred revenue schedule, a loan schedule) and
asks whether it agrees with the books.

**Rules first**

- Read the workbook and do every sum with code execution. There is no tool for
  the arithmetic. Never add figures up by eye.
- Compare the schedule and the ledger at the same date. If the workbook has no
  clear as-of date, ask.
- This workflow only reports. A difference is a lead to explain, never
  something to post away. An adjustment is a proposal, and it needs the user's
  approval like every write.
- A read that failed is a gap, not 0.

**Steps**

1. Read the workbook: each schedule's total, its as-of date, and the ledger
   account each part belongs to. If the workbook does not say, propose a
   mapping from `search_accounts` and confirm it with the user.
2. Read each mapped account's ledger balance at that date, with
   `qbo_report_trial_balance` or `qbo_report_balance_sheet`.
3. Per account: schedule total, ledger balance, difference.
4. Explain each difference from the workbook's rows and the account's postings
   (`qbo_report_general_ledger` for the account; on Xero, see
   reference/xero.md). Match rows to postings by amount and date.
5. Check the workbook itself along the way: broken formulas or error values,
   totals that do not equal their rows, rows dated after the as-of date, and a
   closing balance that does not roll forward from the opening one.

**Result.** Per account, the schedule total, the ledger balance and the
difference, then the four parts from **Every reconciliation ends the same
way**: matched, unmatched on each side, timing, and the remaining unexplained
difference. Then the workbook's own faults, each with its sheet and cell or
row.
