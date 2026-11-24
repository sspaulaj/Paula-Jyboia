/** Only these reviewed examples can be requested from the worker. No free-code execution. */
export const programs = [
  { id: 'hello', name: 'Olá, mundo', code: 'print("Olá, mundo!")' },
  {
    id: 'name',
    name: 'Perguntar o nome',
    code: 'nome = input("Qual é o seu nome? ")\nprint("Olá,", nome)',
  },
  {
    id: 'two-inputs',
    name: 'Duas perguntas',
    code: 'nome = input("Qual é o seu nome? ")\ncor = input("Qual é a sua cor favorita? ")\nprint(nome, "gosta de", cor)',
  },
  {
    id: 'integer',
    name: 'Somar um número inteiro',
    code: 'numero = int(input("Digite um número inteiro: "))\nprint(numero + 1)',
  },
  {
    id: 'float',
    name: 'Dobrar um número decimal',
    code: 'numero = float(input("Digite um número decimal usando ponto: "))\nprint(numero * 2)',
  },
  {
    id: 'condition',
    name: 'Condicional e repetição',
    code: 'numero = int(input("Quantas vezes? "))\nif numero > 0:\n    for i in range(numero):\n        print("Olá", i + 1)\nelse:\n    print("Nenhuma repetição.")',
  },
  {
    id: 'syntax-error',
    name: 'Erro de sintaxe',
    code: 'if True\n    print("Olá")',
  },
  { id: 'runtime-error', name: 'Erro de execução', code: 'print(1 / 0)' },
  {
    id: 'infinite',
    name: 'Laço infinito — testar Parar',
    code: 'print("Laço iniciado.")\nwhile True:\n    pass',
  },
  {
    id: 'output-limit',
    name: 'Limite de saída',
    code: 'while True:\n    print("Linha de teste")',
  },
] as const;

export type ProgramId = (typeof programs)[number]['id'];
export function findProgram(id: string) {
  return programs.find((program) => program.id === id);
}
