/** Shared instructions for native Blockly field semantics and pointer feedback. */
export const fieldInstructions: Record<string, string> = {
  SECONDS: 'Inserir quantidade de segundos',
  TIMES: 'Inserir quantidade de vezes',
  STEPS: 'Inserir quantidade de passos',
  DEGREES: 'Inserir quantidade de graus para girar à direita',
  DIRECTION: 'Inserir direção em graus',
  TEXT: 'Inserir texto da fala',
  X: 'Inserir posição horizontal X',
  Y: 'Inserir posição vertical Y',
  AMOUNT: 'Inserir valor da alteração de posição',
  NAME: 'Inserir nome da variável',
  VALUE: 'Inserir valor da variável',
  LEFT: 'Inserir primeiro valor da comparação',
  RIGHT: 'Inserir segundo valor da comparação',
};

export function describeField(name: string, value: string): string {
  return `${fieldInstructions[name]}. Valor atual: ${value || 'vazio'}.`;
}
