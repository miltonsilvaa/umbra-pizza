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
   4 categorias, ~10 produtos e três mesas no "Caixa" — uma **aberta** (mesa 52, ainda sendo
   montada), uma **em preparo** (mesa 50, na fila da cozinha) e outra **aguardando pagamento**
   (mesa 51, pronta para fechar a conta).
3. Na tela **"Caixa"**, clique em **"Adicionar itens"** na mesa 52 (é o único botão que aparece
   em mesas ainda abertas — depois de enviada para a cozinha, o pedido não pode mais ser alterado).
4. **Lance um item**: escolha categoria, produto e quantidade, e clique em "Adicionar".
5. Clique em **"Enviar para a cozinha"** — a mesa sai do "Caixa" como rascunho e entra na fila.
6. **Veja chegar na cozinha**: a tela "Pedidos" recebe o pedido em tempo real (Socket.IO), com
   bipe e aviso, sem precisar atualizar a página.
7. **Conclua na cozinha**: abra o pedido e clique em "Concluir pedido" — ele sai da fila e volta
   a aparecer no "Caixa", agora como "Aguardando pagamento".
8. **Feche a conta** na tela "Caixa" para simular o pagamento.

> O app do garçom (`mobile/`) tem a mesma tela de lançar itens e também pode abrir mesas novas,
> mas não é necessário para este roteiro — tudo acima funciona só com o painel web.

### Repopulando os dados de demonstração

O script de seed é idempotente: pode ser rodado de novo a qualquer momento para resetar as
mesas de demonstração (50 e 51) ao estado inicial, sem duplicar categorias, produtos ou o usuário
demo.

```bash
cd backend
npx prisma db seed
```
