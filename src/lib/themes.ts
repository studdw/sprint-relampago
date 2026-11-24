// =====================================================================
// TEMAS DA RODADA (um é sorteado quando o Planning começa)
// O gabarito de cada tema fica protegido no banco (tabela card_keys).
// =====================================================================
import { CARDS, type CardDef } from './cards';

export type ThemeId = 'filazero' | 'provador' | 'atendimento';

export type GameTheme = {
  id: ThemeId;
  name: string;
  emoji: string;
  place: string;
  question: string;
  problem: string;
  mission: string;
};

export const THEMES: GameTheme[] = [
  {
    id: 'filazero',
    name: 'FilaZero',
    emoji: '🍔',
    place: 'Cantina da escola',
    question: 'Como criar um aplicativo que acaba com a fila da cantina da escola?',
    problem:
      'No intervalo todo mundo sai ao mesmo tempo, só existe um caixa e o pedido só pode ser feito na hora. Resultado: fila enorme, alunos sem lanche e atrasados para a aula.',
    mission: 'Criar o FilaZero: um app para pedir e pagar o lanche antes do intervalo e só retirar no balcão.',
  },
  {
    id: 'provador',
    name: 'Provador Virtual',
    emoji: '👗',
    place: 'Loja de roupas',
    question: 'Como acabar com a fila dos provadores usando um provador virtual?',
    problem:
      'A loja tem poucos provadores, cada cliente leva muitas peças e trocar de roupa demora. Resultado: fila no provador, clientes desistindo e a loja perdendo vendas.',
    mission: 'Criar o Provador Virtual da Spin To Dress: um totem com scanner 3D que mostra a roupa no corpo do cliente sem precisar vestir.',
  },
  {
    id: 'atendimento',
    name: 'AtendeJá',
    emoji: '💬',
    place: 'Loja online',
    question: 'Como resolver as reclamações de clientes que esperam demais pelo atendimento?',
    problem:
      'A empresa tem poucos atendentes, cada um pede os mesmos dados de novo e não há registro das reclamações. Resultado: horas de espera, clientes irritados e reclamações nas redes sociais.',
    mission: 'Criar o AtendeJá: um chat de atendimento que responde as dúvidas comuns na hora e organiza as reclamações por prioridade.',
  },
];
export const THEME_BY_ID = Object.fromEntries(THEMES.map((t) => [t.id, t])) as Record<ThemeId, GameTheme>;
export const themeOf = (id?: string | null): GameTheme => THEME_BY_ID[id as ThemeId] ?? THEMES[0];

type Override = Partial<Pick<CardDef, 'summary' | 'parts' | 'draw'>>;

const EMPATIA_CATS = [
  { id: 'pensa', label: 'Pensa', hint: 'pensamentos e dúvidas' },
  { id: 'sente', label: 'Sente', hint: 'emoções' },
  { id: 'fala', label: 'Fala', hint: 'o que diz em voz alta' },
  { id: 'faz', label: 'Faz', hint: 'atitudes e ações' },
];
const ARVORE_CATS = [
  { id: 'efeito', label: '🍃 Efeitos (galhos)', hint: 'consequências do problema' },
  { id: 'causa', label: '🌱 Causas (raízes)', hint: 'o que gera o problema' },
];
const SIPOC_CATS = [
  { id: 'S', label: 'S · Fornecedor', hint: 'Supplier' },
  { id: 'I', label: 'I · Entrada', hint: 'Input' },
  { id: 'P', label: 'P · Processo', hint: 'Process' },
  { id: 'O', label: 'O · Saída', hint: 'Output' },
  { id: 'C', label: 'C · Cliente', hint: 'Customer' },
];

const OVERRIDES: Record<Exclude<ThemeId, 'filazero'>, Record<string, Override>> = {
  // ---------------- PROVADOR VIRTUAL ----------------
  provador: {
    mapa_empatia: {
      summary: 'Entenda o cliente na fila do provador: o que ele pensa, sente, fala e faz.',
      parts: [
        {
          id: 'm',
          kind: 'classify',
          layout: 'buckets',
          title: 'O cliente na fila do provador',
          instructions: 'Coloque cada frase no quadrante certo do mapa de empatia.',
          categories: EMPATIA_CATS,
          items: [
            { id: 'jr', text: 'Leva várias peças de uma vez para o provador' },
            { id: 'wq', text: '“Quanto tempo falta para liberar o provador?”' },
            { id: 'bn', text: 'Será que essa roupa vai ficar boa em mim?' },
            { id: 'zy', text: 'Frustrada quando a peça não serve' },
            { id: 'ug', text: 'Desiste da compra e vai embora' },
            { id: 'ci', text: 'Não vale a pena esperar tanto para provar' },
            { id: 'pe', text: 'Cansada de esperar em pé' },
            { id: 'lk', text: '“Tem outro tamanho dessa?”' },
          ],
        },
      ],
    },
    arvore_problemas: {
      summary: 'Separe as causas (raízes) e os efeitos (galhos) do problema “fila grande no provador”.',
      parts: [
        {
          id: 'a',
          kind: 'classify',
          layout: 'buckets',
          title: 'Problema central: fila grande no provador',
          instructions: 'Arraste cada item para as raízes (causa) ou para os galhos (efeito).',
          categories: ARVORE_CATS,
          items: [
            { id: 'qd', text: 'Clientes desistem da compra' },
            { id: 'mv', text: 'Trocar de roupa demora' },
            { id: 'xe', text: 'Peças ficam bagunçadas no provador' },
            { id: 'ko', text: 'A loja tem poucos provadores' },
            { id: 'tz', text: 'A loja perde vendas' },
            { id: 'fy', text: 'Não dá para saber o tamanho certo sem provar' },
            { id: 'ha', text: 'Clientes saem insatisfeitos' },
            { id: 'rc', text: 'Cada cliente leva muitas peças para provar' },
          ],
        },
      ],
    },
    arvore_solucoes: {
      summary: 'Transforme cada causa da fila do provador em um objetivo que a resolve.',
      parts: [
        {
          id: 's',
          kind: 'classify',
          layout: 'match',
          title: 'De causa para objetivo',
          instructions: 'Para cada causa, escolha o objetivo que a resolve.',
          categories: [
            { id: 'v2', label: 'Indicar o tamanho ideal com o scanner 3D' },
            { id: 'v7', label: 'Usar totens que atendem um cliente por minuto' },
            { id: 'v4', label: 'Mostrar a roupa no corpo sem precisar vestir' },
            { id: 'v9', label: 'Permitir testar várias combinações na tela' },
          ],
          items: [
            { id: 'k3', text: 'Cada cliente leva muitas peças para provar' },
            { id: 'k8', text: 'Trocar de roupa demora' },
            { id: 'k1', text: 'A loja tem poucos provadores' },
            { id: 'k6', text: 'Não dá para saber o tamanho certo sem provar' },
          ],
        },
      ],
    },
    fluxograma: {
      summary: 'Monte o fluxograma do uso do Provador Virtual com a ordem e os símbolos certos.',
      parts: [
        {
          id: 'f',
          kind: 'flow',
          title: 'Fluxo do Provador Virtual',
          instructions: 'Arraste as etapas para a ordem certa e escolha o símbolo de cada uma.',
          items: [
            { id: 'g5', text: 'Escolher as peças na tela' },
            { id: 'g2', text: 'Finalizar a compra' },
            { id: 'g8', text: 'Gostou do visual?' },
            { id: 'g3', text: 'Chegar ao totem do provador virtual' },
            { id: 'g9', text: 'Levar as peças ao caixa' },
            { id: 'g6', text: 'Fazer o escaneamento do corpo' },
          ],
        },
      ],
    },
    sipoc: {
      summary: 'Organize o processo do Provador Virtual nas 5 colunas do SIPOC.',
      parts: [
        {
          id: 'x',
          kind: 'classify',
          layout: 'buckets',
          title: 'SIPOC do Provador Virtual',
          instructions: 'Coloque cada item na coluna certa.',
          categories: SIPOC_CATS,
          items: [
            { id: 'yb', text: 'Imagem do cliente com a roupa' },
            { id: 'dw', text: 'Medidas do corpo do cliente' },
            { id: 'oq', text: 'Vendedores da loja' },
            { id: 'ec', text: 'Fabricante do scanner 3D' },
            { id: 'nm', text: 'Escanear o corpo' },
            { id: 'sj', text: 'Sugestão de tamanho ideal' },
            { id: 'ix', text: 'Catálogo digital das peças' },
            { id: 'vh', text: 'Clientes da loja' },
            { id: 'ar', text: 'Montar o visual na tela' },
            { id: 'tu', text: 'Marcas de roupa da loja' },
          ],
        },
      ],
    },
    as_is_to_be: {
      summary: 'Compare como é provar roupa hoje (AS-IS) com o processo usando o provador virtual (TO-BE).',
      parts: [
        {
          id: 'asis',
          kind: 'order',
          title: 'AS-IS · como é hoje',
          instructions: 'Coloque os passos de hoje na ordem certa.',
          items: [
            { id: 'e4', text: 'Vestir e tirar cada peça' },
            { id: 'e9', text: 'Pagar no caixa' },
            { id: 'e1', text: 'Escolher as peças na arara' },
            { id: 'e7', text: 'Decidir o que comprar' },
            { id: 'e2', text: 'Entrar na fila do provador' },
          ],
        },
        {
          id: 'tobe',
          kind: 'order',
          title: 'TO-BE · como fica com o provador virtual',
          instructions: 'Coloque os passos do novo processo na ordem certa.',
          items: [
            { id: 'n8', text: 'Escolher o tamanho indicado' },
            { id: 'n3', text: 'Escanear o corpo no totem' },
            { id: 'n9', text: 'Pagar no caixa' },
            { id: 'n5', text: 'Ver as peças no próprio corpo na tela' },
          ],
        },
        {
          id: 'gargalo',
          kind: 'single',
          title: 'Qual é o gargalo eliminado?',
          instructions: 'Escolha o passo do AS-IS que mais trava o processo e que o provador virtual elimina.',
          options: [
            { id: 'e9', text: 'Pagar no caixa' },
            { id: 'e2', text: 'Entrar na fila do provador' },
            { id: 'e1', text: 'Escolher as peças na arara' },
            { id: 'e7', text: 'Decidir o que comprar' },
          ],
        },
      ],
    },
    storyboard: {
      summary: 'Desenhe em 4 quadros um cliente usando o Provador Virtual, com uma legenda em cada um.',
      draw: { mode: 'storyboard', instructions: 'Desenhe 4 cenas em sequência mostrando um cliente usando o Provador Virtual e escreva uma legenda curta para cada quadro.' },
    },
    logo_tela: {
      summary: 'Desenhe o logo do Provador Virtual e um rascunho da tela do totem.',
      draw: { mode: 'logo', screenLabel: 'TELA DO TOTEM', instructions: 'À esquerda, desenhe o logo do Provador Virtual. À direita, faça o rascunho (protótipo) da tela do totem.' },
    },
  },

  // ---------------- ATENDEJÁ ----------------
  atendimento: {
    mapa_empatia: {
      summary: 'Entenda o cliente que espera atendimento: o que ele pensa, sente, fala e faz.',
      parts: [
        {
          id: 'm',
          kind: 'classify',
          layout: 'buckets',
          title: 'O cliente esperando atendimento',
          instructions: 'Coloque cada frase no quadrante certo do mapa de empatia.',
          categories: EMPATIA_CATS,
          items: [
            { id: 'ow', text: 'Reclama da empresa nas redes sociais' },
            { id: 'gt', text: '“Já expliquei isso três vezes!”' },
            { id: 'ab', text: 'Será que alguém vai ler minha mensagem?' },
            { id: 'pl', text: 'Inseguro sem saber se o problema será resolvido' },
            { id: 'ky', text: 'Liga várias vezes para a central' },
            { id: 'us', text: 'Deveria ter comprado em outra loja' },
            { id: 'rm', text: '“Quero falar com um responsável”' },
            { id: 'cz', text: 'Irritado por esperar horas na linha' },
          ],
        },
      ],
    },
    arvore_problemas: {
      summary: 'Separe as causas (raízes) e os efeitos (galhos) do problema “clientes esperando demais”.',
      parts: [
        {
          id: 'a',
          kind: 'classify',
          layout: 'buckets',
          title: 'Problema central: clientes esperando demais pelo atendimento',
          instructions: 'Arraste cada item para as raízes (causa) ou para os galhos (efeito).',
          categories: ARVORE_CATS,
          items: [
            { id: 'wk', text: 'Muitas reclamações nas redes sociais' },
            { id: 'jd', text: 'Cada atendente pede os mesmos dados de novo' },
            { id: 'pz', text: 'Clientes cancelam as compras' },
            { id: 'bx', text: 'Poucos atendentes para muitas chamadas' },
            { id: 'ql', text: 'Atendentes ficam sobrecarregados' },
            { id: 'yv', text: 'Não existe registro das reclamações anteriores' },
            { id: 'ne', text: 'A empresa perde clientes fiéis' },
            { id: 'ri', text: 'Perguntas simples ocupam os atendentes' },
          ],
        },
      ],
    },
    arvore_solucoes: {
      summary: 'Transforme cada causa da demora no atendimento em um objetivo que a resolve.',
      parts: [
        {
          id: 's',
          kind: 'classify',
          layout: 'match',
          title: 'De causa para objetivo',
          instructions: 'Para cada causa, escolha o objetivo que a resolve.',
          categories: [
            { id: 'w6', label: 'Identificar o cliente uma única vez' },
            { id: 'w1', label: 'Organizar uma fila por prioridade' },
            { id: 'w8', label: 'Responder dúvidas comuns automaticamente no chat' },
            { id: 'w3', label: 'Criar um histórico de cada cliente' },
          ],
          items: [
            { id: 'q4', text: 'Não existe registro das reclamações anteriores' },
            { id: 'q9', text: 'Poucos atendentes para muitas chamadas' },
            { id: 'q2', text: 'Perguntas simples ocupam os atendentes' },
            { id: 'q7', text: 'Cada atendente pede os mesmos dados de novo' },
          ],
        },
      ],
    },
    fluxograma: {
      summary: 'Monte o fluxograma de um atendimento no AtendeJá com a ordem e os símbolos certos.',
      parts: [
        {
          id: 'f',
          kind: 'flow',
          title: 'Fluxo do atendimento no AtendeJá',
          instructions: 'Arraste as etapas para a ordem certa e escolha o símbolo de cada uma.',
          items: [
            { id: 'j3', text: 'Encaminhar para um atendente' },
            { id: 'j8', text: 'Encerrar o atendimento' },
            { id: 'j5', text: 'A dúvida tem resposta automática?' },
            { id: 'j1', text: 'Registrar a solução no histórico' },
            { id: 'j6', text: 'Cliente abre o chat do AtendeJá' },
            { id: 'j9', text: 'Informar o número do pedido' },
          ],
        },
      ],
    },
    sipoc: {
      summary: 'Organize o processo de atendimento do AtendeJá nas 5 colunas do SIPOC.',
      parts: [
        {
          id: 'x',
          kind: 'classify',
          layout: 'buckets',
          title: 'SIPOC do AtendeJá',
          instructions: 'Coloque cada item na coluna certa.',
          categories: SIPOC_CATS,
          items: [
            { id: 'lq', text: 'Registro do atendimento' },
            { id: 'fu', text: 'Mensagem do cliente' },
            { id: 'xk', text: 'Gerência da empresa' },
            { id: 'bm', text: 'Empresa que fornece o sistema de chat' },
            { id: 'zt', text: 'Classificar a reclamação' },
            { id: 'ge', text: 'Problema resolvido' },
            { id: 'oy', text: 'Dados do pedido' },
            { id: 'ic', text: 'Clientes da loja online' },
            { id: 'wa', text: 'Responder o cliente' },
            { id: 'np', text: 'Equipe de logística' },
          ],
        },
      ],
    },
    as_is_to_be: {
      summary: 'Compare como é pedir ajuda hoje (AS-IS) com o processo usando o AtendeJá (TO-BE).',
      parts: [
        {
          id: 'asis',
          kind: 'order',
          title: 'AS-IS · como é hoje',
          instructions: 'Coloque os passos de hoje na ordem certa.',
          items: [
            { id: 'r5', text: 'Explicar o problema ao atendente' },
            { id: 'r9', text: 'Receber a solução' },
            { id: 'r2', text: 'Ligar para a central' },
            { id: 'r7', text: 'Ser transferido para outro setor' },
            { id: 'r4', text: 'Esperar na linha' },
          ],
        },
        {
          id: 'tobe',
          kind: 'order',
          title: 'TO-BE · como fica com o AtendeJá',
          instructions: 'Coloque os passos do novo processo na ordem certa.',
          items: [
            { id: 'u7', text: 'Receber resposta automática ou de um atendente' },
            { id: 'u2', text: 'Abrir o chat do AtendeJá' },
            { id: 'u9', text: 'Avaliar o atendimento' },
            { id: 'u4', text: 'Informar o número do pedido' },
          ],
        },
        {
          id: 'gargalo',
          kind: 'single',
          title: 'Qual é o gargalo eliminado?',
          instructions: 'Escolha o passo do AS-IS que mais trava o processo e que o AtendeJá elimina.',
          options: [
            { id: 'r9', text: 'Receber a solução' },
            { id: 'r4', text: 'Esperar na linha' },
            { id: 'r2', text: 'Ligar para a central' },
            { id: 'r5', text: 'Explicar o problema ao atendente' },
          ],
        },
      ],
    },
    storyboard: {
      summary: 'Desenhe em 4 quadros um cliente resolvendo um problema pelo AtendeJá, com uma legenda em cada um.',
      draw: { mode: 'storyboard', instructions: 'Desenhe 4 cenas em sequência mostrando um cliente resolvendo um problema pelo AtendeJá e escreva uma legenda curta para cada quadro.' },
    },
    logo_tela: {
      summary: 'Desenhe o logo do AtendeJá e um rascunho da tela do chat.',
      draw: { mode: 'logo', screenLabel: 'TELA DO CHAT', instructions: 'À esquerda, desenhe o logo do AtendeJá. À direita, faça o rascunho (protótipo) da tela do chat de atendimento.' },
    },
  },
};

/** As 10 cartas com o conteúdo do tema sorteado */
export function getCards(theme?: string | null): CardDef[] {
  const t = themeOf(theme).id;
  if (t === 'filazero') return CARDS;
  const o = OVERRIDES[t];
  return CARDS.map((c) => ({ ...c, ...(o[c.id] ?? {}) }));
}
export function getCard(theme: string | null | undefined, id: string): CardDef {
  return getCards(theme).find((c) => c.id === id) ?? CARDS.find((c) => c.id === id)!;
}
