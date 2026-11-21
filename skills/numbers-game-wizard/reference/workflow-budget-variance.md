## Workflow 7: Explain a Budget Variance

**Trigger:** the user asks why actuals differ from the budget, or asks for a
budget variance report.

**Rules first**

- Every budget, actual and difference comes from `qbo_report_budget_vs_actuals`.
  It serves Xero too. Never rebuild them by hand.
- A cause needs evidence: a transaction, a document or the user's own word.
  Without evidence, write "cause unproven". Never guess a cause.
- A read that failed is a gap, not 0. Name the line it leaves open.
- This workflow only reports. A correcting entry is a proposal, and it needs the
  user's approval like every write.

**Materiality.** A rule in the firm's instructions or the company's .md file
wins. Without one, a line is material when either holds:

- its difference is more than 10% of its budget, or it has actual activity and
  no budget; or
- it is one of the 10 largest differences in absolute amount.

Say which rule you used.

**Steps**

1. Find the budget with `search_budgets` and pass its id. If several fit the
   period, ask which one.
2. Run `qbo_report_budget_vs_actuals` for the period, by month or as one total.
3. Pick the material lines.
4. For each material line, read the transactions behind the difference:
   `qbo_report_general_ledger` for that account and period. On Xero there is no
   general ledger here; use the per-document searches and
   `search_bank_transactions`, as reference/xero.md says.
5. Name the cause with its evidence, or write "cause unproven".

**Result: one row per material line**

- account;
- actual, budget and difference (in money and in percent), and whether the
  difference is favourable;
- the transactions behind the difference (date, party, amount, document
  number);
- the cause with its evidence, or "cause unproven".

End with the lines that were not material, as one total.
