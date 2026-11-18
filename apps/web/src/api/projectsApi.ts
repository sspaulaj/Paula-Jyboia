/**
 * Camada de comunicação com a API REST de projetos.
 * Componentes visuais não devem importar fetch diretamente.
 */

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  updatedAt: string;
}

export interface ProjectDocument {
  id: string;
  name: string;
  description: string | null;
  workspaceData: unknown;
  formatVersion: string;
  revision: number;
  updatedAt: string;
}

function apiBase(): string {
  return import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:3001';
}

function buildUrl(path: string): URL {
  const url = new URL(path, apiBase());
  if (!['http:', 'https:'].includes(url.protocol))
    throw new Error('Endereço da API inválido.');
  return url;
}

export async function listProjects(
  signal?: AbortSignal,
): Promise<ProjectSummary[]> {
  const response = await fetch(buildUrl('/api/projects'), {
    ...(signal ? { signal } : {}),
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error('Não foi possível listar os projetos.');
  const body = (await response.json()) as { items: ProjectSummary[] };
  return body.items;
}

export async function getProject(
  id: string,
  signal?: AbortSignal,
): Promise<ProjectDocument> {
  const response = await fetch(buildUrl(`/api/projects/${id}`), {
    ...(signal ? { signal } : {}),
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error('Não foi possível carregar o projeto.');
  return (await response.json()) as ProjectDocument;
}

export async function createProject(data: {
  name: string;
  description?: string;
  workspaceData: unknown;
  formatVersion: string;
}): Promise<ProjectDocument> {
  const response = await fetch(buildUrl('/api/projects'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Não foi possível criar o projeto.');
  return (await response.json()) as ProjectDocument;
}

export async function saveProject(
  id: string,
  revision: number,
  data: {
    name: string;
    description?: string;
    workspaceData: unknown;
    formatVersion: string;
  },
): Promise<ProjectDocument> {
  const response = await fetch(buildUrl(`/api/projects/${id}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'If-Match': String(revision),
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Não foi possível salvar o projeto.');
  return (await response.json()) as ProjectDocument;
}
