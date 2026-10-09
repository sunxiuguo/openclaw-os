# OpenClaw OS stale app-response regression harness

Tests the actual `AppDetail` and `MobileAppDetail` components from a separately checked-out OpenClaw OS repository. React state/effect scheduling is real; presentation components/OpenUI Renderer are inert stubs. `apps.getApp` returns explicitly ordered synthetic promises. `apps.invokeTool` is a spy and never contacts a gateway, reads a file, or executes a tool.

## Reproduce

Use Node 20+ and pnpm. Install the target repository's dependencies per its CONTRIBUTING.md, and install this harness separately:

```sh
pnpm install --frozen-lockfile --ignore-scripts
OPENCLAW_REPO=/absolute/path/to/openclaw-os pnpm exec vitest run
```

The fallback target path is the sibling `../openclaw-app-race-20261009` directory. Override it as shown for any other checkout. This harness imports production source directly; no copied implementation is tested.

Target base: `076ae63478fa2417d38c39b5b6d13f9188b8580b`.
Patch SHA-256: `94330875cf0a781207699feb3a54e11f5f83c35d6290df0413a32c04717054b3`.

At upstream base, 12 regression cases fail and 4 control cases pass. With the patch, all 16 pass. Cases run for both desktop and mobile:

- Old app resolves after new app: preview stays on new app.
- Old app resolves while new app is pending: loading stays visible.
- Old null response must not mark the new app as missing.
- Older version of the same app must not replace newly generated UI.
- Tool-provider stub independently receives the current app's synthetic session key.
- StrictMode effect replay ignores the cleaned-up first request.
- Control: current app really missing displays not-found.
- Control: ordinary successful loading still renders.

`react-test-renderer` emits its React 19 deprecation notice. There are no unwrapped-act warnings in the final run. This is a focused lifecycle regression test, not a browser/OpenUI renderer/gateway end-to-end test. No live RPC or security impact was reproduced.

The upstream workspace currently has Vitest configs but no checked-in test files or component-testing utilities. This isolated harness avoids adding a testing dependency or modifying the upstream lockfile. The reviewed production patch changes only two effect lifecycles. If maintainers want native regression tests, port these cases to their preferred React testing setup rather than adding this harness's stubs wholesale.
