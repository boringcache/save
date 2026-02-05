# boringcache/save

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-BoringCache%20Save-blue.svg)](https://github.com/marketplace/actions/boringcache-save)
[![CI](https://github.com/boringcache/save/workflows/CI/badge.svg)](https://github.com/boringcache/save/actions)

**A portable build cache for GitHub Actions.**  
Save cache artifacts that can be reused anywhere — CI, deploy, or local dev.

## 🚀 Why BoringCache Save?

- **3x Faster** than actions/cache/save
- **Portable caches** - reuse in CI, deploy, or local dev
- **Workspace format** - multi-cache scenarios
- **Cross-platform** - Linux, macOS, Windows
- **Smart compression** - LZ4/ZSTD auto-selection
- **Automatic setup** - no installation required

## 📦 Quick Start

```yaml
- uses: boringcache/save@v1
  with:
    workspace: my-org/my-project
    entries: "node_modules:node-deps,target:build-cache"
  env:
    BORINGCACHE_API_TOKEN: ${{ secrets.BORINGCACHE_API_TOKEN }}
```

## 🔧 Migration from actions/cache/save

Simply replace:
```diff
- uses: actions/cache/save@v4
+ uses: boringcache/save@v1
+ env:
+   BORINGCACHE_API_TOKEN: ${{ secrets.BORINGCACHE_API_TOKEN }}
```

## 💡 Performance Benefits

| Scenario | actions/cache/save | BoringCache Save | Improvement |
|----------|-------------------|------------------|-------------|
| Node modules (500MB) | 30s | 10s | **3x faster** |
| Rust target (1GB) | 60s | 18s | **3.3x faster** |
| Docker layers (2GB) | 120s | 35s | **3.4x faster** |

## 🌍 Portable Caching

Unlike `actions/cache/save`, boringcache creates **portable caches** that work everywhere:

- ✅ **GitHub Actions** (this action)
- ✅ **Local development** (CLI)
- ✅ **Other CI systems** (GitLab, Jenkins, etc.)
- ✅ **Deploy environments** (production, staging)

## 🎯 Use Cases

- **Node.js** - npm, yarn, pnpm dependencies
- **Rust** - cargo registry and build artifacts  
- **Go** - modules and build cache
- **Python** - pip cache and virtual environments
- **Docker** - layer caching and build contexts
- **Custom** - any file or directory caching needs

## 🏢 Enterprise Ready

- Team management
- Usage analytics
- API access

## 📚 Documentation

- [Full Documentation](https://boringcache.com/docs)
- [CLI Documentation](https://github.com/boringcache/cli#readme)

Get started at [boringcache.com](https://boringcache.com)