# What always-loaded text costs

Derived from 377 sessions: per-token prices fitted to each session's reported cost, then 1000 extra tokens in an always-loaded file priced as one cache write plus one cache read on every later turn.

| model | sessions | fit error (max) | cache write $/Mtok | cache read $/Mtok | turns: min / Q1 / median / Q3 / max | cost per session at median turns | at Q1 to Q3 |
|---|---|---|---|---|---|---|---|
| claude-haiku-5-5 | 182 | 0.00% | 0.20 | 0.010 | 6 / 14 / 20 / 26 / 46 | $0.0004 | $0.0003 to $0.0005 |
| claude-sonnet-5-5 | 195 | 0.00% | 4.00 | 0.100 | 5 / 13 / 17 / 21 / 33 | $0.0056 | $0.0052 to $0.0060 |

Assumes one API call per turn (`num_turns`), each reading the cached prefix that holds the always-loaded file; ancillary calls Claude Code makes outside the turn count are not priced.

This is the price of the tokens alone; whether always-loaded text also changes what the agent does (as in F7, where it skipped the linked docs) needs runs, not arithmetic.
