# 🍕 Pizzaria — API

Node.js · TypeScript · Express 5 · Prisma · PostgreSQL · JWT · Multer · Socket.IO · Zod

> Decisões de arquitetura e o porquê de cada escolha: [`../docs/DECISOES.md`](../docs/DECISOES.md)

## Como rodar

```bash
cp .env.example .env          # ajuste DATABASE_URL e JWT_SECRET
npm install
npx prisma migrate dev --name init
npm run dev                   # http://localhost:3333
```

## Estrutura

```
src/
├── @types/express/   # req.user_id
├── config/           # env (validado com Zod) e multer
├── controllers/      # camada HTTP fina: lê res.locals.data, chama o service
├── errors/           # AppError (mensagem + status)
├── lib/              # prisma client e socket.io
├── middlewares/      # isAuthenticated, validate, errorHandler
├── schemas/          # schemas Zod de cada rota
├── services/         # regras de negócio (user, category, product, order)
├── routes.ts
└── server.ts
```

## Rotas

Todas exigem `Authorization: Bearer <token>`, exceto `POST /users`, `POST /session` e `GET /health`.

| Método | Rota | Entrada | Descrição |
|---|---|---|---|
| POST | `/users` | body `{ name, email, password }` | Cadastro |
| POST | `/session` | body `{ email, password }` | Login → `{ id, name, email, token }` |
| GET | `/me` | — | Usuário logado |
| POST | `/category` | body `{ name }` | Criar categoria |
| GET | `/category` | — | Listar categorias |
| POST | `/product` | multipart `{ name, price, description, category_id, file }` | Criar produto com imagem |
| GET | `/category/product` | query `?category_id=` | Produtos de uma categoria |
| POST | `/order` | body `{ table, name? }` | Abrir mesa (rascunho) |
| DELETE | `/order` | query `?order_id=` | Apagar mesa (só rascunho) |
| POST | `/order/add` | body `{ order_id, product_id, amount }` | Adicionar item |
| DELETE | `/order/remove` | query `?item_id=` | Remover item |
| PUT | `/order/send` | body `{ order_id }` | Enviar para a cozinha |
| GET | `/orders` | — | Fila da cozinha |
| GET | `/order/detail` | query `?order_id=` | Detalhe + itens + `total` |
| PUT | `/order/finish` | body `{ order_id }` | Concluir pedido |
| GET | `/files/:banner` | — | Imagem do produto |

## Eventos Socket.IO

| Evento | Quando | Payload |
|---|---|---|
| `order:sent` | Garçom envia o pedido | pedido completo |
| `order:finished` | Cozinha conclui | `{ id }` |

## Observação

`price` e `total` são `Decimal` e chegam como **string** no JSON. Converta com `Number()` no cliente.
