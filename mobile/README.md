# 🍕 Pizzaria — App do Garçom

Expo SDK 58 · React Native · TypeScript · Expo Router · SecureStore

> Decisões de arquitetura e o porquê de cada escolha: [`../docs/DECISOES.md`](../docs/DECISOES.md)

## Como rodar no seu celular

1. Instale o app **Expo Go** no celular (Play Store / App Store).
2. Deixe a API (`../backend`) rodando no computador.
3. Celular e computador **na mesma rede Wi-Fi**.
4. No computador:
   ```bash
   npm install
   npx expo start
   ```
5. Leia o QR code com a câmera (iPhone) ou com o Expo Go (Android).

O app descobre sozinho o IP do computador e usa a porta 3333. Se a API estiver em outro endereço, copie `.env.example` para `.env` e defina `EXPO_PUBLIC_API_URL`.

> **Windows:** se o celular não conectar, libere as portas 8081 (Expo) e 3333 (API) no Firewall do Windows para redes privadas.

## Telas

| Tela | O que faz |
|---|---|
| Login | Mesmo usuário do painel web |
| Abrir mesa | Número da mesa + nome do cliente (opcional) |
| Mesa | Categoria → produto → quantidade → **Adicionar**; lista dos itens com remover; **Avançar** |
| Resumo | Itens + total calculado pela API + botão **Confirmar pedido** → aparece na cozinha |

Sair de uma mesa sem enviar (botão **X** ou voltar do Android) apaga o rascunho. Se já houver itens, o app pede confirmação antes.

## Estrutura

```
src/
├── app/                  # rotas (Expo Router): cada arquivo é uma tela
├── components/           # Button, Input, SelectField, QuantityStepper, ConfirmModal, Logo
├── constants/theme.ts    # paleta (a mesma do painel web)
├── contexts/             # AuthContext (sessão no SecureStore)
├── lib/                  # storage, formatação, alertas
├── services/api.ts       # axios + descoberta do IP da API + interceptor 401
└── types.ts
```

## Verificação

```bash
npx tsc --noEmit
npx expo lint
npx expo-doctor
```
