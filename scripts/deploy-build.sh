#!/usr/bin/env bash
# Build on a laptop/CI, never on the memory-constrained production Droplet.
set -euo pipefail
cd "$(dirname "$0")/.."
if [ -n "$(git status --porcelain)" ]; then
  echo "Commit/review changes before building an immutable production release." >&2
  exit 1
fi
release="$(git rev-parse HEAD)"
prefix="${IMAGE_PREFIX:-aura-property}"
output="${1:-.local/releases/$release}"
case "$prefix" in *[!a-z0-9/._-]*) echo "Invalid IMAGE_PREFIX" >&2; exit 1;; esac
mkdir -p "$output"
for target in api web admin migrate; do
  docker buildx build --platform linux/amd64 --target "$target" --load \
    --label "org.opencontainers.image.revision=$release" \
    --label "org.opencontainers.image.source=https://github.com/IrakliChanukvadze/aura-property" \
    --tag "$prefix-$target:$release" .
done
docker image save "$prefix-api:$release" "$prefix-web:$release" \
  "$prefix-admin:$release" "$prefix-migrate:$release" | gzip > "$output/images.tar.gz"
(cd "$output" && shasum -a 256 images.tar.gz > images.tar.gz.sha256)
printf 'RELEASE_TAG=%s\nIMAGE_PREFIX=%s\n' "$release" "$prefix" > "$output/release.env"
echo "Built release $release. Transfer images.tar.gz, its checksum, and the matching committed infra/scripts to the server."
