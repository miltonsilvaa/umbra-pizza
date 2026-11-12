# 🍕 UmbraPizza

Ecossistema de pedidos para uma pizzaria: API (Node/Express/Prisma), painel web da cozinha/admin
(Next.js) e app do garçom (Expo/React Native). Detalhes de arquitetura e decisões técnicas em
[`docs/DECISOES.md`](docs/DECISOES.md); instruções de setup de cada parte em `backend/README.md`,
`frontend/README.md` e `mobile/README.md`.

## Testando o projeto (ambiente de demonstração)

O sistema já vem com uma conta e dados de exemplo prontos — não é preciso cadastrar nada para
avaliar o fluxo completo.

**Credenciais da conta demo:**
- E-mail: `demo@umbrapizza.com`
- Senha: `demo123`

Na tela de login, o botão **"Entrar com Conta de Demonstração"** preenche e envia essas
credenciais automaticamente.

### Roteiro sugerido

1. **Logue com a conta demo** (botão de demonstração ou as credenciais acima).
2. O painel abre com um banner de aviso de ambiente de demonstração e já traz dados de exemplo:
   4 categorias, ~10 produtos e duas mesas abertas — uma **em preparo** (mesa 50, na fila da
   cozinha) e outra **aguardando pagamento** (mesa 51, pronta para o caixa).
3. **Abra uma mesa nova**: use o app do garçom (`mobile/`) para abrir uma mesa e lançar itens, ou
   crie um pedido direto pela API (`POST /order`) se só o painel web estiver disponível.
4. **Lance um item** na mesa aberta.
5. **Veja chegar na cozinha**: a tela "Pedidos" do painel web recebe o pedido em tempo real
   (Socket.IO) assim que ele é enviado pelo garçom.
6. **Conclua na cozinha**: marque o pedido como concluído — ele sai da fila e aparece no "Caixa",
   junto com a mesa 51 que já veio pronta no seed.
7. **Feche a mesa** na tela "Caixa" para simular o pagamento.

### Repopulando os dados de demonstração

O script de seed é idempotente: pode ser rodado de novo a qualquer momento para resetar as
mesas de demonstração (50 e 51) ao estado inicial, sem duplicar categorias, produtos ou o usuário
demo.

```bash
cd backend
npx prisma db seed
```
