// Conteúdo das cartas. O gabarito NÃO fica aqui: ele está protegido no banco (tabela card_keys).
// Os itens estão propositalmente fora de ordem e com ids aleatórios.

export type Item = { id: string; text: string };
export type Category = { id: string; label: string; hint?: string };

export type ClassifyPart = {
  id: string;
  kind: 'classify';
  layout: 'buckets' | 'match';
  title: string;
  instructions: string;
  categories: Category[];
  items: Item[];
};
export type OrderPart = { id: string; kind: 'order'; title: string; instructions: string; items: Item[] };
export type FlowPart = { id: string; kind: 'flow'; title: string; instructions: string; items: Item[] };
export type SinglePart = { id: string; kind: 'single'; title: string; instructions: string; options: Item[] };
export type Part = ClassifyPart | OrderPart | FlowPart | SinglePart;

export type CardDef = {
  id: string;
  title: string;
  concept: string;
  emoji: string;
  gradient: string;
  summary: string;
  type: 'auto' | 'draw';
  parts?: Part[];
  draw?: { mode: 'storyboard' | 'logo'; instructions: string; screenLabel?: string };
};

export const SYMBOLS = [
  { id: 'inicio_fim', label: 'Início / Fim' },
  { id: 'atividade', label: 'Atividade' },
  { id: 'decisao', label: 'Decisão' },
] as const;

export const CARDS: CardDef[] = [
  {
    id: 'mapa_empatia',
    title: 'Mapa de Empatia',
    concept: 'Design Thinking · Imersão',
    emoji: '💭',
    gradient: 'from-pink-500 to-rose-500',
    summary: 'Entenda o aluno que pega fila: o que ele pensa, sente, fala e faz.',
    type: 'auto',
    parts: [
      {
        id: 'm',
        kind: 'classify',
        layout: 'buckets',
        title: 'O aluno da fila',
        instructions: 'Coloque cada frase no quadrante certo do mapa de empatia.',
        categories: [
          { id: 'pensa', label: 'Pensa', hint: 'pensamentos e dúvidas' },
          { id: 'sente', label: 'Sente', hint: 'emoções' },
          { id: 'fala', label: 'Fala', hint: 'o que diz em voz alta' },
          { id: 'faz', label: 'Faz', hint: 'atitudes e ações' },
        ],
        items: [
          { id: 'xa', text: '“Guarda meu lugar enquanto vou ao banheiro?”' },
          { id: 'rb', text: 'Ansioso por perder parte do intervalo' },
          { id: 'vn', text: 'Sai correndo da sala para chegar primeiro' },
          { id: 'qz', text: 'Será que vai dar tempo de comer antes do sinal?' },
          { id: 'kp', text: '“Essa fila não anda nunca!”' },
          { id: 'hd', text: 'Desiste do lanche quando a fila está grande' },
          { id: 'lm', text: 'Deveria existir um jeito mais rápido de comprar' },
          { id: 'tw', text: 'Irritado quando alguém fura a fila' },
        ],
      },
    ],
  },
  {
    id: 'arvore_problemas',
    title: 'Árvore de Problemas',
    concept: 'Ferramentas de Inovação',
    emoji: '🌳',
    gradient: 'from-emerald-500 to-lime-500',
    summary: 'Separe as causas (raízes) e os efeitos (galhos) do problema “fila grande na cantina”.',
    type: 'auto',
    parts: [
      {
        id: 'a',
        kind: 'classify',
        layout: 'buckets',
        title: 'Problema central: fila grande na cantina',
        instructions: 'Arraste cada item para as raízes (causa) ou para os galhos (efeito).',
        categories: [
          { id: 'efeito', label: '🍃 Efeitos (galhos)', hint: 'consequências do problema' },
          { id: 'causa', label: '🌱 Causas (raízes)', hint: 'o que gera o problema' },
        ],
        items: [
          { id: 'gb', text: 'Alunos ficam sem lanche' },
          { id: 'fj', text: 'Pagamento e preparo acontecem no mesmo balcão' },
          { id: 'wi', text: 'A cantina perde vendas' },
          { id: 'ux', text: 'Só existe um caixa para atender todo mundo' },
          { id: 'os', text: 'O intervalo é desperdiçado na espera' },
          { id: 'nc', text: 'O pedido só pode ser feito na hora' },
          { id: 'dk', text: 'Alunos chegam atrasados na aula seguinte' },
          { id: 'ye', text: 'Todas as turmas saem no mesmo horário de intervalo' },
        ],
      },
    ],
  },
  {
    id: 'arvore_solucoes',
    title: 'Árvore de Soluções',
    concept: 'Ferramentas de Inovação',
    emoji: '🌿',
    gradient: 'from-teal-500 to-emerald-500',
    summary: 'Transforme cada causa da fila em um objetivo que a resolve.',
    type: 'auto',
    parts: [
      {
        id: 's',
        kind: 'classify',
        layout: 'match',
        title: 'De causa para objetivo',
        instructions: 'Para cada causa, escolha o objetivo que a resolve.',
        categories: [
          { id: 'o8', label: 'Separar o balcão de retirada do preparo' },
          { id: 'o1', label: 'Permitir pedidos antecipados pelo app' },
          { id: 'o3', label: 'Avisar o aluno quando o pedido estiver pronto' },
          { id: 'o5', label: 'Ampliar as formas de pagamento (pagar pelo app)' },
        ],
        items: [
          { id: 'c2', text: 'O pedido só pode ser feito na hora' },
          { id: 'c4', text: 'O aluno não sabe quando o lanche fica pronto' },
          { id: 'c7', text: 'Só existe um caixa para pagar' },
          { id: 'c9', text: 'Pagamento e preparo no mesmo balcão' },
        ],
      },
    ],
  },
  {
    id: 'fluxograma',
    title: 'Fluxograma',
    concept: 'Mapeamento de Processos',
    emoji: '🔀',
    gradient: 'from-sky-500 to-indigo-500',
    summary: 'Monte o fluxograma do pedido no FilaZero com a ordem e os símbolos certos.',
    type: 'auto',
    parts: [
      {
        id: 'f',
        kind: 'flow',
        title: 'Fluxo do pedido no app',
        instructions: 'Arraste as etapas para a ordem certa e escolha o símbolo de cada uma.',
        items: [
          { id: 'f7', text: 'Enviar o pedido para a cantina' },
          { id: 'f6', text: 'Retirar o lanche no balcão' },
          { id: 'f1', text: 'Pagamento aprovado?' },
          { id: 'f4', text: 'Abrir o FilaZero' },
          { id: 'f2', text: 'Receber o aviso de pedido pronto' },
          { id: 'f9', text: 'Escolher o lanche no cardápio' },
        ],
      },
    ],
  },
  {
    id: 'sipoc',
    title: 'SIPOC',
    concept: 'Mapeamento de Processos',
    emoji: '🧩',
    gradient: 'from-violet-500 to-fuchsia-500',
    summary: 'Organize o processo da cantina com o FilaZero nas 5 colunas do SIPOC.',
    type: 'auto',
    parts: [
      {
        id: 'x',
        kind: 'classify',
        layout: 'buckets',
        title: 'SIPOC da cantina com o FilaZero',
        instructions: 'Coloque cada item na coluna certa.',
        categories: [
          { id: 'S', label: 'S · Fornecedor', hint: 'Supplier' },
          { id: 'I', label: 'I · Entrada', hint: 'Input' },
          { id: 'P', label: 'P · Processo', hint: 'Process' },
          { id: 'O', label: 'O · Saída', hint: 'Output' },
          { id: 'C', label: 'C · Cliente', hint: 'Customer' },
        ],
        items: [
          { id: 'ry', text: 'Lanche pronto para retirar' },
          { id: 'mt', text: 'Ingredientes do lanche' },
          { id: 'uh', text: 'Professores e funcionários' },
          { id: 'pw', text: 'Fornecedor de pães e frios' },
          { id: 'ld', text: 'Preparar o lanche' },
          { id: 'ag', text: 'Comprovante de pagamento' },
          { id: 'bq', text: 'Pedido feito pelo aluno no app' },
          { id: 'nx', text: 'Alunos da escola' },
          { id: 've', text: 'Confirmar o pagamento' },
          { id: 'zk', text: 'Empresa de pagamentos digitais' },
        ],
      },
    ],
  },
  {
    id: 'as_is_to_be',
    title: 'AS-IS / TO-BE',
    concept: 'Mapeamento de Processos',
    emoji: '🔁',
    gradient: 'from-amber-500 to-orange-500',
    summary: 'Compare como é comprar lanche hoje (AS-IS) com o processo usando o app (TO-BE).',
    type: 'auto',
    parts: [
      {
        id: 'asis',
        kind: 'order',
        title: 'AS-IS · como é hoje',
        instructions: 'Coloque os passos de hoje na ordem certa.',
        items: [
          { id: 'a6', text: 'Pagar no caixa' },
          { id: 'a1', text: 'Entrar na fila do balcão' },
          { id: 'a8', text: 'Sair da sala quando o sinal toca' },
          { id: 'a5', text: 'Receber o lanche' },
          { id: 'a3', text: 'Entrar na fila do caixa' },
        ],
      },
      {
        id: 'tobe',
        kind: 'order',
        title: 'TO-BE · como fica com o app',
        instructions: 'Coloque os passos do novo processo na ordem certa.',
        items: [
          { id: 'b9', text: 'Receber o aviso de pedido pronto' },
          { id: 'b4', text: 'Retirar o lanche no balcão' },
          { id: 'b6', text: 'Fazer o pedido pelo app antes do intervalo' },
          { id: 'b2', text: 'Pagar pelo próprio app' },
        ],
      },
      {
        id: 'gargalo',
        kind: 'single',
        title: 'Qual é o gargalo eliminado?',
        instructions: 'Escolha o passo do AS-IS que mais trava o processo e que o app elimina.',
        options: [
          { id: 'a5', text: 'Receber o lanche' },
          { id: 'a8', text: 'Sair da sala quando o sinal toca' },
          { id: 'a3', text: 'Entrar na fila do caixa' },
          { id: 'a1', text: 'Entrar na fila do balcão' },
        ],
      },
    ],
  },
  {
    id: 'scrum_agil',
    title: 'Scrum & Ágil',
    concept: 'Gerenciar Projetos',
    emoji: '⚡',
    gradient: 'from-indigo-500 to-purple-500',
    summary: 'Ligue os termos do Scrum às definições e separe o que é ágil do que é tradicional.',
    type: 'auto',
    parts: [
      {
        id: 'termos',
        kind: 'classify',
        layout: 'match',
        title: 'Termos do Scrum',
        instructions: 'Escolha a definição certa de cada termo.',
        categories: [
          { id: 'd1', label: 'Remove impedimentos e ajuda o time a seguir o Scrum' },
          { id: 'd2', label: 'Reunião diária de 15 minutos para alinhar o trabalho' },
          { id: 'd3', label: 'Lista ordenada do que é necessário no produto' },
          { id: 'd4', label: 'Maximiza o valor do produto e ordena o backlog' },
          { id: 'd5', label: 'Busca melhorar a forma como o time trabalha' },
          { id: 'd6', label: 'Constroem o incremento durante a Sprint' },
        ],
        items: [
          { id: 'tr', text: 'Retrospectiva' },
          { id: 'tp', text: 'Product Owner' },
          { id: 'tb', text: 'Product Backlog' },
          { id: 'ts', text: 'Scrum Master' },
          { id: 'ty', text: 'Daily' },
          { id: 'td', text: 'Developers' },
        ],
      },
      {
        id: 'modelos',
        kind: 'classify',
        layout: 'buckets',
        title: 'Ágil × Tradicional',
        instructions: 'Separe as características de cada modelo.',
        categories: [
          { id: 'agil', label: '⚡ Ágil' },
          { id: 'tradicional', label: '📐 Tradicional (cascata)' },
        ],
        items: [
          { id: 'm6', text: 'Planejamento detalhado no início' },
          { id: 'm3', text: 'Entregas pequenas e frequentes' },
          { id: 'm2', text: 'Escopo fechado' },
          { id: 'm8', text: 'Mudanças são bem-vindas' },
          { id: 'm9', text: 'Fases sequenciais e rígidas' },
          { id: 'm1', text: 'Cliente participa o tempo todo' },
        ],
      },
    ],
  },
  {
    id: 'conflitos_tempo',
    title: 'Conflitos & Tempo',
    concept: 'Administração de Conflitos e do Tempo',
    emoji: '🤝',
    gradient: 'from-cyan-500 to-blue-500',
    summary: 'Identifique a forma de resolver cada conflito e separe a boa e a má gestão do tempo.',
    type: 'auto',
    parts: [
      {
        id: 'conflitos',
        kind: 'classify',
        layout: 'match',
        title: 'Formas de resolução de conflitos',
        instructions: 'Qual forma de resolução aparece em cada situação?',
        categories: [
          { id: 'supressao', label: 'Supressão' },
          { id: 'evasao', label: 'Evasão' },
          { id: 'acomodacao', label: 'Acomodação' },
          { id: 'harmonizacao', label: 'Harmonização' },
        ],
        items: [
          { id: 's1', text: 'O cliente e a equipe de TI conversam com respeito e chegam a um prazo que agrada aos dois.' },
          { id: 's7', text: 'O diretor impõe a data de lançamento e encerra a discussão.' },
          { id: 's4', text: 'O gerente adia a reunião para não discutir o problema da equipe.' },
          { id: 's2', text: 'O desenvolvedor aceita o prazo do cliente, mesmo discordando, para manter a boa relação.' },
        ],
      },
      {
        id: 'tempo',
        kind: 'classify',
        layout: 'buckets',
        title: 'Administração do tempo',
        instructions: 'Separe as atitudes de boa e de má gestão do tempo.',
        categories: [
          { id: 'boa', label: '✅ Boa gestão do tempo' },
          { id: 'ma', label: '❌ Má gestão do tempo' },
        ],
        items: [
          { id: 'h4', text: 'Deixar tudo para a última hora' },
          { id: 'h7', text: 'Separar um horário para cada tarefa' },
          { id: 'h1', text: 'Ficar trocando de tarefa toda hora' },
          { id: 'h2', text: 'Planejar as tarefas do dia na agenda' },
          { id: 'h6', text: 'Esperar na fila sem nenhum planejamento' },
          { id: 'h9', text: 'Fazer pausas curtas entre as tarefas' },
        ],
      },
    ],
  },
  {
    id: 'storyboard',
    title: 'Storyboard',
    concept: 'Design Thinking · Prototipação',
    emoji: '🎬',
    gradient: 'from-orange-500 to-pink-500',
    summary: 'Desenhe em 4 quadros um aluno usando o FilaZero, com uma legenda em cada um.',
    type: 'draw',
    draw: {
      mode: 'storyboard',
      instructions: 'Desenhe 4 cenas em sequência mostrando um aluno usando o FilaZero e escreva uma legenda curta para cada quadro.',
    },
  },
  {
    id: 'logo_tela',
    title: 'Logo & Tela do App',
    concept: 'Design Thinking · Prototipação',
    emoji: '🎨',
    gradient: 'from-fuchsia-500 to-violet-500',
    summary: 'Desenhe o logo do FilaZero e um rascunho da tela principal do aplicativo.',
    type: 'draw',
    draw: {
      mode: 'logo',
      instructions: 'À esquerda, desenhe o logo do FilaZero. À direita, faça o rascunho (protótipo) da tela principal do app.',
    },
  },
];

export const CHANGE_CARD = 'arvore_problemas';
/** Título, emoji e tipo de cada carta (iguais em todos os temas) */
export const CARD_BY_ID: Record<string, CardDef> = Object.fromEntries(CARDS.map((c) => [c.id, c]));
