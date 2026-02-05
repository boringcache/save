# BoringCache Save

## What It Does

Save-only cache action. Use with `boringcache/restore` for granular control over when caching happens.

## Quick Reference

```yaml
- uses: boringcache/save@v1
  with:
    workspace: my-org/my-project
    entries: deps:node_modules
  env:
    BORINGCACHE_API_TOKEN: ${{ secrets.BORINGCACHE_API_TOKEN }}
```

## When to Use

- Save after a specific build step (not at job end)
- Conditional saving based on job results
- Paired with `boringcache/restore` for restore-then-save patterns

## Inputs

| Input | Description |
|-------|-------------|
| `workspace` | BoringCache workspace (`org/repo`) |
| `entries` | Cache entries (`tag:path,tag2:path2`) |
| `force` | Overwrite existing cache |

## Code Structure

- `lib/save-only.ts` - Main entry point (no post phase)
- `lib/utils.ts` - Shared utilities

## Build

```bash
npm install && npm run build && npm test
```

---
**See [../AGENTS.md](../AGENTS.md) for shared conventions.**
