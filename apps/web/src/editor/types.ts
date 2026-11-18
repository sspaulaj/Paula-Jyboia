/** Informações de identificação do projeto aberto. */
export interface ProjectInfo {
  id: string | null;
  name: string;
}

/** Categorias de blocos disponíveis na paleta. */
export type BlockCategory =
  | 'motion'
  | 'appearance'
  | 'events'
  | 'control'
  | 'operators'
  | 'variables';

/** Metadados de uma categoria para exibição na interface. */
export interface CategoryMeta {
  id: BlockCategory;
  label: string;
  color: string;
  /** Padrão SVG ou símbolo textual usado como ícone, acessível por aria-hidden */
  icon: string;
}

/** Estado de execução do programa. */
export type ExecutionState = 'idle' | 'running' | 'stopped';
