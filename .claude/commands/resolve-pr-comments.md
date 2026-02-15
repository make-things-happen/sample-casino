Review and resolve PR comments — fetch comments, present them to the user with fix/ignore recommendations, and apply only approved changes.

## Workflow

### Step 1: Fetch PR comments

Use `gh` to fetch all pending review comments for the PR. Determine the PR number from:
1. The user's message (if they provide a PR number or URL)
2. The current branch: `gh pr view --json number --jq '.number'`

Fetch comments via the REST API:
```bash
gh api repos/{owner}/{repo}/pulls/{number}/comments --jq '.[] | select(.position != null or .line != null)'
```

Also fetch review-level comments (top-level review bodies):
```bash
gh api repos/{owner}/{repo}/pulls/{number}/reviews --jq '.[] | select(.body != "" and .body != null)'
```

Fetch review threads via GraphQL to get thread node IDs (needed to resolve conversations in Step 4):
```bash
gh api graphql -f query='
  query($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $number) {
        reviewThreads(first: 100) {
          nodes {
            id
            isResolved
            path
            line
            comments(first: 1) {
              nodes {
                id
                databaseId
                body
              }
            }
          }
        }
      }
    }
  }
' -f owner='{owner}' -f repo='{repo}' -F number={number}
```

Use the thread data to build a mapping from each comment's `databaseId` (matching the REST API comment `id`) to its parent thread's GraphQL `id`. This mapping is used in Step 4 to resolve threads after replying.

### Step 2: Present comments to the user with recommendations

For each comment, analyze the suggestion and classify it as one of:
- **Fix (Recommended)** — the comment points out a genuine bug, correctness issue, missing edge case, or a clear improvement
- **Ignore (Recommended)** — the comment is stylistic preference, bike-shedding, overly opinionated, or would not improve the code meaningfully
- **Needs Discussion** — the comment raises a valid architectural concern that requires a judgment call from the user

Present ALL comments to the user in a structured format:
- Show the file path, line number, and the reviewer's comment
- Show the relevant code snippet
- State your recommendation (Fix / Ignore / Needs Discussion) with a brief rationale
- Ask the user which comments to fix and which to ignore

**CRITICAL: Do NOT start fixing anything until the user has reviewed and approved which comments to address.** Never blindly apply all suggestions. The user must explicitly confirm which ones to fix.

### Step 3: Apply approved fixes

Only after user approval:
1. Fix each approved comment one at a time
2. After each fix, mark it as done
3. Run the linter (`bunx --bun biome check --write`) on changed files
4. Run typecheck if the changes affect TypeScript types

### Step 4: Commit, push, and reply to all comments

After all approved fixes are applied:
1. Commit the changes with a message like `fix(pr): address review comments from PR #N`
2. Push to the branch
3. Capture the commit hash and build the full commit URL:
   ```bash
   COMMIT_HASH=$(git rev-parse HEAD)
   # URL format: https://github.com/{owner}/{repo}/commit/{hash}
   ```
4. Reply to **every** review comment on GitHub — no comment should be left without a response:
   - **Fixed comments** — reply with the commit link:
     ```bash
     gh api repos/{owner}/{repo}/pulls/{number}/comments/{comment_id}/replies \
       -f body="Resolved in https://github.com/{owner}/{repo}/commit/{hash}."
     ```
   - **Ignored comments** — reply with a direct, concise reason why it was not addressed:
     ```bash
     gh api repos/{owner}/{repo}/pulls/{number}/comments/{comment_id}/replies \
       -f body="Not addressed — <reason from Step 2 analysis>."
     ```
5. **Resolve the conversation thread** after replying to each comment. Use the thread node ID from the mapping built in Step 1:
   ```bash
   gh api graphql -f query='
     mutation($threadId: ID!) {
       resolveReviewThread(input: { threadId: $threadId }) {
         thread { isResolved }
       }
     }
   ' -f threadId='{thread_node_id}'
   ```
   This marks the conversation as resolved (collapsed) in the GitHub UI. Do this for **every** comment that was replied to — both fixed and ignored.
6. When multiple comments point to the same issue (grouped in Step 2), reply to the first comment with the full response and reply to the others with: `"See reply on <link_to_first_comment>."` Resolve all their threads.

## Important Rules

- **Never trust review comments blindly.** Always evaluate whether the suggestion actually improves the code.
- **Always present comments to the user first.** The user decides what gets fixed.
- **Group related comments.** If multiple comments point to the same underlying issue, present them together.
- **Preserve the author's intent.** When fixing, make the minimum change needed to address the comment without refactoring unrelated code.
- **Respect the codebase conventions** defined in CLAUDE.md when applying fixes.
- **Always reply to every review comment.** Fixed comments get a commit link. Ignored comments get a concise explanation. No comment should be left without a response.
