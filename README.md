# <img src="assets/logo.svg" width="36" height="36" alt="" /> Slipway

![Slipway — Test your app. Keep your screen.](assets/og.png)

[![CI](https://github.com/smeltery/slipway/actions/workflows/ci.yml/badge.svg)](https://github.com/smeltery/slipway/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/smeltery/slipway)](https://github.com/smeltery/slipway/releases)
[![Bash](https://img.shields.io/badge/Bash-native-4c766b?logo=bash)](docs/development.md)
[![Bun](https://img.shields.io/badge/Bun-tooling-282a36?logo=bun)](package.json)
[![Flox](https://img.shields.io/badge/Flox-reproducible-845ef7)](.flox/env/manifest.toml)
[![License](https://img.shields.io/badge/license-PolyForm_Shield-blue)](LICENSE)

Slipway sends Mac app builds to a headless Tart VM, then launches, screenshots and drives them over SSH. Porthole makes that activity visible.

```sh
slipway setup
slipway note "Checking the new search field"
slipway open build/MyApp.app
slipway ui MyApp
slipway shot MyApp
```

[Install and start](docs/getting-started.md) · [Documentation](docs/README.md) ·
[Releases](https://github.com/smeltery/slipway/releases)

Requires macOS for app testing. Local Tart VMs require Apple silicon; an existing
remote Mac can also be used. See [requirements](docs/getting-started.md).

Licensed under [PolyForm Shield 1.0.0](LICENSE). Upstream MIT notices
are preserved in [provenance](docs/provenance.md).
