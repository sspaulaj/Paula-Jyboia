import { writeFile } from 'node:fs/promises';
import { openApiDocument } from '../packages/shared/dist/openapi.js';
// JSON é um subconjunto de YAML; não requer outro parser ou gerador.
await writeFile(
  new URL('../docs/openapi.yaml', import.meta.url),
  JSON.stringify(openApiDocument, null, 2) + '\n',
);
