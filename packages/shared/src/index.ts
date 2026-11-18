export { PROJECT_SCHEMA_VERSION } from '@jyboia/block-engine/model';
export type { ProjectSchemaVersion } from '@jyboia/block-engine/model';

export interface HealthResponse {
  status: 'ok';
  service: 'jyboia-api';
}

export const healthResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['status', 'service'],
  properties: {
    status: { type: 'string', const: 'ok' },
    service: { type: 'string', const: 'jyboia-api' },
  },
} as const;

export function isHealthResponse(value: unknown): value is HealthResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    value.status === 'ok' &&
    'service' in value &&
    value.service === 'jyboia-api'
  );
}
