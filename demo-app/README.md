# Synthetic demo

From this directory (PHP 8.2+, Composer), four commands:

```sh
composer install
mkdir -p bootstrap/cache storage/framework/views storage/logs
php demo.php
php -S localhost:8000 demo.php
```

The script boots Laravel with the package provider. Fixtures contain only Faker words and synthetic `example.test` addresses; they never enter the health response. Health is disabled by default. To opt in, set `OPS_MCP_ENABLED=true` and `OPS_TOKEN_HASH` in the server process environment before command four. Use a locally generated secret and its SHA-256 hash; send the original as a Bearer token. The local PHP development server uses HTTP; MCP requires an HTTPS origin, so use a local trusted TLS proxy for end-to-end MCP use. No secrets or certificates are supplied.
