<?php

namespace AudienceTarget\LaravelOps\Tests;

use AudienceTarget\LaravelOps\OpsServiceProvider;
use Orchestra\Testbench\TestCase;

class HealthTest extends TestCase
{
    protected function getPackageProviders($app): array
    {
        return [OpsServiceProvider::class];
    }

    protected function defineEnvironment($app): void
    {
        $app['config']->set('ops.enabled', true);
        $app['config']->set('ops.token_hash', hash('sha256', 'fake-test-value'));
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');
        $app['config']->set('cache.default', 'array');
    }

    public function test_missing_and_bad_tokens_are_rejected(): void
    {
        $this->getJson('/api/ops/health')->assertUnauthorized();
        $this->withToken('fake-invalid-value')->getJson('/api/ops/health')->assertUnauthorized();
    }

    public function test_disabled_endpoint_is_hidden(): void
    {
        config(['ops.enabled' => false]);
        $this->getJson('/api/ops/health')->assertNotFound();
        $this->withToken('fake-test-value')->getJson('/api/ops/health')->assertNotFound();
    }

    public function test_default_is_disabled(): void
    {
        $defaults = require __DIR__.'/../config/ops.php';
        $this->assertFalse($defaults['enabled']);
    }

    public function test_exact_allowlist_and_password_hash(): void
    {
        foreach ([hash('sha256', 'fake-test-value'), password_hash('fake-test-value', PASSWORD_DEFAULT)] as $hash) {
            config(['ops.token_hash' => $hash]);
            $json = $this->withToken('fake-test-value')->getJson('/api/ops/health')->assertOk()->json();
            $this->assertSame(['app', 'env', 'versions', 'db', 'cache'], array_keys($json));
            $this->assertSame(['php', 'laravel'], array_keys($json['versions']));
            $this->assertSame(['ok' => true], $json['db']);
            $this->assertSame(['ok' => true], $json['cache']);
        }
    }

    public function test_unauthenticated_requests_are_rate_limited(): void
    {
        for ($i = 0; $i < 60; $i++) {
            $this->getJson('/api/ops/health')->assertUnauthorized();
        }
        $this->getJson('/api/ops/health')->assertStatus(429);
    }

    public function test_disabled_requests_are_rate_limited(): void
    {
        config(['ops.enabled' => false]);
        for ($i = 0; $i < 60; $i++) {
            $this->getJson('/api/ops/health')->assertNotFound();
        }
        $this->getJson('/api/ops/health')->assertStatus(429);
    }

    public function test_rate_limit(): void
    {
        for ($i = 0; $i < 60; $i++) {
            $this->withToken('fake-test-value')->getJson('/api/ops/health')->assertOk();
        }
        $this->withToken('fake-test-value')->getJson('/api/ops/health')->assertStatus(429);
    }
}
