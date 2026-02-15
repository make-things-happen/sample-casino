Commit, push, and create a pull request — validates branch safety, makes atomic commits, pushes, and opens a PR.

## Workflow

### Step 1: Validate the current branch

Check the current branch name:
```bash
git branch --show-current
```

If the branch is `master`, `dev`, or `staging`, **STOP immediately** and tell the user:
> "You're on `{branch}` which is a protected deployment branch. Create a feature branch first before committing."

Do NOT proceed with any further steps. These branches must never be committed to directly.

### Step 2: Gather changes and recent commit style

Run these in parallel:
```bash
git status
git diff --staged
git diff
git log --oneline -10
```

If there are no changes (no untracked files, no modifications, no staged changes), tell the user there is nothing to commit and stop.

### Step 3: Run pre-commit checks

Before committing, run the linter and formatter:
```bash
bunx --bun biome check --write
```

If there are TypeScript files among the changes, also run typecheck from the web app:
```bash
bun run typecheck
```
(Run from `apps/web` directory)

Fix any issues that arise before proceeding.

### Step 4: Stage and commit atomically

An **atomic commit** is a self-contained, indivisible unit of work representing a single, logical change. Each commit should do exactly one thing — if you can describe it with "and" (e.g., "add the payout table **and** refactor the sidebar"), it should be two commits.

Review the pending changes and split them into atomic commits. Each logical change gets its own commit:

1. **Identify logical change groups.** Look at all modified, added, and deleted files. Group them by the single logical change they belong to. Common splits:
   - Database schema/migration changes (always separate — see rule below)
   - A new feature (API route + UI component that serves that feature = one commit)
   - A bug fix
   - A refactor or cleanup
   - Dependency or config changes

2. **For each logical change**, stage only the relevant files:
   ```bash
   git add <file1> <file2> ...
   ```
   Use `git add -A` only when all pending changes belong to the same logical change.

3. **Draft a commit message** following [Conventional Commits](https://www.conventionalcommits.org/):
   - Format: `<type>(<optional scope>): <description>`
   - Types: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `perf`, `test`, `ci`, `build`, `revert`
   - Keep it concise (1-2 sentences), focus on the "why" not the "what"
   - Never add a `Co-Authored-By` trailer

4. **IMPORTANT: If changes include database schema or migration files** (`packages/db/schema/` or `packages/db/drizzle/`), these MUST be in their own separate commit — never mixed with application code. Database changes are always the **first** commit, then commit the application code that uses them afterward.

5. **Create the commit:**
   ```bash
   git commit -m "<message>"
   ```

6. **Repeat steps 2–5** for each remaining logical change group.

7. **Verify** all changes have been committed:
   ```bash
   git status
   ```

### Step 5: Push to remote

Push the branch to the remote with tracking:
```bash
git push -u origin HEAD
```

### Step 6: Create the pull request

1. Determine the base branch. Use the branch this feature branch was created from. If unclear, default to `dev`.

2. Analyze all commits on the branch (not just the latest) to write the PR summary:
   ```bash
   git log <base-branch>..HEAD --oneline
   git diff <base-branch>...HEAD --stat
   ```

3. Create the PR using `gh`:
   ```bash
   gh pr create --base <base-branch> --title "<title>" --body "$(cat <<'EOF'
   ## Summary
   <concise bullet points describing what changed and why>

   ## Changes
   <list of notable file changes grouped by area>
   EOF
   )"
   ```

4. Return the PR URL to the user.

## Important Rules

- **NEVER commit or push to `master`, `dev`, or `staging`.** Always abort if on these branches.
- **Database changes get their own commit.** Schema and migration files are always committed separately from application code.
- **Do not skip pre-commit hooks.** Never use `--no-verify`.
- **Do not force push.** Never use `--force` or `--force-with-lease` unless the user explicitly asks.
- **Do not amend commits** that have already been pushed.
- **Always run biome and typecheck** before committing. Do not commit code that fails checks.
- **Never commit secrets.** Warn and exclude `.env`, credentials, or key files.
