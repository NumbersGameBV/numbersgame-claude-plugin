# Numbers Game for Claude

QuickBooks Online and Xero bookkeeping, done inside Claude. This plugin bundles
the **Numbers Game Wizard** skill with the **Numbers Game MCP servers**, so
Claude can read and (with your confirmation) write to the books of the
companies your firm has connected to Numbers Game.

Numbers Game is a service for accounting firms and finance teams, operated by
Numbers Game B.V. (Amsterdam). You need a Numbers Game account with at least one
connected QuickBooks Online or Xero company. Sign up at
<https://app.numbersgame.xyz>.

## What it does

- **Month-end close and book reviews**: trial balance, P&L, balance sheet,
  cash flow, aging, general ledger, and an issues report of what looks wrong.
- **Bank feed coding**: proposes a category for each bank transaction, then
  books what you approve.
- **Reconciliations**: payroll, Stripe payouts, bank statements imported from
  CSV, deferred revenue and revenue recognition.
- **Day-to-day bookkeeping**: invoices, bills, payments, credit memos,
  journal entries, purchase orders, time activities, vendors, customers and
  the chart of accounts.
- **Client deliverables**: board reports, close reports and supporting memos,
  as PDF or Excel, and your firm's own report templates.
- **Ramp (optional)**: read-only access to a client's Ramp business: bills,
  card transactions, reimbursements, receipts and approvals.

The skill tells Claude how to run these workflows. It asks before every change
to a ledger, shows you a preview first, and keeps reads and writes in separate
tools.

## What is in the plugin

| Component | What it is |
|---|---|
| `skills/numbers-game-wizard/` | The Numbers Game Wizard skill (`SKILL.md` and reference files for Xero, Stripe, Ramp and two long workflows). |
| `.mcp.json` | Two remote MCP servers: `numbers-game` at `https://mcp.numbersgame.xyz/mcp` (QuickBooks Online, Xero, bank feed, Stripe) and `numbers-game-ramp` at `https://ramp.numbersgame.xyz/mcp` (Ramp, read-only). |
| `assets/icon.png` | Plugin icon. |

Both servers are **remote**, reached over HTTPS (streamable HTTP). The plugin
starts no local processes and ships no `npx`, `uvx` or other launcher, so there
are no package versions to pin. The skill contains no scripts.

## Sign-in and permissions

Each server signs you in with OAuth 2.0 the first time Claude uses it: you log
in to Numbers Game and approve access on our consent screen. You can revoke
access at any time in the Numbers Game dashboard. Which companies Claude can see,
and whether it may change them, is decided by your firm's roles in Numbers Game:
a viewer, or a company set to read-only, cannot write.

The Ramp server only works for firms that have the Ramp integration switched
on. Without it, its tools reply with `ramp_not_enabled` and change nothing.

## What data it sends, and to whom

The plugin itself collects nothing. Data moves only when Claude calls a tool:

- **From Claude to Numbers Game**: the tool name and the arguments Claude
  fills in (for example a company id, a date range, or the lines of a journal
  entry you asked for), plus your OAuth access token.
- **From Numbers Game to your ledger and sources**: we call QuickBooks Online
  (Intuit), Xero, Plaid (bank feeds), Stripe and Ramp **on your firm's behalf**,
  only for the companies and sources your firm connected, and only as the tool
  call requires.
- **Back to Claude**: the records and reports the tool returns, which may
  include customer, vendor and employee names, amounts and bank transaction
  descriptions. They pass through Anthropic under Anthropic's own privacy
  terms.

What Numbers Game **keeps**:

- A usage record per tool call (firm, company, tool name, success or failure,
  duration, error code, time) for billing, support and abuse detection, plus an
  audit log of changes made to your books.
- A product-analytics event per tool call in PostHog (EU), carrying the firm
  id, company id, tool name, outcome, duration and error code. It carries **no**
  ledger records, report contents, message text or personal identifiers.
- Reports you choose to save, and generated PDFs for up to 24 hours.
- OAuth tokens for your connected ledgers and sources, encrypted with
  AES-256-GCM.

We do **not** store your ledger records, sell your data, or train AI models on
it. Data is hosted in the EU (Oracle Cloud, Amsterdam).

Full details, retention periods and your rights:
**Privacy policy: <https://app.numbersgame.xyz/legal/privacy>**

## Links

- Documentation: <https://app.numbersgame.xyz/guide>
- Support: <https://app.numbersgame.xyz/support> or support@numbersgame.xyz
- Privacy policy: <https://app.numbersgame.xyz/legal/privacy>
- Terms (End-User Licence Agreement): <https://www.numbersgame.xyz/license.html>
- Privacy questions: privacy@numbersgame.xyz

## Licence

Proprietary. See [LICENSE](LICENSE).

## Keeping the skill current (maintainers)

The skill's master copy lives in the Numbers Game app. `scripts/render-skill.ts`
regenerates `skills/numbers-game-wizard/` from the published seed, with no firm
customisation. After each skill publish, re-run it, bump `version` in
`.claude-plugin/plugin.json`, and commit.
