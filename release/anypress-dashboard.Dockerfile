# What Coolify deploys for anypress-dashboard: the image GitHub Actions built for this commit (README.md).
ARG SOURCE_COMMIT
FROM ghcr.io/otaku-solutions/anypress-dashboard:sha-${SOURCE_COMMIT}
