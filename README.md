# laravel-ops-mcp

A small, read-only bridge between MCP clients and an opt-in Laravel health endpoint. No write tools, arbitrary URLs, database records, or application secrets are exposed.

```text
MCP client → stdio TypeScript server → configured HTTPS origin
                                      → Laravel /api/ops/health
```

- `packages/laravel-ops`: PHP 8.2+ package, Laravel 11/12, auto-discovered provider.
- `mcp-server`: Node 20.19+ stdio server with `list_sites` and `get_health`.
- `demo-app`: minimal Laravel bootstrap and Faker-only fixture generator.

## Quickstart

With Node 20.19+ installed, from the repository root, four commands:

```sh
cd mcp-server
npm ci && npm run build
cp sites.example.json sites.json
npm start
```

The stdio server waits for an MCP client. Configure your MCP client to launch `node /absolute/path/to/mcp-server/dist/index.js`, set its working directory to mcp-server, and supply `OPS_SITES_FILE` if using a different config path. Supply each site token through the client process environment only. The example site is a placeholder and will not resolve. See [demo quickstart](demo-app/README.md) for four commands to start the synthetic Laravel demo.

## Laravel configuration

Install the package from this checkout using a Composer path repository and require `audiencetarget/laravel-ops:@dev`. Laravel discovers `OpsServiceProvider` automatically. Optionally publish config with `php artisan vendor:publish --tag=ops-config`.

`OPS_MCP_ENABLED` defaults to false: requests return 404 until the rate limit is exceeded. To opt in, set it to true and set `OPS_TOKEN_HASH` to the SHA-256 hex digest or PHP `password_hash` result of your locally generated token. Keep the original token only in the caller's environment. Do not commit either value. Rebuild Laravel's config cache after changes.

When enabled, missing or incorrect Bearer credentials return 401. All requests use `throttle:60,1` before authorization: after 60 requests per minute, requests return 429, including when disabled or unauthenticated. Authorized requests return exactly:

```json
{"app":"Fake Ops Demo","env":"testing","versions":{"php":"8.3","laravel":"12"},"db":{"ok":true},"cache":{"ok":true}}
```

Database and cache failures return false without exception details. A cache read checks backend availability without storing data. Health responses use `Cache-Control: no-store`.

## MCP configuration and usage

Copy `mcp-server/sites.example.json` to the ignored `sites.json`. Each named site has an HTTPS origin and a `tokenEnv` naming its environment variable, such as `LARAVEL_OPS_TOKEN_DEMO`. Config rejects inline credentials, paths, queries, and extra fields. Tokens are never accepted as tool arguments.

- `list_sites({})` returns configured names only.
- `get_health({"site":"demo"})` requests the configured origin's `/api/ops/health` using its environment token.

Unknown sites, URL arguments, token arguments, extra arguments and unknown tools are rejected. Redirects are refused and requests time out after ten seconds. Responses must match the exact health schema. Errors sent to the client do not include upstream exception details or tokens.

## Preview

_Screenshot/GIF placeholder: MCP client listing the synthetic demo site and displaying its allowlisted health response._

## Validation and review

CI checks PHP tests, TypeScript lint/typecheck/tests/build, and full-history gitleaks on every push and pull request. Tests use in-memory SQLite/array cache and mocked fetch only. See [CONTRIBUTING.md](CONTRIBUTING.md) for commands and Codex provenance requirements.

Repository visibility is an external setting: keep this a new private repository without client/company history. Tech Lead approval is required; no Bugbot. Before public release, full-history gitleaks and trufflehog, internal-name review, Tech Lead final PASS and owner approval are mandatory. No Packagist/npm publication. See [SECURITY.md](SECURITY.md).

Licensed under [MIT](LICENSE).
