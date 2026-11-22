const number = (
  name: string,
  value: number,
  min = -1e9,
  max = 1e9,
  precision = 1,
) => ({ type: 'field_number', name, value, min, max, precision });
const text = (name: string, value: string) => ({
  type: 'field_input',
  name,
  text: value,
});
const body = { type: 'input_statement', name: 'BODY', check: 'Command' };
const command = (
  kind: string,
  message0: string,
  args0: object[],
  colour: string,
) => ({
  type: `jyboia_${kind}`,
  message0,
  args0,
  colour,
  previousStatement: 'Command',
  nextStatement: 'Command',
});

export const extendedDefinitions = [
  command(
    'goto',
    'ir para x %1 y %2',
    [number('X', 0, -240, 240), number('Y', 0, -180, 180)],
    '#285cba',
  ),
  command('show', 'mostrar', [], '#7542a6'),
  command('hide', 'esconder', [], '#7542a6'),
  command(
    'wait',
    'esperar %1 segundos',
    [number('SECONDS', 1, 0, 30, 0.1)],
    '#995000',
  ),
  command(
    'repeat',
    'repetir %1 vezes %2',
    [number('TIMES', 3, 0, 1000), body],
    '#995000',
  ),
  command('forever', 'sempre %1', [body], '#995000'),
  command(
    'if',
    'se %1 então %2',
    [{ type: 'input_value', name: 'CONDITION', check: 'Boolean' }, body],
    '#995000',
  ),
  ...(['gt', 'lt', 'eq'] as const).map((kind) => ({
    type: `jyboia_${kind}`,
    message0: `%1 ${{ gt: 'maior que', lt: 'menor que', eq: 'igual a' }[kind]} %2`,
    args0: [text('LEFT', '1'), text('RIGHT', '0')],
    output: 'Boolean',
    colour: '#236e32',
    inputsInline: true,
  })),
  command(
    'set',
    'definir variável %1 como %2',
    [text('NAME', 'pontos'), number('VALUE', 0, -1e9, 1e9, 0)],
    '#a32e49',
  ),
  command(
    'change',
    'alterar variável %1 por %2',
    [text('NAME', 'pontos'), number('VALUE', 1, -1e9, 1e9, 0)],
    '#a32e49',
  ),
];
