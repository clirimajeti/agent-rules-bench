# qwen3.6 with a 30-turn cap (stopped)

The first qwen3.6 runs under pi used the study cap of 30 turns; 4 of the first 5 hit it, so the agent had not finished most tasks.
The batch was stopped and restarted with `maxTurns: 60` for both local models; these runs are kept for reference and are not part of any summary.
