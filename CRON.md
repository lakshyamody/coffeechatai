# Scheduling

Rounds close and send on their own. `/api/cron/tick` is the only moving part.

## Why the cron times look arbitrary

Vercel cron expressions are **UTC**, and Hobby accounts are limited to *daily*
schedules. The round schedule lives in `src/lib/schedule.ts` and is expressed
in `BREWED_TIMEZONE` (default `Asia/Kolkata`):

| Event | Local | UTC | Cron |
| --- | --- | --- | --- |
| Entries close | Tue 23:59 IST | 18:29 | `35 18 * * *` |
| Matches send | Wed 19:00 IST | 13:30 | `35 13 * * *` |

Both run *every* day, a few minutes after the corresponding instant. That is
deliberate: the tick works out what should have happened by now and does only
the parts that haven't, so running it on days when nothing is due costs one
cheap query and changes nothing.

## Why it's safe to run often, or late, or twice

The tick is idempotent. It compares stored markers (`lastClosedCycle`,
`lastSentCycle`) against the most recent deadline instants:

- Nothing due → no-op.
- Entries closed → solve and **freeze** the pairings, so the match someone is
  emailed on Wednesday is the one the round actually solved on Tuesday night,
  even though the pool keeps changing in between.
- Send time passed → email both halves of every pairing, record the chats in
  each member's history, open the next round.
- Send time passed but nothing was frozen (the close run was missed) → freeze
  and send in the same tick rather than skipping the week.

On a database that has never ticked, the first run only records where we are
and stops. Without that, every past deadline would read as "due" and a fresh
deployment would email the entire pool on whatever day it came up.

## If you change the schedule

Change `src/lib/schedule.ts`, then update the two cron expressions above to
match — they are the one place that has to be kept in sync by hand, because
Vercel needs literal UTC. Getting them wrong delays a round; it does not break
one, because the tick still fires on the next run.

## Running it by hand

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://<host>/api/cron/tick
```

The lab page also has buttons for re-solving, sending, and closing a round;
they call the same code the scheduler does.
