import {
  inspectProgram,
  type PrototypeProgram,
} from '@jyboia/block-engine/experimental';

export function announceSequence(program: PrototypeProgram): string {
  const { sequence } = inspectProgram(program);
  if (!sequence.length) return 'Nenhuma sequência definida.';
  const byId = new Map(program.blocks.map((block) => [block.id, block]));
  const labels: string[] = [];
  const walk = (id: string | null) => {
    while (id) {
      const block = byId.get(id)!;
      labels.push(describeBlockBrief(block, program));
      if ('body' in block && block.body) {
        walk(block.body);
        labels.push(
          block.kind === 'if' ? 'fim da condição' : 'fim da repetição',
        );
      }
      id = block.next ?? null;
    }
  };
  const { starts } = inspectProgram(program);
  for (const start of starts) walk(start.id);
  return labels
    .map((label) => `${label[0]!.toLocaleUpperCase('pt-BR')}${label.slice(1)}.`)
    .join(' ');
}

function describeBlockBrief(
  block: Parameters<
    typeof import('../experiment/descriptions').describeBlock
  >[0],
  program: PrototypeProgram,
): string {
  switch (block.kind) {
    case 'start':
      return 'quando iniciar programa';
    case 'move':
      return `mover ${block.steps} passos`;
    case 'turn':
      return `girar ${Math.abs(block.degrees)} graus`;
    case 'goto':
      return `ir para x ${block.x}, y ${block.y}`;
    case 'show':
      return 'mostrar personagem';
    case 'hide':
      return 'esconder personagem';
    case 'say':
      return `diga ${block.text || 'texto vazio'}`;
    case 'wait':
      return `esperar ${block.seconds} segundos`;
    case 'repeat':
      return `repetir ${block.times} vezes`;
    case 'forever':
      return 'sempre';
    case 'if': {
      const cond = program.blocks.find((b) => b.id === block.condition);
      const expr =
        cond && 'left' in cond
          ? `${cond.left} ${{ gt: 'maior que', lt: 'menor que', eq: 'igual a' }[cond.kind]} ${cond.right}`
          : 'condição';
      return `se ${expr}`;
    }
    case 'set':
      return `definir ${block.name} como ${block.value}`;
    case 'change':
      return `alterar ${block.name} por ${block.value}`;
    case 'gt':
      return `${block.left} maior que ${block.right}`;
    case 'lt':
      return `${block.left} menor que ${block.right}`;
    case 'eq':
      return `${block.left} igual a ${block.right}`;
  }
}
