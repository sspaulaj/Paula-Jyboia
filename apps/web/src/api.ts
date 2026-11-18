import { isHealthResponse, type HealthResponse } from '@jyboia/shared';

export async function getHealth(
  baseUrl: string,
  signal?: AbortSignal,
): Promise<HealthResponse> {
  const url = new URL('/health', baseUrl);
  if (!['http:', 'https:'].includes(url.protocol))
    throw new Error('Endereço da API inválido.');
  const response = await fetch(url, signal ? { signal } : {});
  if (!response.ok) throw new Error('Não foi possível conectar ao serviço.');
  const body: unknown = await response.json();
  if (!isHealthResponse(body)) throw new Error('Resposta do serviço inválida.');
  return body;
}
