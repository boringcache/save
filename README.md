# boringcache/save

Save directories to BoringCache at a specific point in your workflow. For automatic restore + save, use `boringcache/action` instead.

Caches are content-addressed — identical content is never re-uploaded.

## Quick start

```yaml
- uses: boringcache/save@v1
  with:
    workspace: my-org/my-project
    entries: deps:node_modules
  env:
    BORINGCACHE_API_TOKEN: ${{ secrets.BORINGCACHE_API_TOKEN }}
```

Entries use `tag:path` format (for example, `deps:node_modules`).

## Mental model

This action saves directories you explicitly choose.

- You decide what is expensive (dependencies, build outputs, toolchains)
- BoringCache fingerprints the directory contents
- If the content already exists, the upload is skipped
- The cache can be restored anywhere using the same tag

This action does not infer what should be cached and does not modify your build.

## Common patterns

### Simple CI cache (always save)

```yaml
- run: npm ci
- run: npm test

- uses: boringcache/save@v1
  if: always()
  with:
    workspace: my-org/my-project
    entries: deps:node_modules
  env:
    BORINGCACHE_API_TOKEN: ${{ secrets.BORINGCACHE_API_TOKEN }}
```

### Advanced pattern: Restore + save pair

```yaml
- uses: boringcache/restore@v1
  id: cache
  with:
    workspace: my-org/my-project
    entries: deps:node_modules
  env:
    BORINGCACHE_API_TOKEN: ${{ secrets.BORINGCACHE_API_TOKEN }}

- run: npm ci

- uses: boringcache/save@v1
  with:
    workspace: my-org/my-project
    entries: deps:node_modules
  env:
    BORINGCACHE_API_TOKEN: ${{ secrets.BORINGCACHE_API_TOKEN }}
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `workspace` | No | repo name | Workspace in `org/repo` form. Defaults to `BORINGCACHE_DEFAULT_WORKSPACE` or repo name. |
| `entries` | No | - | Comma-separated `tag:path` pairs. Required unless using actions/cache-compatible inputs. |
| `path` | No | - | Files/directories to save (actions/cache compatible). |
| `key` | No | - | Cache key (actions/cache compatible). |
| `enableCrossOsArchive` | No | `false` | Enable cross-OS sharing by disabling platform suffixes (actions/cache compatibility). |
| `no-platform` | No | `false` | Disable OS/arch scoping for cache tags. |
| `force` | No | `false` | Overwrite existing cache entries. |
| `upload-chunk-size` | No | auto | Chunk size for uploads (bytes). |
| `verbose` | No | `false` | Enable detailed output. |

## Platform behavior

Platform scoping is what makes it safe to reuse caches across machines.

By default, caches are isolated by OS and architecture. Use `no-platform: true` or `enableCrossOsArchive: true` only for portable artifacts (sources, lockfiles).

## Environment variables

| Variable | Description |
|----------|-------------|
| `BORINGCACHE_API_TOKEN` | API token (required) |
| `BORINGCACHE_DEFAULT_WORKSPACE` | Default workspace (if not specified in inputs) |

## Migrating from actions/cache/save (optional)

```diff
- uses: actions/cache/save@v4
+ uses: boringcache/save@v1
+ env:
+   BORINGCACHE_API_TOKEN: ${{ secrets.BORINGCACHE_API_TOKEN }}
```

## Troubleshooting

- Unauthorized or workspace not found: ensure `BORINGCACHE_API_TOKEN` is set and the workspace exists.
- Upload skipped: content already exists in cache (this is expected behavior).
- Force overwrite: use `force: true` to update existing cache entries.

## Release notes

See https://github.com/boringcache/save/releases.

## License

MIT
