## Workflow 8: Business Health Check

**Trigger:** "Run a health check for <company>", or the user asks how a
business is doing.

**Rules first**

- Every figure comes with its period and its source: the report or tool it came
  from.
- Compare only with the company's own history: the same months last year and
  the trailing 12 months. Never claim an industry benchmark, a sector average or
  a "typical" figure. There is no such data here.
- A figure that could not be read is shown as missing, with the reason. It is
  never 0 and never estimated.
- Use the formulas in **KPI Formulas**. Do the arithmetic with code execution.
- This workflow only reads. Fixes go to the user as proposals.

**What to pull.** The 12 months to the last closed month, by month, and the
same months a year earlier where the books go back that far.

- `qbo_report_profit_and_loss` with summarize_column_by: Month.
- `qbo_report_balance_sheet` at each month end you compare.
- `qbo_report_cash_flow` for the same months.
- `qbo_report_ar_aging` and `qbo_report_ap_aging` at the last month end.

**What it covers**

1. **Liquidity.** Cash position. Runway, average and latest; on accrual books,
   take the burn from the cash flow statement. Current ratio. Cash conversion:
   AR Days minus AP Days, plus inventory days (Inventory / COGS × days in the
   period) when the company holds stock.
2. **Gross margin.** Gross margin % for each month, and its trend against the
   company's own prior 12 months.
3. **DSO and DPO.** AR Days and AP Days, from the aging totals. Also the share
   of AR and of AP more than 60 days past due.
4. **Bookkeeping hygiene.**
   - Uncategorised items: balances on Uncategorized or Ask My Accountant
     accounts (`qbo_report_trial_balance`), and held bank lines
     (`list_held_bank_transactions`) when the company has a bank feed.
   - Unapplied credits: credit memos and vendor credits with an open balance
     (`search_credit_memos` and `search_vendor_credits`, filtered on Balance).
   - Stale open items: invoices and bills open more than 90 days (the aging
     reports and `list_overdue_invoices`).

**Result.** A table per area: metric, value, period, source, and the change
against the company's own history. Then the three findings that matter most,
each with its figure and source. On Xero there is no cash flow statement or
general ledger here: say which figures that leaves out (reference/xero.md).
