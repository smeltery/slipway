# Releases and websites

Hab's automatic release flow runs after the `ci` workflow succeeds on a push to
`main`. It checks out that successful commit, reuses an existing semantic tag or
increments the latest patch version (starting at `v0.1.0`), then explicitly
dispatches `release.yml`. This avoids the GitHub token restriction that prevents
a pushed tag from triggering another workflow. Pull requests cannot cut releases.

The release workflow validates the tag, builds from that exact tag, and publishes
artifacts plus SHA-256 checksums. A failed release can be retried through workflow
dispatch with the same tag. Auto-release concurrency serializes tag creation.

Slipway distributes the executable `slipway` and a tarball containing the skill,
documentation and license notices. The release script stamps the tag version
into the executable without changing source history.

The `pages` workflow deploys `dist/site` through GitHub Pages after successful CI
on `main`. The public site is <https://smeltery.github.io/slipway/>.
Pages must use GitHub Actions as its build source in repository settings.
