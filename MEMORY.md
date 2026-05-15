# Fit App Working Memory

## Session Handling

- The user may connect to this VM through native ChatGPT/Codex over SSH instead of a third-party SSH app.
- This connection is not automatically a tmux session.
- For short commands, a normal shell is fine.
- For long-running or interruption-sensitive work, proactively use tmux before starting the task.
- Use tmux especially for deploys, builds, longer tests, log watching, dependency installs, migrations, DB maintenance, system updates, and any restart-adjacent work.
- Goal: if the phone/native SSH connection drops, important work should continue safely on the VM.
