# Release images

app.anypress.io runs on the Hostinger VPS under Coolify (app `anypress-dashboard`). The server never builds it:

1. `.github/workflows/image-app.yml` builds the image on GitHub. On a pull request it builds it and starts it to check
   it answers on port 3000.
2. On `main` it publishes `ghcr.io/otaku-solutions/anypress-dashboard:sha-<commit>` and moves the branch
   `release/anypress-dashboard` to that commit.
3. Coolify deploys from `release/anypress-dashboard` with `release/anypress-dashboard.Dockerfile` and "Include source
   commit in build" on, so a deploy only downloads the image that already exists.

Runtime settings (`WAAS_API_URL`, `WAAS_ADMIN_TOKEN`, `ALLOWED_ADMIN_EMAILS`, `ALLOWED_GITHUB_LOGINS`) come from
Infisical `otaku-internal`, `prod`, `/waas-dashboard`. Sign-in runs on api.anypress.io, so the dashboard holds no auth
secrets.
