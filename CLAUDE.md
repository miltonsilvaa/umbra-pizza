# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visão geral

Ecossistema de pedidos para uma pizzaria, com três apps independentes que compartilham a mesma API:

- **`backend/`** — API Node (Express 5 + Prisma + PostgreSQL), porta `3333`.
- **`frontend/`** — Painel web da cozinha/admin (Next.js 16 App Router), porta `3000`.
- **`mobile/`** — App do garçom (Expo SDK 58 / React Native), via Expo Go.

Não é um monorepo com workspaces: cada pasta tem seu próprio `package.json`, `node_modules` e lockfile — rode os comandos de dentro da pasta correspondente.

Decisões de arquitetura e o porquê de cada escolha estão registradas em `docs/DECISOES.md` — leia antes de alterar modelagem de dados, autenticação, ou fluxo de pedido; é a fonte de verdade sobre *por que* algo foi feito assim, incluindo dívidas técnicas conhecidas e pendências.

Cada subprojeto também tem seu próprio `AGENTS.md` (`frontend/AGENTS.md`, `mobile/AGENTS.md`) com avisos de que o Next 16 e o Expo SDK 58 têm breaking changes em relação ao conhecimento de treinamento — leia a documentação local (`node_modules/next/dist/docs/` ou os links do Expo) antes de usar APIs dessas frameworks.

## Stack Definitiva (NÃO ALTERAR SEM PERMISSÃO)

- **Backend:** Node.js + TypeScript + Express 5 + Prisma 6 (PostgreSQL) + JWT + Socket.IO + Zod.
- **Frontend:** Next.js 16.4 (App Router) + React 19.3 + TypeScript + Tailwind CSS v4.
- **Mobile:** Expo SDK 58 + React Native + TypeScript + Expo Router.

## Regras de Ouro

- Sempre leia `docs/DECISOES.md` antes de propor qualquer mudança estrutural.
- NUNCA instale uma biblioteca nova sem antes perguntar ao usuário e atualizar `docs/DECISOES.md`.
- Se for mexer no mobile, lembre-se que estamos construindo o app do garçom. O foco atual são as telas de mesas e pedidos.
- Mantenha a consistência de estilo e padrões já estabelecidos no código existente.

## Arquitetura do fluxo de pedido (cross-cutting)

Este é o conceito mais importante do sistema, usado pelos três apps:

```
Garçom (mobile) ──HTTP──▶ API ──Socket.IO──▶ Painel Cozinha (frontend)
```

Um pedido (`Order`) tem dois booleanos que definem seu estado — não há enum:

| Etapa | `draft` | `status` | Quem age | Rota |
|---|---|---|---|---|
| Mesa aberta (rascunho) | `true` | `false` | Garçom | `POST /order` |
| Itens sendo adicionados/removidos | `true` | `false` | Garçom | `POST /order/add`, `DELETE /order/remove` |
| Enviado para a cozinha | `false` | `false` | Garçom | `PUT /order/send` |
| Concluído | `false` | `true` | Cozinha | `PUT /order/finish` |

A fila da cozinha (`GET /orders`) é exatamente `draft = false AND status = false`, ordenada por `updated_at` (hora do envio, não da criação da mesa).

Eventos Socket.IO emitidos pela API: `order:sent` (payload: pedido completo) e `order:finished` (payload: `{ id }`). O handshake do socket exige JWT (`io(API_URL, { auth: { token } })`).

**Armadilha recorrente:** `price` (Product) e `total` (Order) são `Decimal` no Prisma e chegam como **string** no JSON (ex: `"45.90"`). Sempre `Number(...)` antes de exibir ou somar no frontend/mobile.

## Comandos

### Backend (`backend/`)
```bash
cp .env.example .env              # DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, PORT, CORS_ORIGIN
npm install
npx prisma migrate dev --name init   # primeira vez / após mudar schema.prisma
npm run dev                       # tsx watch, http://localhost:3333
npm run typecheck                 # tsc --noEmit
npm run build && npm start        # produção
npm run prisma:studio             # inspecionar o banco
```
Não há suíte de testes automatizados configurada (`npm test` não existe).

### Frontend (`frontend/`)
```bash
cp .env.example .env.local        # NEXT_PUBLIC_API_URL=http://localhost:3333
npm install
npm run dev                       # http://localhost:3000 (requer backend rodando)
npm run lint                      # eslint
npm run build
```

### Mobile (`mobile/`)
```bash
npm install
npx expo start                    # QR code; celular e PC na mesma rede Wi-Fi
npx tsc --noEmit
npx expo lint
npx expo-doctor
```
Sem `EXPO_PUBLIC_API_URL` definida, o app descobre o IP do PC automaticamente via `Constants.expoConfig.hostUri` e usa a porta 3333.

## Arquitetura — Backend

Camadas estritas, cada uma com uma responsabilidade:

```
routes.ts → middlewares (isAuthenticated, validate) → controllers → services → prisma
```

- **`schemas/`** — um schema Zod por rota. `middlewares/validate.ts` faz `schema.parse(req[source])` e salva o resultado **já convertido** em `res.locals.data` (ex.: `"3"` → `3` no número da mesa).
- **`controllers/`** — camada HTTP fina: leem `res.locals.data`, instanciam o service e devolvem a resposta. Não contêm regra de negócio.
- **`services/<domínio>/<Ação>Service.ts`** — um service por ação (ex.: `CreateOrderService`, `AddItemService`), classe com método `execute()`. É aqui que vive a regra de negócio.
- **`errors/AppError.ts`** — erros lançados nos services (mensagem + status HTTP) são capturados pelo `errorHandler` central. Como é Express 5, erros em handlers `async` propagam direto para o middleware de erro — não precisa de `try/catch` em cada controller.
- **`lib/socket.ts`** — instância do Socket.IO, usada pelos services de order para emitir `order:sent` / `order:finished`.
- **`config/env.ts`** — valida as variáveis de ambiente com Zod na inicialização; a API recusa subir se faltar `JWT_SECRET` ou `DATABASE_URL`.

Regras de negócio que não são óbvias pelo código:
- Só dá para adicionar/remover itens ou apagar um pedido enquanto `draft = true`.
- Não é possível enviar um pedido vazio (sem itens) para a cozinha.
- Login devolve a mesma mensagem para e-mail inexistente e senha errada (não revela quais e-mails existem).
- Cadastro duplicado de e-mail/categoria → `409`.
- Upload de produto usa Multer com storage local em `backend/tmp`, servido em `GET /files/:banner`; apenas JPG/PNG/WEBP até 5MB, nome de arquivo randomizado. Como o Multer precisa rodar antes da validação Zod (é ele que popula `req.body` em multipart), o `errorHandler` apaga `req.file` sempre que a requisição termina em erro, para não deixar imagem órfã em disco.

## Arquitetura — Frontend (painel web)

- Todas as telas de dashboard são **Client Components** que chamam a API externa direto via axios (`services/api.ts`) — não há fetch no servidor para dados do painel, propositalmente (painel interativo/tempo real; evita a complexidade de `<Suspense>` por cookie que o `cacheComponents` do Next 16 exigiria em Server Components).
- **Autenticação em duas camadas:**
  1. `proxy.ts` (equivalente ao antigo `middleware.ts` no Next 16) faz checagem otimista pelo cookie `pizzaria.token`: sem cookie, bloqueia `/dashboard/*`; com cookie, bloqueia `/` e `/signup`.
  2. `AuthContext` chama `GET /me` ao montar para validar de fato; um 401 em qualquer chamada (via interceptor do axios em `services/api.ts`) apaga o cookie e redireciona para o login.
- Token fica em **cookie** (não `localStorage`) porque é o único lugar que `proxy.ts`, rodando no servidor, consegue ler. Não é `httpOnly` (gravado via JS) — dívida técnica conhecida, ver `docs/DECISOES.md`.
- Paleta de cores declarada em `@theme` dentro de `src/app/globals.css` (Tailwind v4, sem `tailwind.config.js`) — tokens: `background`, `surface`/`surface-hover`, `line`, `brand`, `success`/`warning`, `muted`. Para trocar o tema, editar só ali.
- `useOrdersSocket` (hook) conecta no Socket.IO autenticado e dispara toasts/bipe sonoro em pedido novo; o botão "Atualizar" continua como fallback caso o socket caia.
- Imagens de produto usam `<img>` comum, não `next/image` — o Next 16 bloqueia IPs locais em `next/image` por padrão, e abrir essa configuração seria uma brecha de SSRF.

## Arquitetura — Mobile (app do garçom)

- **Expo Router** por arquivo: cada arquivo em `src/app/` é uma tela; `_layout.tsx` define navegação (`Stack.Protected guard={...}` para rotas logado × não-logado). Componentes, contexts, services e libs ficam fora de `src/app/`.
  ```
  src/app/
  ├── _layout.tsx              # AuthProvider + Stack.Protected + splash
  ├── sign-in.tsx
  └── (app)/
      ├── _layout.tsx
      ├── index.tsx             # abrir mesa
      └── order/[id]/
          ├── index.tsx         # lançar itens
          └── finish.tsx        # resumo + enviar para a cozinha
  ```
- Token no **SecureStore** (Keychain/Keystore), não `AsyncStorage` — dá acesso à API inteira. Na web (só testes), usa `localStorage`.
- Sessão restaurada offline-first: mostra o usuário salvo imediatamente e confirma com `GET /me` em segundo plano; interceptor 401 desloga.
- Sair de uma mesa com itens lançados apaga o rascunho na API (`DELETE /order`) e pede confirmação antes.
- Tela de resumo busca o total da API (não recalcula no cliente) — mesmo valor que a cozinha vê.

## Convenções de nomenclatura e dados

- Prisma: models em PascalCase no código, tabelas mapeadas para snake_case plural via `@@map` (ex.: `Order` → `orders`).
- `Item → Order` tem `onDelete: Cascade`.
- Índices existentes: `products.category_id`, `items.order_id`, `orders(draft, status)` — este último é o filtro da fila da cozinha, consultado constantemente; preservar ao migrar o schema.

## Pendências conhecidas (ver `docs/DECISOES.md` para detalhes)

- Sem banco PostgreSQL acessível no ambiente de desenvolvimento atual — migrations e teste ponta a ponta com dados reais ainda não foram validados.
- Fluxo completo do app mobile (mesa → itens → envio → cozinha) não foi confirmado em dispositivo real; validar digitação logo após o login no Expo Go antes de assumir que está livre de bugs.
- Para produção: trocar o cookie de sessão do frontend para `httpOnly` emitido pela API, mover upload de imagens para Cloudinary (ou similar), e servir a API em HTTPS (obrigatório para builds Android publicados).
