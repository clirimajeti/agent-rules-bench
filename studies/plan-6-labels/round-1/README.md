# Round 1 of the finding labels (2026-11-18 to 2026-11-19), replaced

The labels in `findings.csv` were given against the code in `findings.md` (the first 20 against the shorter snippets in `findings-first-20.md`).
For after-task findings, and for loop findings without an edit in the session log, that code was the code after the review fix, not the code the checker flagged: the runs kept only the final diff.
The code at the end of the task was then rebuilt by replaying the agent's edits (`bench/plan6-after-task.mjs`).
A round-1 label was kept only where the code shown in round 2 is the same as the code labelled in round 1; every other finding was labelled again.
