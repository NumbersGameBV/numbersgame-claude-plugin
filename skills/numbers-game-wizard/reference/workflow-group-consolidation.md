## Workflow 10: Consolidate a Company Group

**Trigger:** the user asks for consolidated, combined or group-level figures
for a company group (a `pc_` id).

**Rules first**

- One call: `report_group_consolidated` with the group's `pc_` id. Never add
  up per-entity reports by hand.
- It reads every member on its own ledger, one set of ledger reads per
  member. Do not call it again just to reformat the answer.
- An out-of-balance `balance_check` is a finding. Report its difference;
  never call it rounding.
- A gap (a member not read, a rate not found, a profit that could not be
  computed) is a gap, never a 0. A result with gaps is partial: say so on the
  combined figures.
- Intercompany balances are flagged, never eliminated. Apply eliminations
  only as the group's rules describe them.

**Steps**

1. `get_company_profile` with the `pc_` id: the members, the parent and the
   reporting currency. If no parent is marked and the members' currencies
   differ, ask which currency to report in, or record the parent with
   `set_group_structure`.
2. `report_group_consolidated` for the period. Pass `accounting_method` when
   the group's rules name one; otherwise each member runs on its own basis,
   and the result says which.
3. Per member: its figures in its own currency, the rates used and their
   source. Then the combined P&L and balance sheet, then the equity
   roll-forward with the translation difference on its own line.
4. Then the `balance_check`, every gap and note, and the intercompany flags
   with their balances.
