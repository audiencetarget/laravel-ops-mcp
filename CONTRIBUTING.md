# Contributing

Use synthetic fixtures and example.test URLs only. Never commit credentials, client code, internal identifiers, or copied company history.

Run the PHP suite in packages/laravel-ops with `composer install && vendor/bin/phpunit`. In mcp-server run `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.

All code for this skeleton is authored through Codex CLI. Include the Codex session ID and working directory in the commit and PR description. Tech Lead review is the merge gate; do not enable Bugbot. Do not push, publish, or make the repository public without the required authorization and release gates documented in SECURITY.md.
