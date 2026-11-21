# Jimbot AI eval harness

Deterministic, no network or OpenAI needed.

    node tests/jimbot-ai/run.mjs                 # bundled sample responses
    node tests/jimbot-ai/run.mjs my-responses.json  # your own (same shape as fixtures/sample-responses.json)
    npm run test:jimbot-ai

- `golden.json`: verified ID allowlist + cases with expectations (type, scope refusal, places, map pins, warnings...).
- `score.mjs`: scorers for schema, persona (no U+2014, no `-`/`*` bullet lines, max 1 emoji), verified IDs, save-needs-confirm, scope keywords.
- `fixtures/sample-responses.json`: entries `{caseId, label, expect: "pass"|"fail", failRule?, response}`. `fail` entries prove the harness catches invented IDs, medical answers, em dashes, bullets. Exit code is non-zero if any verdict mismatches or a case has no passing response.

Not wired into `prebuild` yet. Add `&& npm run test:jimbot-ai` once the Edge Function (T6) emits real responses.
