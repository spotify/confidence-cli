# Changelog

## [1.3.0](https://github.com/spotify/confidence-cli/compare/quickstart-v1.2.0...quickstart-v1.3.0) (2026-09-04)


### Features

* init git repo if not present when scaffolding ([#49](https://github.com/spotify/confidence-cli/issues/49)) ([cea860b](https://github.com/spotify/confidence-cli/commit/cea860bd1da4fe351e7011ae95bd905afecd63ea))
* make warnings about agent access clearer, recommend Claude Code ([#52](https://github.com/spotify/confidence-cli/issues/52)) ([be0a995](https://github.com/spotify/confidence-cli/commit/be0a99524f08683180b4482ffb27194eecfa4387))
* mark session recordings as generally available ([#51](https://github.com/spotify/confidence-cli/issues/51)) ([0c6e95b](https://github.com/spotify/confidence-cli/commit/0c6e95bc53b3d2ef55786f58ad48f722f0565517))
* use CLI commands for plugin installation when possible ([#39](https://github.com/spotify/confidence-cli/issues/39)) ([cd32210](https://github.com/spotify/confidence-cli/commit/cd32210254d0c724e7228c3c3b897dff3328ceb4))


### Bug Fixes

* allow Codex network access ([#50](https://github.com/spotify/confidence-cli/issues/50)) ([ad0b876](https://github.com/spotify/confidence-cli/commit/ad0b876be96873de6cbf8ae302aef3300ef52650))
* make goal selection mandatory ([#48](https://github.com/spotify/confidence-cli/issues/48)) ([57260d4](https://github.com/spotify/confidence-cli/commit/57260d465996b57a0cc7bd0012d9f71a45f868b5))
* make UI warning icons consistent across screens ([#44](https://github.com/spotify/confidence-cli/issues/44)) ([da34bd4](https://github.com/spotify/confidence-cli/commit/da34bd49d95dfd85a1b8f16a1b6a51374e12a273))
* remove factually incorrect package mention ([#42](https://github.com/spotify/confidence-cli/issues/42)) ([f6cbbcd](https://github.com/spotify/confidence-cli/commit/f6cbbcdbd18a82df6eae1af346766009ee18a50f))
* render all configured IDEs above the non-configured ([#46](https://github.com/spotify/confidence-cli/issues/46)) ([c4957c9](https://github.com/spotify/confidence-cli/commit/c4957c9fb93f385ffd23e54d8638d51c57a70f2d))

## [1.2.0](https://github.com/spotify/confidence-cli/compare/quickstart-v1.1.0...quickstart-v1.2.0) (2026-08-24)


### Features

* **auth:** remember last workspace and skip Auth0 workspace prompt on login ([#34](https://github.com/spotify/confidence-cli/issues/34)) ([2cf846f](https://github.com/spotify/confidence-cli/commit/2cf846fa88b517f1d3f1cbc352d6aed855f1c13a))
* introduce session recordings setup ([#28](https://github.com/spotify/confidence-cli/issues/28)) ([666ad47](https://github.com/spotify/confidence-cli/commit/666ad47e6362c23dfc1c09fbf6ede98e9f80a948))
* offer event tracking as onboarding option ([#37](https://github.com/spotify/confidence-cli/issues/37)) ([61d275f](https://github.com/spotify/confidence-cli/commit/61d275f18dcaa0ea80beb46d981676920c28da24))
* offer flag migration after initial setup ([#35](https://github.com/spotify/confidence-cli/issues/35)) ([7b63700](https://github.com/spotify/confidence-cli/commit/7b63700f264b066fc73e26679e2e5d38cf69fe60))


### Bug Fixes

* make reporting lines more concise ([#36](https://github.com/spotify/confidence-cli/issues/36)) ([0eff6d4](https://github.com/spotify/confidence-cli/commit/0eff6d47a7ae3118d8e8ee3fae1cf113a6652e22))
* update React gotchas with phased-out SDK mentions ([#29](https://github.com/spotify/confidence-cli/issues/29)) ([7bc1917](https://github.com/spotify/confidence-cli/commit/7bc1917dee1295e7e7c095c2b326d9073470edf8))

## [1.1.0](https://github.com/spotify/confidence-cli/compare/quickstart-v1.0.1...quickstart-v1.1.0) (2026-08-04)


### Features

* improve migration guardrails ([#23](https://github.com/spotify/confidence-cli/issues/23)) ([dbe5b8e](https://github.com/spotify/confidence-cli/commit/dbe5b8e6ae642cb73d5b45db2f01beee55d4148b))
* more robust auth refresh ([#24](https://github.com/spotify/confidence-cli/issues/24)) ([4fdad95](https://github.com/spotify/confidence-cli/commit/4fdad95f1c89c8cf970eeaf73fd70b80d90c6596))


### Bug Fixes

* apply dependabot patch for postcss ([#26](https://github.com/spotify/confidence-cli/issues/26)) ([5d472da](https://github.com/spotify/confidence-cli/commit/5d472da749f4db29660bb61add3b304b6fcf845f))
* fix false-negative tests and handle retries ([#19](https://github.com/spotify/confidence-cli/issues/19)) ([9e0853c](https://github.com/spotify/confidence-cli/commit/9e0853c2ec692a33080d6f85cec633b21d510252))

## [1.0.1](https://github.com/spotify/confidence-cli/compare/quickstart-v1.0.0...quickstart-v1.0.1) (2026-07-24)


### Bug Fixes

* improve context and error handling for integration via skill ([#16](https://github.com/spotify/confidence-cli/issues/16)) ([9cc5c56](https://github.com/spotify/confidence-cli/commit/9cc5c56ab9dc570e70ef50ca4fc23219b164c24b))

## 1.0.0 (2026-07-23)


### Features

* add initial implementation ([5a9c3be](https://github.com/spotify/confidence-cli/commit/5a9c3be3498612d126b7be2f2730293441fdeebb))
* tighten CI and agents' permissions, warn about agents' capabilities ([#9](https://github.com/spotify/confidence-cli/issues/9)) ([a38b98f](https://github.com/spotify/confidence-cli/commit/a38b98feb24fa2a17cb0a5108e4e1cbcd661069f))
* write cursor CLI permissions when registering MCPs ([#5](https://github.com/spotify/confidence-cli/issues/5)) ([6fee566](https://github.com/spotify/confidence-cli/commit/6fee5660ab992ab50775dae776d8c4b06501953f))
* write cursor permissions for MCP when registering ([6fee566](https://github.com/spotify/confidence-cli/commit/6fee5660ab992ab50775dae776d8c4b06501953f))


### Bug Fixes

* audit fix for `fast-uri` ([#8](https://github.com/spotify/confidence-cli/issues/8)) ([1ff9830](https://github.com/spotify/confidence-cli/commit/1ff98307eb302b9041e500656d351a4d7262b566))
* ensure status lines shown when onboarding, ask install when token is invalid ([9291d58](https://github.com/spotify/confidence-cli/commit/9291d588576dd68c42f6b3e667659866b0350458))
* handle expired MCP auth gracefully ([#4](https://github.com/spotify/confidence-cli/issues/4)) ([2676bb4](https://github.com/spotify/confidence-cli/commit/2676bb4281bc88c9f6e5de00207ccc28d861337b))
* refresh MCP auth on consecutive runs ([514e619](https://github.com/spotify/confidence-cli/commit/514e61968eb65e3796a4b8801228158bfef704d1))
* tighten token files permissions ([#12](https://github.com/spotify/confidence-cli/issues/12)) ([5e5d5d9](https://github.com/spotify/confidence-cli/commit/5e5d5d982a6f14617f901356db774db9610f1514))
