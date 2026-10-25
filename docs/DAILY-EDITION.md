# Daily edition size — 0.4.0

The four main categories remain world, Thailand, local and discovery. The default target is 24 stories; users may select 20 or 30 in preferences. Existing interests and region are preserved when moving from the old per-category quota setting.

Initial allocations are 5/5/5/5 for 20, 6/6/6/6 for 24, and 8/8/7/7 for 30. If the enabled “fill gaps” preference is on, unused slots are filled with other eligible stories and the UI explicitly reports the number added per category. This never bypasses region or discovery-interest exclusions. Users may disable filling; a shortfall is then shown without replacement.

Limit one publisher to half of the selected daily target, rounded up. BBC Thai and BBC World share a publisher ID; Thai PBS latest/archive also share an ID. Duplicate canonical URLs are excluded.

Fetch up to 60 candidates per adapter, keeping the existing seven-day age bound and actual publication times. Added BBC World RSS and the prior Thai-calendar day's Thai PBS archive. English headlines remain in the source language. This is still a published snapshot; automatic daily fetching/deployment is not enabled by this change.
