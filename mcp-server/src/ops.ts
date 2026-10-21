import { z } from 'zod';

const siteSchema = z.object({
  url: z.string().url(),
  tokenEnv: z.string().regex(/^LARAVEL_OPS_TOKEN_[A-Z0-9_]+$/),
}).strict();
const configSchema = z.object({ sites: z.record(z.string().regex(/^[a-zA-Z0-9_-]+$/), siteSchema) }).strict();
export type Config = z.infer<typeof configSchema>;
export function parseConfig(input: unknown): Config {
  const config = configSchema.parse(input);
  for (const site of Object.values(config.sites)) {
    const url = new URL(site.url);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
      throw new Error('Sites must use HTTPS origins without credentials, paths, queries or fragments');
    }
  }
  return config;
}
const healthSchema = z.object({
  app: z.string(), env: z.string(),
  versions: z.object({ php: z.string(), laravel: z.string() }).strict(),
  db: z.object({ ok: z.boolean() }).strict(), cache: z.object({ ok: z.boolean() }).strict(),
}).strict();
export const toolDefinitions = [
  { name: 'list_sites', description: 'List configured site names.', inputSchema: { type: 'object', properties: {}, additionalProperties: false } },
  { name: 'get_health', description: 'Read health for a configured site.', inputSchema: { type: 'object', properties: { site: { type: 'string' } }, required: ['site'], additionalProperties: false } },
];
export async function callTool(config: Config, name: string, args: unknown, env: NodeJS.ProcessEnv = process.env, fetcher: typeof fetch = fetch): Promise<unknown> {
  if (name === 'list_sites') {
    z.object({}).strict().parse(args ?? {});
    return { sites: Object.keys(config.sites) };
  }
  if (name !== 'get_health') throw new Error('Unknown tool');
  const { site } = z.object({ site: z.string() }).strict().parse(args);
  if (!Object.hasOwn(config.sites, site)) throw new Error('Unknown site');
  const entry = config.sites[site];
  const token = env[entry.tokenEnv];
  if (!token || /[\r\n]/.test(token)) throw new Error('Missing or invalid site token environment variable');
  let response: Response;
  try {
    response = await fetcher(new URL('/api/ops/health', entry.url), {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      redirect: 'error', signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new Error('Health request failed');
  }
  if (!response.ok) throw new Error(`Health endpoint returned HTTP ${response.status}`);
  try {
    return healthSchema.parse(await response.json());
  } catch {
    throw new Error('Invalid health response');
  }
}
