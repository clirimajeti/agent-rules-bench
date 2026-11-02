Run the codemyrules skill on this project: invoke it with the Skill tool (`codemyrules`) and follow it.

Nobody can answer questions in this session, so these are the user's answers, given in advance:
- Selection: pick every candidate whose convention is stated in the project's agent docs or its `docs/` folder (CLAUDE.md, AGENTS.md, docs/*.md), including design-shaping ones. Do not pick general candidates the project does not use, and do not pick conventions found only in code; list those in the report.
- Approved writes: rule files, rule tests, lint config changes, installing dev dependencies at exact versions (lockfile installs with --ignore-scripts), deleting or shortening the agent-doc lines that the built rules now cover, the feedback loop install, and the baseline.
- Do not run the project's full build or test suite; verify rules with their own tests and scans.

At the end, write the complete step-7 report to `codemyrules-report.md` in the project root, and print it.
