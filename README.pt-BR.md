# Atalho

Encurtador de links com estatística de clique. Você cola um endereço longo, ganha um curto (slug
sorteado ou um apelido que você escolhe), compartilha ou imprime o QR code e vê quem abriu: cliques
e visitantes únicos por dia, de onde vieram, qual dispositivo, navegador e idioma. Nenhum IP é gravado.

## Tecnologias

- **Backend:** Node.js 22, TypeScript, Fastify 5, Prisma 6, PostgreSQL, Zod 4, `qrcode`
- **Frontend:** React 19, Vite, Tailwind CSS 4, TanStack Query, Recharts
- **Testes:** Vitest nos dois lados (a API contra um PostgreSQL de verdade, a interface com Testing Library)

## Como rodar

Precisa de Node.js 22.12+ e PostgreSQL rodando em `localhost:5432`.

```bash
cd backend
npm install
npm run dev        # http://localhost:3337, documentação em /docs
```

```bash
cd frontend
npm install
npm run dev        # http://localhost:5177
```

O `npm run dev` do backend cria o `.env` a partir do `.env.example` (com JWT secret e sal de visitante
aleatórios), cria o banco, aplica as migrations e carrega uma conta de demonstração. O frontend repassa
`/api` pro backend, então não tem mais nada pra configurar. Se o seu usuário do Postgres não for
`postgres/postgres`, ajuste o `DATABASE_URL` em `backend/.env`.

**Conta de demonstração:** `demo@atalho.dev` / `atalho123`, com seis links (um desativado, um vencido)
e 60 dias de cliques. Os links curtos respondem na porta do backend: abra
`http://localhost:3337/github` pra seguir um.

## O que faz

- **Links curtos** com slug de 7 caracteres sorteado (sem letras que se confundem, tipo `0`/`O` e
  `1`/`l`) ou apelido escolhido. Só aceita destino `http` e `https`, o link não pode apontar pro próprio
  encurtador, e os nomes que o app usa (`api`, `docs`...) são reservados.
- **Redirect** em `GET /:slug` com `302`. Link que não existe responde `404`, e desativado ou vencido
  responde `410`, numa página HTML pro navegador e em JSON pro resto.
- **Estatísticas por link** dos últimos 7, 30 ou 90 dias: cliques e visitantes únicos por dia, a
  variação em relação ao período anterior do mesmo tamanho e rankings de origem, dispositivo,
  navegador e idioma.
- **QR code** em SVG ou PNG. Ele guarda o endereço curto, então a leitura conta clique e dá pra trocar
  o destino sem reimprimir nada.
- **Painel** pra criar, buscar, filtrar (ativos, desativados, vencidos), editar, desativar e apagar
  links. Os filtros e o período das estatísticas ficam na URL.
- **Documentação da API** gerada dos mesmos schemas Zod que validam as rotas, em `/docs`.

## Decisões de projeto

- **Nenhum IP é gravado.** Cada clique guarda um hash de um sal secreto, do dia, do IP e do navegador.
  O mesmo visitante tem o mesmo hash no mesmo dia, o que basta pra contar visitante único, e um hash
  diferente no dia seguinte. A consequência: quem volta em dois dias diferentes conta nos dois.
- **Robô não infla os números.** Preview de link (WhatsApp, Telegram, Slack...) e crawler são
  reconhecidos pelo user agent, gravados como `BOT` e ficam fora de todo total, menos o de "robôs filtrados".
- **O dia segue o horário de São Paulo, não UTC.** Um clique às 23h30 é daquele dia. Os limites do
  período são calculados no PostgreSQL com `AT TIME ZONE` e comparados direto com `clicked_at`, então o
  índice `(link_id, clicked_at)` é usado, e dia sem clique volta com zero.
- **O redirect não espera o banco.** O clique é gravado depois que o `302` sai, e a resposta é
  `no-store` pra toda visita chegar na API. Se o processo cair no meio da gravação, aquele clique se
  perde; quem clicou nunca fica esperando. Requisição `HEAD` (verificador de link) não conta.
- **O slug nunca muda.** O link curto já pode estar impresso ou compartilhado, então a edição mexe só
  no destino, título, validade e no liga/desliga.
- **Quem garante que o slug é único é o banco.** O slug sorteado é inserido e sorteado de novo se o
  índice único barrar, em vez de conferir antes, o que também funciona com dois pedidos ao mesmo tempo.
- **Dados de demonstração determinísticos.** O seed usa um gerador de números com semente, então a
  demo mostra os mesmos números em qualquer máquina, e ele nunca mexe num link que já tem clique.
- **Os gráficos usam uma paleta validada pra daltonismo**, legenda sempre que tem duas séries e uma
  versão em tabela pra leitor de tela. O status (ativo, desativado, vencido) sempre vem com ícone e palavra.
- Toda consulta é limitada ao usuário logado; o link de outra pessoa responde 404. Login, cadastro e
  criação de link têm rate limit próprio, e todo erro volta como `{ error, message }`.

## Testes

```bash
cd backend && npm test     # 41 testes: autenticação, links, redirect, estatísticas, QR code, seed, documentação, utilitários
cd frontend && npm test    # 19 testes: login e cadastro, página de links, estatísticas do link, formatação
```
