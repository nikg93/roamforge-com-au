# Recovery Kit Giveaway — admin runbook

Giveaway id: `recovery-kit-2026-08` · Terms version: `v1.0-2026-08`

## Security model

- `giveaway_entries` and `giveaway_launch_config` have RLS enabled with **no policies** and
  **no grants** to `anon`/`authenticated`. They are unreachable from the browser: no public
  reads, no public writes, no public export endpoint.
- The only write path is the server function `submitGiveawayEntry`
  (`src/lib/giveaway.functions.ts`), which uses the service-role client inside the handler after
  validating input, the launch flags, the promotion window and a per-IP-hash rate limit
  (max 5 attempts/hour). IPs are stored only as a salted SHA-256 hash.
- `getGiveawayStatus` returns launch booleans and dates only — never entries.

## Opening entries (no code change required)

Both flags must be true and the current time must fall inside the window:

```sql
UPDATE public.giveaway_launch_config
   SET launch_enabled = true,
       supplier_confirmed = true,
       supplier_confirmation_note = '<written supplier availability reference>'
 WHERE id = 'recovery-kit-2026-08';
```

Do not set `supplier_confirmed` until written supplier availability for SKU `AOB-RK407` is
recorded. When launched, both giveaway routes automatically become indexable (the `noindex`
tag is derived from the launch status) — also add `/giveaway/recovery-kit` and
`/giveaway/recovery-kit/terms` to `src/routes/sitemap[.]xml.ts`.

## Secure CSV export (server-side only)

Run from a trusted server/admin session — never expose as an HTTP endpoint:

```sql
COPY (
  SELECT created_at, first_name, last_name, email, state_territory, response,
         response_word_count, terms_version, marketing_consent, eligibility_status,
         exclusion_reason, score_safety, score_relevance, score_clarity, score_total,
         judge_name, judged_at, winner_status
    FROM public.giveaway_entries
   WHERE giveaway_id = 'recovery-kit-2026-08'
   ORDER BY created_at
) TO STDOUT WITH CSV HEADER;
```

## Judging

Scores: safety 50%, relevance 30%, clarity/originality 20%. Write results back to
`score_safety`, `score_relevance`, `score_clarity`, `score_total`, `judge_name`, `judged_at`,
then set `winner_status` and track `contact_attempts` / `contact_outcome`.
