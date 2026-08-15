# Release Guide

Lucky Charm releases are created by pushing a semantic-version tag in the form `vX.Y.Z`.

## Release Checks

Run these commands before creating a tag:

```sh
pnpm run check
pnpm run release:smoke
```

The release workflow then creates native artifacts on GitHub-hosted runners:

- macOS: DMG and ZIP
- Windows: NSIS installer
- Linux: AppImage

Artifacts are published to one GitHub Release with generated release notes.

## Creating A Release

1. Confirm `master` is green in CI.
2. Update `package.json` to the release version.
3. Run the release checks locally.
4. Create and push the matching tag:

```sh
git tag vX.Y.Z
git push origin vX.Y.Z
```

The `.github/workflows/release.yml` workflow builds and publishes the artifacts.

## Signing Status

The current workflow produces unsigned artifacts when signing credentials are absent. This supports internal testing but is not suitable for broad public distribution.

Before public distribution, configure these GitHub Actions secrets and update the release workflow to consume them:

- Windows code-signing credentials and certificate profile.
- macOS Developer ID certificate, certificate password, Apple API key, key ID, and issuer ID.

Keep `LUCKY_CHARM_UPDATE_REPOSITORY` unset until signing has been verified on each platform. This prevents unsigned builds from presenting a usable update path.

## Auto-Update Prerequisite

The updater checks GitHub Release assets only in packaged builds when `LUCKY_CHARM_UPDATE_REPOSITORY` is configured as `owner/repository`. It never downloads or installs an update automatically.

Do not configure this variable for public distribution until signed installers and updater metadata are published consistently for each supported platform.
