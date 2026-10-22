# Diário de Decisões — Projeto Pizzaria

Registro vivo das **escolhas**, **decisões**, **impedimentos** e **soluções** ao longo da construção do ecossistema (API + Painel Web + App do Garçom). Cada etapa ganha uma seção nova; nada é apagado — se uma decisão mudar, ela é marcada como substituída e a nova entra abaixo.

**Legenda:** 🧭 Decisão · ⚠️ Impedimento · ✅ Solução · 💡 Melhoria em relação ao original

---

## Visão geral da arquitetura

```
┌──────────────────┐        HTTP (REST + JWT)        ┌───────────────────────┐
│  App do Garçom   │ ──────────────────────────────▶ │                       │
│  (Expo / RN)     │   abre mesa, adiciona itens,    │      API (Node)       │
└──────────────────┘   envia pedido                  │ Express 5 + Prisma    │──▶ PostgreSQL
                                                     │                       │
┌──────────────────┐ ◀────── Socket.IO ───────────── │  emite order:sent /   │
│ Painel Cozinha   │   pedido novo / concluído       │        order:finished │
│ (Next.js)        │ ──────────────────────────────▶ │                       │
└──────────────────┘   lista, detalha, conclui       └───────────────────────┘
```

### Ciclo de vida de um pedido

| Etapa | `draft` | `status` | Quem age | Rota |
|---|---|---|---|---|
| Mesa aberta (rascunho) | `true` | `false` | Garçom | `POST /order` |
| Itens sendo adicionados/removidos | `true` | `false` | Garçom | `POST /order/add`, `DELETE /order/remove` |
| Enviado para a cozinha | `false` | `false` | Garçom | `PUT /order/send` |
| Concluído | `false` | `true` | Cozinha | `PUT /order/finish` |

A fila da cozinha (`GET /orders`) mostra exatamente `draft = false AND status = false`.

---

## Etapa 1 — Backend (API) · 2026-10-17

### Ordem de construção
🧭 **Começar pelo backend.** O briefing deixou a escolha em aberto. Painel web e app mobile consomem a mesma API, então ela vem primeiro: o contrato das rotas fica definido antes das telas.

### Stack e versões
🧭 **Express 5** (não 4). O Express 5 encaminha erros lançados em handlers `async` direto para o middleware de erro. Isso dispensa o pacote `express-async-errors` e os `try/catch` em todo controller.

🧭 **Prisma fixado na v6** (`^6.16`). A v7 exige driver adapters e um `prisma.config.ts` separado, uma configuração a mais sem ganho real para este projeto. A v6 é estável e tem o setup clássico (`url = env("DATABASE_URL")` no schema). Dá para migrar depois sem tocar nos services.

🧭 **Zod para validação** (💡 o original não validava entrada). Cada rota declara um schema; o middleware `validate()` converte os tipos (ex: `"3"` → `3` na mesa) e devolve erros por campo:
```json
{ "error": "Dados inválidos", "issues": [{ "field": "email", "message": "E-mail inválido" }] }
```

🧭 **Variáveis de ambiente validadas na inicialização** (`src/config/env.ts`). Se faltar `JWT_SECRET` ou `DATABASE_URL`, a API recusa subir com uma mensagem clara, em vez de quebrar no meio de uma requisição.

🧭 **`tsx`** para desenvolvimento (no lugar de `ts-node-dev`): mais rápido e sem configuração extra.

### Modelagem de dados
🧭 **`price` como `Decimal(10,2)`** (💡 o original usava `String`). Preço como texto impede somar no banco e abre espaço para valores como `"R$ abc"`. O total do pedido é calculado com `Prisma.Decimal`, sem erros de ponto flutuante (`0.1 + 0.2 ≠ 0.3`).
> ⚠️ **Atenção para o front/mobile:** o Prisma serializa `Decimal` como **string** no JSON (`"price": "45.9"`). Converter com `Number(price)` antes de exibir ou somar.

🧭 **Dois booleanos no pedido (`draft` + `status`)**, seguindo o original. Considerei um enum único (`DRAFT | PREPARING | DONE`), mas mantive o formato do briefing para ficar fiel à referência. Se surgirem mais estados (ex: "saiu para entrega"), migrar para enum.

🧭 **`onDelete: Cascade` em `Item → Order`.** Apagar uma mesa em rascunho apaga os itens junto, sem precisar de duas queries.

🧭 **`Category.name` único** e **índices** em `products.category_id`, `items.order_id` e `orders(draft, status)`. Este último é o filtro da fila da cozinha, consultado o tempo todo.

🧭 **Nomes de tabela em snake_case plural** (`@@map("orders")`), enquanto os models seguem PascalCase no código.

### Regras de negócio (💡 o original não protegia esses casos)
- Só é possível **adicionar/remover itens** ou **apagar** um pedido enquanto ele é **rascunho**. Depois de enviado, a cozinha já está preparando.
- **Não é possível enviar um pedido vazio** para a cozinha.
- **Não é possível concluir** um pedido que ainda é rascunho ou que já foi concluído.
- Criar produto verifica se a **categoria existe**; adicionar item verifica se o **produto existe**.
- Login devolve **a mesma mensagem** para e-mail inexistente e senha errada. Assim ninguém consegue descobrir quais e-mails estão cadastrados.
- Cadastro duplicado de e-mail/categoria → **409 Conflict**.

### Tempo real
🧭 **Socket.IO em vez de só o botão "Atualizar"** (💡). O briefing pede "pedidos em tempo real". A API emite:
- `order:sent` → quando o garçom envia (payload: o pedido)
- `order:finished` → quando a cozinha conclui (payload: `{ id }`)

O botão "Atualizar" continua no painel como fallback, caso o socket caia.

### Upload de imagens
🧭 **Multer com armazenamento local** em `backend/tmp`, servido em `GET /files/<banner>`. O banco guarda só o nome do arquivo; a URL completa é montada no cliente (`${API_URL}/files/${banner}`). O briefing citou Cloudinary como opção: fica como evolução para produção, e a troca só afeta `config/multer.ts` + `CreateProductService`.

Proteções: só JPG/PNG/WEBP, até 5MB, nome do arquivo aleatório (evita colisões e path traversal).

⚠️ **Impedimento: imagem órfã.** No `multipart/form-data`, o Multer precisa rodar *antes* da validação, porque é ele que preenche `req.body`. Se a validação falha depois (ex: preço inválido), a imagem já foi salva em disco e fica sem dono.
✅ **Solução:** o `errorHandler` apaga `req.file` sempre que a requisição termina em erro.

### Ambiente e testes
⚠️ **Impedimento: sem acesso ao banco para testar ponta a ponta.** A máquina tem PostgreSQL 18 rodando na porta 5432, mas a senha não é conhecida (e não faz sentido adivinhar). O Docker está instalado, mas o CLI não está no PATH.
✅ **Solução parcial:** typecheck completo (`tsc --noEmit` sem erros) + teste da API rodando com um banco fictício, cobrindo tudo o que não depende do banco:

| Teste | Resultado |
|---|---|
| `GET /health` | `{"ok":true}` |
| Rota protegida sem token | 401 `Token não informado` |
| Token inválido | 401 `Token inválido ou expirado` |
| Cadastro com dados ruins | 400 com erro por campo (nome, e-mail, senha) |
| Token válido + `order_id` não-UUID | 400 `Pedido inválido` |
| Handshake Socket.IO | OK |

🔜 **Pendente:** com a senha do Postgres, rodar `prisma migrate dev` e testar o fluxo completo (cadastro → login → categoria → produto → mesa → itens → envio → conclusão).

---

## Etapa 2 — Painel Web (Cozinha & Admin) · 2026-10-17

### Stack e versões
🧭 **Next.js 16.4 (App Router) + React 19.3 + Tailwind CSS v4**, gerado com `create-next-app`. Dependências extras: `axios` (API), `socket.io-client` (tempo real), `lucide-react` (ícones), `sonner` (toasts).

⚠️ **Impedimento: o Next 16 mudou APIs em relação às versões mais conhecidas.** O projeto já vem com `cacheComponents` ligado, o antigo `middleware.ts` virou `proxy.ts`, e o `AGENTS.md` gerado avisa que o conhecimento prévio pode estar desatualizado.
✅ **Solução:** antes de escrever código, li a documentação que vem dentro do pacote (`node_modules/next/dist/docs/`) sobre proxy, cookies, autenticação com Cache Components e imagens.

🧭 **Tailwind v4 sem `tailwind.config.js`.** A paleta foi declarada direto no CSS (`@theme` em `globals.css`), o que gera classes como `bg-surface`, `text-brand`, `border-line`, `text-success`, `text-warning`. Para trocar uma cor, basta editar um lugar.

| Token | Cor | Uso |
|---|---|---|
| `background` | `#121214` | fundo da página |
| `surface` / `surface-hover` | `#1D1D2E` / `#26263A` | cards, inputs, modal |
| `line` | `#2C2C42` | bordas (adicionada para separar superfícies) |
| `brand` | `#FF3F4B` | botões principais, foco, destaques |
| `success` / `warning` | `#3FFFA3` / `#FBA92C` | status e tempo de espera |
| `muted` | `#8A8A8A` | texto secundário |

🧭 **Fonte Inter via `next/font`**: auto-hospedada no build, sem requisição ao Google em tempo de execução.

### Arquitetura
🧭 **Telas do painel como Client Components** que buscam dados direto da API externa com axios. É um painel interativo e em tempo real: socket, modal, formulários com upload. Renderizar no servidor não traria ganho e, com `cacheComponents`, obrigaria a envolver toda leitura de cookie em `<Suspense>`.

🧭 **Autenticação em duas camadas:**
1. **`proxy.ts` (checagem otimista):** sem o cookie `pizzaria.token`, quem tenta abrir `/dashboard/*` vai para o login; com o cookie, quem abre `/` ou `/signup` vai para o dashboard. A documentação do Next recomenda o proxy só para esse tipo de checagem rápida.
2. **API (checagem real):** o `AuthContext` chama `GET /me` ao carregar. Qualquer 401 da API faz o interceptor do axios apagar o cookie e voltar para o login.

🧭 **Token em cookie (não em `localStorage`).** É o único lugar que o `proxy.ts`, que roda no servidor, consegue ler. Cookie com `SameSite=Lax` e validade de 30 dias, igual ao JWT.
> ⚠️ O cookie é gravado pelo JavaScript, então não é `httpOnly`. Para produção, a evolução é a API devolver o token em um cookie `httpOnly`. Fica anotado como dívida técnica.

🧭 **Context API para a sessão** (o briefing permitia Context ou Zustand). O único estado global é o usuário logado; um Context resolve sem dependência extra.

### Tela da cozinha
- **Tempo real via Socket.IO:** um pedido novo toca um bipe, mostra um aviso e recarrega a fila. Pedido concluído (por esta ou por outra tela) sai na hora. Um indicador "Ao vivo / Desconectado" mostra o estado da conexão; o botão **Atualizar** continua como reserva.
- 💡 **Cor por tempo de espera:** a barra lateral do card fica verde até 10 min, amarela até 20 e vermelha depois, para a cozinha ver de longe o que está atrasado. O contador "há X min" se atualiza a cada 30 s.
- 💡 **Bipe gerado pelo navegador** (Web Audio API), sem arquivo de som.
- **Modal com `<dialog>` nativo:** o navegador já cuida do foco, da tecla Esc e do bloqueio do fundo. Clicar fora também fecha. Mostra quantidade, produto, descrição, subtotal por item e total da mesa.
- **Estados de tela:** esqueleto enquanto carrega e um estado vazio ilustrado ("Nenhum pedido na fila").

### Categorias e produtos
- Categorias: formulário e, abaixo, a lista do que já existe em forma de etiquetas (💡 o original não mostrava as categorias já cadastradas).
- Produtos: upload com preview (validação de formato e de 5MB **antes** de enviar, os mesmos limites da API), dropdown de categorias, preço aceitando vírgula (`45,90`).
- 💡 Se não houver nenhuma categoria, a tela de produto mostra um aviso com link para criar uma, em vez de um dropdown vazio.

### Correções e ajustes na API feitos nesta etapa
⚠️ **Impedimento (falha minha da Etapa 1): o Socket.IO aceitava qualquer conexão.** Quem soubesse o endereço da API conseguia ouvir todos os pedidos.
✅ **Solução:** o socket agora exige o JWT no handshake (`io(API_URL, { auth: { token } })`) e recusa conexões sem token válido.

⚠️ **A fila da cozinha estava ordenada por `created_at`** (hora em que a mesa foi aberta). Uma mesa aberta cedo, mas enviada tarde, furava a fila.
✅ **Solução:** a ordem passou a ser por `updated_at`, que, para pedidos na fila, é exatamente a hora do envio.

### Impedimentos de build e lint
⚠️ **`Date.now()` no estado inicial quebrou o build.** O Next 16 recusa valores que mudam a cada execução durante a pré-renderização (`blocking-prerender-current-time-client`).
✅ **Solução:** o "relógio" dos cards começa em `0` e recebe `Date.now()` junto com o carregamento dos pedidos. Os cards só aparecem depois disso, então ninguém vê o valor zero.

⚠️ **Regra nova do React 19 (`react-hooks/set-state-in-effect`)** acusou `setState` direto dentro de `useEffect` em três lugares.
✅ **Soluções, sem silenciar a regra:**
- Preview de imagem: virou um valor derivado (`useMemo`), com limpeza da URL em um effect separado.
- Modal: é montado só quando existe um pedido selecionado, com `key={orderId}`, então o estado reinicia sozinho.
- Carregamento da fila: o `setState` acontece só no callback da promise.

⚠️ **`LayoutProps<"/dashboard">` dava erro no `tsc`.** Os tipos de rota do Next só existem depois de gerados.
✅ **Solução:** rodar `npx next typegen` (o `next build` e o `next dev` já fazem isso sozinhos).

⚠️ **Imagens vindas de `localhost`:** o `next/image` do Next 16 bloqueia por padrão IPs locais (`dangerouslyAllowLocalIP`).
✅ **Solução:** `<img>` comum para as fotos dos produtos (o preview é um `blob:`, onde o `next/image` nem se aplica). Isso evita abrir uma brecha de SSRF na configuração.

### Testes visuais
⚠️ **Impedimento:** sem banco de dados (Etapa 1) não há dados reais, e o Chrome conectado via extensão não conseguia acessar os servidores locais da máquina (página de erro em `localhost` e em `127.0.0.1`).
✅ **Solução:**
1. Uma API falsa temporária, fora do projeto, com pedidos de exemplo e um "pedido novo" disparado pelo socket depois de 8 s.
2. O Chrome local controlado em modo headless (`puppeteer-core`, instalado só na pasta temporária), capturando todas as telas em desktop (1366px) e celular (390px).

Resultado do fluxo automatizado: 4 pedidos carregados → 1 chegou por socket (5) → modal aberto → "Concluir pedido" → 4 cards, modal fechado, **nenhum erro no console**.

Problemas visuais encontrados e corrigidos:
| Problema | Correção |
|---|---|
| Aviso de "Novo pedido" no topo direito cobria "Produtos" e o botão Sair | Avisos movidos para o canto inferior direito |
| No celular (390px), o ícone de Sair ficava cortado na borda | Espaçamentos menores no mobile e divisória escondida |

Também verificado com `curl`: o `proxy.ts` redireciona corretamente nos 6 casos (com e sem cookie, em `/`, `/signup` e `/dashboard/*`).

### Observação
O `create-next-app` criou um repositório git **dentro** de `frontend/`. Se o projeto inteiro virar um repositório só, é preciso apagar `frontend/.git` antes, senão o git trata a pasta como um repositório embutido.

---

## Etapa 3 — App do Garçom (Expo) · 2026-10-17

### Stack e versões
🧭 **Expo SDK 58 + React Native 0.88 + React 19.3 + TypeScript**, gerado com `create-expo-app` (template padrão), com React Compiler e rotas tipadas ligados. Extras: `expo-secure-store`, `@expo/vector-icons`, `axios`.

⚠️ **Impedimento: o Expo muda APIs a cada SDK**, e o template traz um `AGENTS.md` avisando para não confiar em conhecimento prévio.
✅ **Solução:** consultei a documentação oficial da v58 antes de escrever o código (rotas protegidas, autenticação, SecureStore, teclado). Pontos que mudaram o código:
- Rotas protegidas agora usam `Stack.Protected guard={...}`, sem redirecionamento manual.
- `@expo/vector-icons` **não vem mais** no template: foi instalado com `npx expo install`.
- `SecureStore` funciona no Expo Go, mas **não funciona na web**.
- `react-native-keyboard-controller` não vem no Expo Go, então usei o `KeyboardAvoidingView` padrão.

### Arquitetura
🧭 **Expo Router (rotas por arquivo)** em vez de React Navigation configurado à mão. É o padrão atual do Expo. O briefing pedia `/mobile/src/pages`; aqui as "páginas" ficam em `src/app/` (cada arquivo é uma tela) e o restante segue o pedido: `components/`, `contexts/`, `services/`, `lib/`.

```
src/app/
├── _layout.tsx              # AuthProvider + Stack.Protected (logado × não logado) + splash
├── sign-in.tsx              # login
└── (app)/
    ├── _layout.tsx          # cabeçalho escuro
    ├── index.tsx            # abrir mesa
    └── order/[id]/
        ├── index.tsx        # lançar itens
        └── finish.tsx       # resumo + enviar para a cozinha
```

🧭 **Token no `SecureStore`** (Keychain no iPhone, Keystore no Android), e não no `AsyncStorage` como no original: o token dá acesso à API inteira. Na web (só para testes), o app usa `localStorage`.

🧭 **Sessão restaurada sem esperar a rede:** ao abrir, o app mostra o usuário salvo na hora e confirma o token com `GET /me` em segundo plano. Se o token expirou, o interceptor 401 desloga. A splash fica visível só enquanto a sessão salva é lida, então a tela de login não pisca.

🧭 **Endereço da API automático (💡):** no celular, `localhost` é o próprio celular. Sem `EXPO_PUBLIC_API_URL`, o app pega o IP do computador que está servindo o Expo (`Constants.expoConfig.hostUri`) e usa a porta 3333. Com o celular e o PC na mesma Wi-Fi, funciona sem configurar nada. Se a API não responder, a mensagem de erro mostra o endereço tentado e pergunta se os dois estão na mesma rede.

### Fluxo e regras (💡 melhorias em relação ao original)
- **Mesa sem rascunho órfão:** sair de uma mesa (pelo "X" do cabeçalho ou pelo botão voltar do Android) **apaga o rascunho na API**. Se já houver itens, uma confirmação pergunta antes ("Descartar mesa 12? Os 3 itens lançados serão apagados."). O gesto de arrastar para voltar ficou desligado nessa tela, para ninguém perder a mesa sem querer.
- **Seleção rápida:** ao abrir a mesa, a primeira categoria e o primeiro produto já vêm selecionados. Trocar a categoria recarrega os produtos e seleciona o primeiro.
- A lista de produtos mostra o **preço ao lado**, e uma prévia mostra o valor da linha ("2x Pizza Calabresa = R$ 91,80") antes de adicionar.
- **Resumo com total do servidor:** a tela de resumo busca o pedido na API, em vez de reaproveitar os dados da tela anterior. O total é o calculado pelo backend, o mesmo que a cozinha vê.
- **Após enviar:** volta para "Abrir mesa" limpando o histórico (`router.dismissTo`) e mostra um aviso verde: "Pedido da mesa 12 enviado para a cozinha!".
- **Pensado para uso em pé, com pressa:** botões com no mínimo 52 px de altura, campo da mesa grande e centralizado, teclado numérico, seletores abrindo de baixo (bottom sheet), em vez de dropdowns pequenos.
- Confirmações e seletores são modais próprios no tema escuro, porque o `Alert` nativo não segue o tema e não funciona na web.

### Verificações
| Verificação | Resultado |
|---|---|
| `tsc --noEmit` (com rotas tipadas geradas) | ✅ sem erros |
| `eslint` (config do Expo) | ✅ sem erros nem avisos (corrigido 1 aviso de import do axios) |
| `expo-doctor` | ✅ 20/20 verificações |
| Visual: login e "abrir mesa" (web, 390px) | ✅ conferido por captura de tela |
| Fluxo completo automatizado (mesa → itens → resumo → envio → cozinha) | ⚠️ **não concluído**, ver abaixo |

### Impedimentos no teste do fluxo
⚠️ **Disco C: 100% cheio (0 bytes livres).** O projeto está no D:, mas várias ferramentas gravam no C: (cache do Metro, logs do npm, DevTools do React Native, saída de comandos em segundo plano). Sintomas: o Metro caiu com código 7, `npm`/`npx` falharam com `ENOSPC`, e capturas de tela não puderam ser salvas.
✅ **Contornos:** temporários, cache do npm e logs redirecionados para uma pasta no D:, e ferramentas chamadas direto pelo `node`, sem `npx`. Isso permitiu fazer o typecheck, o lint e as primeiras capturas. A pasta foi apagada no final.
🔜 **Não resolvível daqui:** liberar espaço no C: depende do usuário.

⚠️ **Digitação simulada parava de funcionar depois do login (só no teste).** No teste automatizado (Chrome headless), as teclas simuladas deixavam de chegar à página depois da navegação do login para a área logada. Os campos ficavam vazios e o botão "Abrir mesa" desabilitado.
🔎 **Investigação:**
1. A tela **não** é remontada: o mesmo elemento continua no DOM.
2. Nenhum ancestral está `inert` ou com `aria-hidden`, e o campo recebe o foco.
3. Disparando o evento `input` manualmente, o `onChangeText` funciona e a tela atualiza: o React está saudável.
4. As teclas simuladas (`keydown`) **não chegam ao documento**, nem na fase de captura, apesar de `document.hasFocus() === true`.
5. Inserindo texto pelo `insertText` do Chrome, funciona normalmente.

✅ **Conclusão:** é uma particularidade da simulação de teclado do Chrome headless, e não um bug do app. Abrir o app já logado (sessão restaurada) e digitar funciona normalmente. O roteiro de teste passou a usar `insertText`. Mesmo assim, a rodada final do fluxo ainda falhou na mesma etapa (não chegou ao `POST /order`), já com o disco C: derrubando as ferramentas. Por isso **o fluxo completo não foi confirmado**.

> 🔎 Para confirmar no celular de verdade (o alvo real do app): abrir no Expo Go, fazer login e tentar digitar o número da mesa logo em seguida. Se o problema aparecer no celular, é bug do app e volta para investigação.

### Observações
- O `create-expo-app` criou um repositório git **dentro** de `mobile/`, como o Next fez em `frontend/`. Mesma recomendação: apagar `mobile/.git` se o projeto inteiro virar um repositório único.
- O template veio com `mobile/.claude/settings.json`, que ativa o plugin oficial do Expo para o Claude Code. Foi mantido.
- Para produção (build de loja), a API precisa estar em **HTTPS**: o Android bloqueia HTTP comum em apps publicados. No Expo Go, durante o desenvolvimento, HTTP funciona.

---

## Etapa 4 — Hardening de segurança (backend) · 2026-10-22

🧭 **Helmet adicionado ao backend** (💡 o original não tinha). Registra headers de segurança padrão (`X-Content-Type-Options`, `X-Frame-Options`, remoção do `X-Powered-By`, `Referrer-Policy`, CSP básico, etc.) em todas as respostas da API, logo após o `cors()` em `server.ts`.

⚠️ **Impedimento: o Helmet quebraria o carregamento das imagens de produto.** Por padrão (Helmet 8), toda resposta recebe `Cross-Origin-Resource-Policy: same-origin` — e o painel web (`localhost:3000`) carrega as fotos de `GET /files/:banner` de uma origem diferente da API (`localhost:3333`) via `<img>`.
✅ **Solução:** `Cross-Origin-Resource-Policy: cross-origin` é liberado manualmente só na rota `/files`, antes do `express.static`. O restante da API mantém a política padrão (mais restritiva), já que suas rotas JSON são consumidas via fetch/axios com CORS, não via tags HTML cross-origin.

## Próximas etapas
- [ ] Liberar espaço no disco C: (bloqueando ferramentas de desenvolvimento)
- [ ] Rodar migrations e testar a API ponta a ponta com o banco real
- [x] Etapa 2 — Painel Web (Next.js App Router + Tailwind + Socket.IO client)
- [x] Etapa 3 — App do Garçom (Expo + TypeScript): código pronto, typecheck/lint OK
- [ ] Etapa 3 — testar no celular com Expo Go: fluxo completo + digitação logo após o login
- [ ] Produção: token em cookie `httpOnly` emitido pela API; imagens no Cloudinary; API em HTTPS
