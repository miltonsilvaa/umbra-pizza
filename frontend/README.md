# 🍕 Pizzaria — Painel Web (Cozinha & Admin)

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · Socket.IO · Axios

> Decisões de arquitetura e o porquê de cada escolha: [`../docs/DECISOES.md`](../docs/DECISOES.md)

## Como rodar

Com a API (`../backend`) rodando:

```bash
cp .env.example .env.local    # NEXT_PUBLIC_API_URL=http://localhost:3333
npm install
npm run dev                   # http://localhost:3000
```

## Telas

| Rota | Tela |
|---|---|
| `/` | Login |
| `/signup` | Cadastro da equipe |
| `/dashboard` | Fila da cozinha em tempo real (cards + modal de detalhe + concluir) |
| `/dashboard/category` | Cadastro e lista de categorias |
| `/dashboard/product` | Cadastro de produto com upload e preview da imagem |

## Estrutura

```
src/
├── app/                 # rotas (App Router)
│   ├── page.tsx         # login
│   ├── signup/
│   └── dashboard/       # layout com Header + pedidos, categorias, produtos
├── components/
│   ├── ui/              # Button, Input/TextArea, Logo
│   ├── orders/          # OrderCard, OrderModal
│   └── products/        # ImageUpload
├── contexts/            # AuthContext (sessão)
├── hooks/               # useOrdersSocket (tempo real)
├── lib/                 # cookies, formatação, bipe de notificação
├── services/            # api (axios + interceptors)
├── types/
└── proxy.ts             # redireciona conforme o cookie de sessão
```

## Personalização

- **Cores:** bloco `@theme` em `src/app/globals.css`
- **Nome/logo da pizzaria:** `src/components/ui/Logo.tsx`
