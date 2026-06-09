# Agent instructions

## Tooling

- This project uses **pnpm** only. Never use npm or yarn.
- `pnpm lint` runs `vite build` (type-checks and bundles).

## API verification

- Every function, class, or API used in source code must be verified against the actual type definitions or source of the dependency package — never assume an API exists based on name alone. Check `.d.ts` files or the package's dist source before using any import or API call.

## Commit strategy

This repo enforces **conventional commits** via commitlint. Commits are checked by a `commit-msg` hook. A `pre-commit` hook runs `pnpm lint` (Vite build) and blocks the commit on failure.

### When to commit

- Commit after each completed, logically self-contained change.
- Do NOT batch unrelated changes into one commit.
- If a commit is rejected by the pre-commit hook, fix the build error and create a new commit — do NOT amend.

### Format

```
type(scope): short description in sentence case
```

- **type** — one of: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`
- **scope** — kebab-case noun identifying the area changed (e.g. `physics`, `rendering`, `entities`, `config`)
- **subject** — sentence case, no trailing period, max 72 characters total header

### Type usage

| Type | When to use |
|------|-------------|
| `feat` | New user-facing feature or capability |
| `fix` | Bug fix |
| `docs` | Documentation or agent instruction changes |
| `style` | Formatting, whitespace, semicolons (no logic change) |
| `refactor` | Code restructuring without feature change or fix |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `build` | Build system, tooling, or dependency changes |
| `ci` | CI/CD pipeline changes |
| `chore` | Maintenance tasks that don't modify src or tests |
| `revert` | Reverting a previous commit |

### Scope examples

`physics`, `rendering`, `entities`, `scene`, `config`, `systems`, `shaders`, `lighting`, `controls`, `loop`

### Examples

```
feat(physics): add obstacle body creation
fix(rendering): correct shadow map frustum bounds
refactor(entities): split ball spawning from mesh creation
docs(agents): document commit conventions
```
