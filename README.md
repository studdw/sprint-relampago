# ⚡ Sprint Relâmpago

Jogo web multiusuário para praticar **Scrum e metodologias ágeis** em sala de aula. Cada equipe vira o Time Scrum de uma startup, recebe um tema surpresa e tem **5 minutos de Sprint** para resolver o problema, com uma carta por pessoa.

🔗 **Jogue:** https://sprint-relampago.vercel.app/

> Projeto do curso Técnico em Administração (SENAI). O desafio era criar um jogo para praticar metodologias ágeis. A primeira versão era em papel; este repositório é a versão digital.

<!-- Adicione os prints em docs/img/ e ajuste os nomes abaixo -->
<!-- ![Entrada na sala](docs/img/entrada.png) -->
<!-- ![Painel da Empresa](docs/img/painel.png) -->

## Como funciona

Uma partida dura de 18 a 20 minutos e segue sete passos:

| # | Passo | O que acontece |
|---|-------|----------------|
| 1 | **Entrar na sala** | A Empresa (facilitador) abre a sala e projeta o código no telão. Cada aluno entra pelo navegador com o código e o próprio nome. |
| 2 | **Instruções** | A roleta sorteia o tema da rodada. Uma carta mostra o problema, a missão da equipe e como o jogo funciona. |
| 3 | **Escolher o papel** | Cada equipe define o Product Owner (PO) e o Scrum Master; os demais são Developers. |
| 4 | **PO distribui as cartas** | O PO entrega uma carta do Product Backlog para cada pessoa, inclusive para ele, e define a Meta da Sprint. |
| 5 | **Sprint (5 min)** | Cada um resolve a sua carta. Aos 2:00 ocorre a mudança de requisito; aos 3:00, a Daily. |
| 6 | **Review (3 min)** | As cartas interativas são corrigidas automaticamente e a própria equipe dá as notas dos desenhos. Depois, a Retrospectiva. |
| 7 | **Resultado** | O placar aparece no telão e a equipe vencedora é anunciada. |

## Papéis

- **Product Owner:** líder da equipe. Distribui as cartas, define a Meta da Sprint e é o único que envia a pergunta anônima.
- **Scrum Master:** acompanha o quadro da equipe, garante a Daily e a Retrospectiva e ajuda quem travar.
- **Developers:** cada um resolve a carta que recebeu, no próprio celular ou computador.
- **Empresa:** facilitador do jogo. Abre a sala, controla o tempo e responde às perguntas pelo painel.

## Temas da rodada

- **FilaZero:** acabar com a fila da cantina da escola
- **Provador Virtual:** acabar com a fila dos provadores da loja
- **AtendeJá:** resolver reclamações de atendimento

Cada tema tem cartas e gabarito próprios.

## Product Backlog (10 cartas)

Cada carta aplica uma ferramenta vista no semestre:

| Carta | Tipo |
|-------|------|
| Mapa de Empatia | Interativa |
| Árvore de Problemas | Interativa |
| Árvore de Soluções | Interativa |
| Fluxograma | Interativa |
| SIPOC | Interativa |
| AS-IS / TO-BE | Interativa |
| Scrum & Ágil | Interativa |
| Conflitos & Tempo | Interativa |
| Storyboard | Desenho |
| Logo & Tela | Desenho |

As 8 cartas interativas (arrastar, ligar e ordenar) têm correção automática. As 2 de desenho são avaliadas na Review. Cada carta vale de 0 a 5.

## Durante a Sprint

- Cronômetro igual em todas as telas
- **2:00 · Mudança de Requisito:** uma carta passa a valer o dobro
- **3:00 · Daily:** cada um marca feito, fazendo ou impedimento
- **Pergunta anônima:** uma por equipe, com resposta para todos

## Pontuação

| Critério | Pontos |
|----------|--------|
| Média das notas das cartas × 10 | 0 a 50 |
| Meta da Sprint cumprida | +5 |
| Todos fizeram a Daily | +2 |
| Todos fizeram a Retrospectiva | +2 |
| Carta da Mudança de Requisito | peso 2 |

A pontuação usa a **média** das notas, para que equipes de 5 e de 6 pessoas concorram em igualdade. Em caso de empate, vence quem tem mais notas 5 e, depois, quem cumpriu a Meta.

## Regras

1. Cada membro recebe exatamente uma carta, inclusive o PO.
2. Só o PO envia a pergunta anônima, uma vez.
3. Acabou o tempo, a tela trava e tudo é entregue.
4. Sem consultar os slides durante a Sprint.
5. Ninguém sai do lugar: o jogo é todo na tela.
6. Desenhos ou textos ofensivos zeram a carta.

## Conceitos do semestre praticados

| Conceito | No jogo |
|----------|---------|
| Scrum: papéis | Product Owner, Scrum Master, Developers e a Empresa como cliente |
| Scrum: eventos e artefatos | Planning, Sprint, Daily, Review, Retrospectiva, Backlog e Meta da Sprint |
| Pilares do Scrum | Transparência (placar), Inspeção (Review), Adaptação (mudança de requisito) |
| Mapeamento de processos | Fluxograma, SIPOC, AS-IS e TO-BE |
| Design Thinking | Mapa de Empatia, árvores de problemas e soluções, storyboard e protótipo |
| Conflitos e tempo | Carta de conflitos e time-box de cada evento |

## Parte técnica

- **Hospedagem:** [Vercel](https://vercel.com/), com o site acessível direto no navegador, sem instalar nada
- **Banco de dados e tempo real:** [Supabase](https://supabase.com/), para que todas as telas se atualizem na hora
- **Segurança:** o gabarito fica protegido no servidor e a pergunta é anônima de verdade
- **Cronômetro:** calculado pelo horário do servidor, então todos veem o mesmo tempo
- **Custo:** R$ 0, usando os planos gratuitos
- **Plano B:** se a internet da escola cair, há uma versão em papel do jogo com as mesmas regras

## Como jogar

1. A Empresa abre o site, entra em **Sou da Empresa** e cria a sala.
2. Projete o telão e peça para todos abrirem https://sprint-relampago.vercel.app/ no celular ou computador.
3. Cada aluno digita o código da sala (ex.: `FZ-1234`) e o próprio nome.
4. Siga o roteiro do painel: Planning, Sprint de 5 minutos, Review e resultado.

Equipes de 5 a 6 pessoas, 1 Sprint, 5 minutos.

## Equipe

Gabriel, João Victor, Lucas K. e Luis Henrique, do curso Técnico em Administração (SENAI).
