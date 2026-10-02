# AI Coding Rules — Keep Repository Clean

## 1. Minimal Changes
- Inspect the existing codebase before making changes.
- Modify existing files whenever possible.
- Do not rewrite unrelated code.
- Preserve existing architecture, naming conventions, and coding style.
- Make the smallest change that correctly solves the requested task.

## 2. File Creation Policy
- Do not create a new file if the task can be solved by modifying an existing file.
- Search for an existing module with the same responsibility before creating a file.
- Create files only when necessary for functionality, testing, configuration, or maintainability.
- Never create duplicate files such as `*_new`, `*_v2`, `*_fixed`, or `*_final`.
- Do not create documentation, summaries, walkthroughs, or plans unless explicitly requested.
- Do not add configuration files without a demonstrated need.

## 3. Documentation
- Keep `README.md` as the main project overview.
- Update existing documentation only when necessary.
- Avoid duplicating information across `README.md`, `AGENTS.md`, and other documents.
- Create `docs/` files only when they provide lasting value.

## 4. Code Reuse
- Reuse existing components, services, utilities, types, and helpers.
- Do not duplicate business logic.
- Avoid new dependencies when existing dependencies can solve the problem.
- Avoid unnecessary abstractions and overengineering.

## 5. Generated Files
- Do not manually create build output, cache files, temporary files, or logs unless required.
- Respect `.gitignore`.
- Do not delete files needed by deployment, tests, or runtime.
- Do not modify lockfiles unless dependency changes require it.

## 6. Safety
- Check a file's purpose before deleting, renaming, or overwriting it.
- Never remove user changes or unrelated code.
- Do not expose secrets or overwrite environment files.
- For potentially destructive cleanup, list candidates and explain the reason first.

## 7. Completion
- Run relevant tests or checks when possible.
- Report only: files created/modified/deleted, checks performed and results, remaining issues.
- Do not create a separate completion report file.
