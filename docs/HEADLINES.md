# First real-news edition

Replaced all mock stories with headline metadata fetched from BBC News Thai RSS, NASA RSS, and the linked headlines and timestamps on the Thai PBS latest-news page.

## Current behavior

- Shows original headlines, publisher, publication time and direct original links.
- Does not copy article bodies or images; no AI-generated summaries in this mode.
- Metadata items use `kind: headline` / `status: metadata`, separately from approved summaries.
- Source adapters have fixed HTTPS URLs and allowed article hostnames. No browser cookies or API keys are used.
- No paywall/access-control bypass; an unavailable adapter is reported in `sourceStatus`.
- Feed dates are preserved; the displayed edition time is the fetch time, not the article publication time.
- Category/topic inference is a simple keyword/source rule. Unknown BBC stories default to world, not Thailand. Local requires an explicit supported place name in the headline.
- Ranking uses neutral 0.5 values for dimensions not evaluated yet, and calculated freshness; the UI discloses this. It does not claim editorial importance or factual verification.
- NASA headlines remain in their original English; translation/grounded summaries are a later editorial step.
- At most eight candidates per source, three selected per category by default, and four cards per publisher across an edition. Gaps remain visible.

## Refresh

```sh
node scripts/headlines.mjs
node --test
node scripts/build.mjs
```

The command writes one atomic edition. If all sources fail, it preserves the previous file. It makes no OpenAI call. Commit/push the new edition and deploy its exact source state to Sites; GitHub source and Sites deployment are separate.

This is a dated snapshot, not an automatic or realtime refresh service. The UI states that explicitly. No recurring job was enabled.

The pilot metadata adapters are declared in `scripts/headlines.mjs`. They do not enable full-text extraction/AI processing for the pending sources in Google Sheet `Sources`. The rights workflow for summaries remains pending. Review content usage terms before broadening the feed/headline pilot to stored article text, images, or commercial syndication.
