/** Formato persistível independente de Blockly e do interpretador. */
export const PROJECT_SCHEMA_VERSION = 1 as const;
export type ProjectSchemaVersion = typeof PROJECT_SCHEMA_VERSION;
export type {
  ProjectDocument,
  ProgramBlock,
  DocumentIssue,
} from './document.js';
