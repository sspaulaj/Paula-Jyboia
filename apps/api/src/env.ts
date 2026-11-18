import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

export function loadEnvironment(): void {
  config({
    path: fileURLToPath(new URL('../../../.env', import.meta.url)),
    quiet: true,
  });
}

export function readServerConfig(env: NodeJS.ProcessEnv = process.env) {
  const port = Number(env.API_PORT ?? '3001');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('API_PORT deve ser uma porta entre 1 e 65535.');
  }
  const rawOrigin = env.WEB_ORIGIN ?? 'http://localhost:5173';
  const origin = new URL(rawOrigin);
  if (
    !['http:', 'https:'].includes(origin.protocol) ||
    origin.origin !== rawOrigin
  ) {
    throw new Error(
      'WEB_ORIGIN deve conter uma única origem HTTP, sem caminho ou barra final.',
    );
  }
  const host = env.API_HOST ?? '127.0.0.1';
  if (!['127.0.0.1', '::1', 'localhost'].includes(host))
    throw new Error(
      'API_HOST deve ser loopback enquanto não há política de acesso.',
    );
  return { host, port, webOrigin: origin.origin };
}
