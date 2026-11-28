import {
  inspectProgram,
  connections,
  type PrototypeBlock,
  type PrototypeProgram,
} from '@jyboia/block-engine/experimental';

export function describeBlock(
  block: PrototypeBlock,
  program?: PrototypeProgram,
): string {
  switch (block.kind) {
    case 'changeX':
    case 'changeY':
      return `Bloco de movimento: alterar ${block.kind === 'changeX' ? 'x' : 'y'} por ${block.amount}.`;
    case 'direction':
      return `Bloco de movimento: apontar na direção ${block.degrees} graus.`;
    case 'sayFor':
      return `Bloco de aparência: dizer ${block.text || 'texto vazio'} por ${block.seconds} segundos.`;
    case 'goto':
      return `Bloco de movimento: ir para x ${block.x}, y ${block.y}.`;
    case 'show':
      return 'Bloco de aparência: mostrar personagem.';
    case 'hide':
      return 'Bloco de aparência: esconder personagem.';
    case 'wait':
      return `Bloco de controle: esperar ${block.seconds} segundos.`;
    case 'repeat':
      return `Bloco de controle: repetir ${block.times} vezes. ${block.body ? 'Com comandos internos.' : 'Corpo vazio.'}`;
    case 'forever':
      return `Bloco de controle: sempre. ${block.body ? 'Com comandos internos.' : 'Corpo vazio.'}`;
    case 'ifElse':
    case 'if': {
      const condition = program?.blocks.find(
        (item) => item.id === block.condition,
      );
      const expression =
        condition && 'left' in condition
          ? `${condition.left} ${{ gt: 'maior que', lt: 'menor que', eq: 'igual a' }[condition.kind]} ${condition.right}`
          : 'condição';
      return `Bloco de controle: se ${expression}, então${block.kind === 'ifElse' ? ', senão' : ''}. ${block.condition ? 'Condição conectada.' : 'Condição vazia.'} ${block.body ? 'Com comandos internos.' : 'Corpo vazio.'}${block.kind === 'ifElse' ? (block.elseBody ? ' Senão com comandos.' : ' Senão vazio.') : ''}`;
    }
    case 'gt':
    case 'lt':
    case 'eq':
      return `Bloco operador: ${block.left} ${{ gt: 'maior que', lt: 'menor que', eq: 'igual a' }[block.kind]} ${block.right}. Resultado booleano.`;
    case 'set':
      return `Bloco de variável: definir ${block.name} como ${block.value}.`;
    case 'change':
      return `Bloco de variável: alterar ${block.name} por ${block.value}.`;
    case 'start':
      return 'Bloco de evento: quando iniciar.';
    case 'actorClick':
      return 'Bloco de evento: quando o personagem for clicado.';
    case 'move':
      return `Bloco de movimento: mover ${block.steps} passos.`;
    case 'turn':
      return `Bloco de movimento: girar ${Math.abs(block.degrees)} graus para a direita.`;
    case 'say':
      return `Bloco de aparência: dizer ${block.text || 'texto vazio'}.`;
  }
}

export function describeConnection(
  block: PrototypeBlock,
  program: PrototypeProgram,
): string {
  const { predecessors, sequence, parents } = inspectProgram(program);
  const previous = predecessors.get(block.id);
  const position = sequence.findIndex((item) => item.id === block.id);
  const parts = [
    previous || connections(block).length ? 'Conectado.' : 'Solto.',
  ];
  const parent = parents.get(block.id);
  if (parent?.slot === 'body')
    parts.push('Primeiro comando interno do bloco pai.');
  if (parent?.slot === 'elseBody')
    parts.push('Primeiro comando do senão do bloco pai.');
  if (parent?.slot === 'condition')
    parts.push('Encaixado na condição do bloco pai.');
  if (position >= 0)
    parts.push(
      `Posição ${position + 1} de ${sequence.length} na sequência de início.`,
    );
  else parts.push('Fora de uma sequência de início.');
  if (previous)
    parts.push(
      `${parent?.slot === 'next' ? 'Depois de' : 'Dentro de'} ${describeBlock(program.blocks.find((item) => item.id === previous)!)}`,
    );
  if (block.next)
    parts.push(
      `Antes de ${describeBlock(program.blocks.find((item) => item.id === block.next)!)}`,
    );
  return parts.join(' ');
}

export function describeSequence(program: PrototypeProgram): string {
  const { sequence, starts } = inspectProgram(program);
  if (!sequence.length)
    return 'Adicione um bloco Quando iniciar para definir a sequência.';
  const included = new Set(sequence.map((block) => block.id));
  const outside = program.blocks.filter(
    (block) => !included.has(block.id),
  ).length;
  const byId = new Map(program.blocks.map((block) => [block.id, block]));
  let number = 0;
  const describeChain = (id: string | null): string => {
    const result: string[] = [];
    while (id) {
      const block = byId.get(id)!;
      const description = describeBlock(block, program).replace(
        /^Bloco (?:de [^:]+|operador): /,
        '',
      );
      result.push(`Bloco ${++number}: ${description}`);
      if ('body' in block) {
        const name =
          'condition' in block
            ? 'condição'
            : block.kind === 'forever'
              ? 'repetição sempre'
              : 'repetição';
        result.push(
          `Dentro da ${name}: ${describeChain(block.body) || 'Nenhum comando.'} Fim da ${name}.`,
        );
        if (block.kind === 'ifElse')
          result.push(
            `Senão: ${describeChain(block.elseBody) || 'Nenhum comando.'} Fim do senão.`,
          );
      }
      id = block.next;
    }
    return result.join(' ');
  };
  const structured =
    sequence.some((block) => 'body' in block) || starts.length > 1;
  return (
    (structured
      ? 'Descrição inicial da estrutura. Repetições e condições serão avaliadas durante a execução. '
      : '') +
    (starts.length > 1 ? 'As sequências serão executadas em rodízio. ' : '') +
    starts
      .map(
        (start, index) =>
          `${starts.length > 1 ? `Sequência ${index + 1}. ` : ''}${describeChain(start.id)} Fim da sequência.`,
      )
      .join(' ') +
    (outside ? ` ${outside} bloco(s) fora desta sequência.` : '')
  );
}
