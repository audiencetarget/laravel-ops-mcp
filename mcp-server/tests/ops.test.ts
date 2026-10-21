import { describe, it, expect, vi } from 'vitest';
import { callTool, parseConfig, toolDefinitions } from '../src/ops.js';
const config = parseConfig({ sites: { demo: { url: 'https://demo.example.test', tokenEnv: 'LARAVEL_OPS_TOKEN_DEMO' } } });
const health = { app: 'Fake Demo', env: 'testing', versions: { php: '8.3', laravel: '12' }, db: { ok: true }, cache: { ok: true } };
const env = { LARAVEL_OPS_TOKEN_DEMO: 'fake-test-value' };
describe('read-only tools', () => {
  it('advertises exactly both tools', () => {
    expect(toolDefinitions.map(t => t.name)).toEqual(['list_sites', 'get_health']);
  });
  it('lists names without credentials or requests', async () => {
    const fetcher = vi.fn();
    expect(await callTool(config, 'list_sites', {}, env, fetcher)).toEqual({ sites: ['demo'] });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('gets allowlisted health using an environment token', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify(health)));
    expect(await callTool(config, 'get_health', { site: 'demo' }, env, fetcher)).toEqual(health);
    expect(fetcher).toHaveBeenCalledWith(new URL('https://demo.example.test/api/ops/health'), expect.objectContaining({ headers: { Authorization: 'Bearer fake-test-value', Accept: 'application/json' }, redirect: 'error' }));
  });
  it('rejects inline tokens, URLs, unknown sites and tools before fetch', async () => {
    const fetcher = vi.fn();
    for (const args of [{ site: 'demo', token: 'fake' }, { site: 'demo', url: 'https://other.example.test' }, { site: 'other' }, { site: '__proto__' }]) {
      await expect(callTool(config, 'get_health', args, env, fetcher)).rejects.toThrow();
    }
    await expect(callTool(config, 'list_sites', { token: 'fake' }, env, fetcher)).rejects.toThrow();
    await expect(callTool(config, 'health', {}, env, fetcher)).rejects.toThrow();
    await expect(callTool(config, 'get_health', { site: 'demo' }, {}, fetcher)).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('rejects redirects, failures, extra fields and malformed responses', async () => {
    for (const response of [new Response('', { status: 302 }), new Response('', { status: 401 }), new Response(JSON.stringify({ ...health, secret: 'fake' })), new Response('{}')]) {
      await expect(callTool(config, 'get_health', { site: 'demo' }, env, vi.fn().mockResolvedValue(response))).rejects.toThrow();
    }
    await expect(callTool(config, 'get_health', { site: 'demo' }, env, vi.fn().mockRejectedValue(new Error('fake')))).rejects.toThrow('Health request failed');
  });
  it('requires strict HTTPS origin configuration without inline credentials', () => {
    const credentialUrl = new URL('https://demo.example.test');
    credentialUrl.username = 'fake';
    credentialUrl.password = 'fake';
    for (const url of ['http://demo.example.test', 'https://demo.example.test/path', credentialUrl.href, 'https://demo.example.test?token=fake']) {
      expect(() => parseConfig({ sites: { demo: { url, tokenEnv: 'LARAVEL_OPS_TOKEN_DEMO' } } })).toThrow();
    }
    expect(() => parseConfig({ sites: { demo: { ...config.sites.demo, token: 'fake' } } })).toThrow();
  });
});
