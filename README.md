# Woodpecker Plugin: Ghost Deploy Theme

```yaml
steps:
  deploy:
    image: ghcr.io/wilsonehusin/woodpecker-plugin-ghost-deploy-theme
    pull: true
    secrets: [ghost_admin_host, ghost_admin_api_key]
    settings:
      # Optional: relative path to theme from root of repository
      path: "."
      # Optional: use HTTP instead of HTTPS
      insecure: false
```
