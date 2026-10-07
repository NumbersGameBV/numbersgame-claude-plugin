# Stripe — the Stripe connector

## Contents
- Onboarding (once per connected Stripe account)
- The revenue path decides the month
- Payouts
- Payments received outside Stripe (wire, ACH, check)
- Acting in the client's Stripe
- Reading Stripe
- Tie-out
- Not yet

**Stripe is the subledger.** Stripe invoices, customers and payments stay in
Stripe; they are never created one-for-one in QuickBooks or Xero. The books get
period totals through **Stripe Receivables** (what Stripe customers owe, an Other
Current Asset, not the ledger's A/R) and **Stripe Clearing** (the money in the
Stripe balance; on QuickBooks an Other Current Asset (setup creates one; an
existing Bank-type one also works), on Xero a current asset;
never with a bank feed). A Stripe invoice is not a ledger invoice: when the
bookkeeper says "invoice", check which system they mean.

### Onboarding (once per connected Stripe account)

`stripe_status` says when a connection is **not onboarded** (no revenue path).
Offer the onboarding; don't wait to be asked.

1. `stripe_onboarding_assess`: what is mapped and missing, candidate accounts,
   misuse flags, products (multi-month prices, prices without a revenue rule),
   whether Stripe Revenue Recognition answers, prior Stripe deposits, and the
   recommended **revenue path**.
2. Ask the three checkpoint questions **one at a time**: Is Stripe Revenue
   Recognition on? Does the client bill more than a month at a time? From which
   date should Stripe accruals start?
3. `stripe_setup_accounts`: map existing accounts first (`search_accounts`),
   create only what is missing, map payout destinations, set the cadence, time
   zone, `cutoff_date` (the start date), `revenue_path`, and, when the client
   bills multi-month on the NG path, `deferred_revenue_account`. Confirm before
   creating.
4. Revenue by product: `stripe_get_revenue_mappings`, then propose an income
   account (and class, only if the person names one) per product or price;
   save only what they agree with `stripe_upsert_revenue_mapping`.
5. `stripe_opening_balances` for the start date: show every line with its
   reason; post it with `create_journal_entry` dated the day before the start
   only after approval.
6. On the Stripe Rev Rec path, give the person the CSV from
   `stripe_revrec_mapping_csv` to upload in Stripe.

### The revenue path decides the month

- **ng_summary** (default): `stripe_propose_period_summary` → show the lines,
  the held items, the checks → on their yes `stripe_book_period_summary` with the
  `proposal_hash`. Revenue is split by the product mapping. With a deferred
  revenue account, also `stripe_propose_deferral_journal` →
  `stripe_book_deferral_journal` each month, in order.
- **stripe_revrec**: `stripe_propose_revrec_journal` (the first call asks Stripe
  to build the report; call again when it says so) → `stripe_book_revrec_journal`.
  Unmapped Stripe accounts are listed: map them (`revrec_accounts`), never guess.
- **Never both.** Booking the other path's journal is refused
  (`revenue_path_conflict`); change the path with `stripe_setup_accounts` only
  if the client changed how it books Stripe.

### Payouts

`stripe_book_payout` is the only way to book one; payouts are never in the
summary. It books the bank-feed line when there is one, otherwise a transfer
(Xero: Receive Money coded to Clearing). A feed line not arrived yet: try after
the next sync. **summary_first**: the payout would take Clearing below zero, so
book the open summary part up to its date first; `allow_negative_clearing` only
when the person says so. A deposit on the statement that is a booked payout IS
that booking: match it, never import it again.

### Payments received outside Stripe (wire, ACH, check)

`stripe_match_payment` with the bank line's amount and payer text; show the
candidates. Never choose between two customers the tool lists side by side.
Then `stripe_apply_outside_payment` for the one the person picks: it marks the
invoice(s) paid in Stripe, books Dr bank / Cr Stripe Receivables, and remembers
the payer. Partial payments: the books are updated; the person records the part
payment on the invoice in the Stripe Dashboard.

### Acting in the client's Stripe

`stripe_mark_invoice_uncollectible`, `stripe_void_invoice`, `stripe_create_customer`,
`stripe_create_invoice`, `stripe_create_subscription`,
`stripe_update_subscription`, `stripe_cancel_subscription`, and
`stripe_apply_outside_payment` all **preview first**: the first call changes
nothing and returns a `confirm_token`. Show the preview, including what it means
for the books, and call again with the token only after the person confirms.
"changed" means Stripe moved in between: show the new preview. Viewers and
read-only companies are refused. Invoices are drafts unless the person says to
finalize; Numbers Game never emails them. A subscription charged automatically
charges the card now: say so before confirming.

**Void or write off?** `stripe_void_invoice` cancels an open or uncollectible
invoice that should never have been issued (a mistake, a deal that fell
through); the period summary reverses its revenue and tax.
`stripe_mark_invoice_uncollectible` is for a real sale the customer will not
pay; it books bad debt. When the person only says "get rid of it", ask which.
A draft is deleted in Stripe, not voided; a paid invoice is never voided (a
credit note or refund in Stripe). Voiding a subscription's invoice does not
stop the subscription.

### Reading Stripe

`stripe_search_invoices` (drafts, overdue, failed payments), `stripe_ar_aging`
(adds up to Stripe Receivables), `stripe_list_subscriptions` with
`expected_deals` (are new deals set up as agreed), `stripe_list_products`,
`stripe_search_transactions`, `stripe_get_payout_breakdown`.

### Tie-out

`stripe_tie_out`: Stripe Receivables against open Stripe invoices; Clearing
against the Stripe balance plus payouts not yet booked; payouts unbooked after 3
business days; a negative Clearing with its likely cause. Report differences
with both figures. Never "fix" one with a plug entry.

### Not yet

- Other currencies are held, not booked.
- Refunds are made in Stripe.
- A permission refusal saying the account has not granted Numbers Game a
  permission: an administrator of the client's Stripe account accepts the
  updated app permissions (Settings → Installed apps → Numbers Game Books).
