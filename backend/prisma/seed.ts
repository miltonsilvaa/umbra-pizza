import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@umbrapizza.com";
const DEMO_PASSWORD = "demo123";

// Mesas reservadas para o cenário de demonstração — números altos para não
// colidir com mesas que um recrutador abra manualmente durante o teste.
const DEMO_TABLE_PREPARING = 50;
const DEMO_TABLE_AWAITING_PAYMENT = 51;
const DEMO_TABLE_OPEN = 52; // rascunho, para testar "Adicionar itens" + "Enviar para a cozinha"

type CategoryName = "Pizzas Salgadas" | "Pizzas Doces" | "Bebidas" | "Sobremesas";

interface SeedProduct {
  name: string;
  price: number;
  description: string;
  banner: string;
  category: CategoryName;
}

// Lorem Picsum: fotos reais, estáveis por seed (mesma URL sempre devolve a
// mesma imagem), sem precisar de conta/credenciais — serve só para o painel
// não ficar com cards vazios na demonstração.
function photo(seed: string) {
  return `https://picsum.photos/seed/${seed}/640/480`;
}

const products: SeedProduct[] = [
  {
    name: "Pizza Marguerita",
    price: 42.9,
    description: "Molho de tomate, mussarela, manjericão fresco e azeite.",
    banner: photo("umbra-marguerita"),
    category: "Pizzas Salgadas",
  },
  {
    name: "Pizza Calabresa",
    price: 39.9,
    description: "Calabresa fatiada, cebola e mussarela.",
    banner: photo("umbra-calabresa"),
    category: "Pizzas Salgadas",
  },
  {
    name: "Pizza Pepperoni",
    price: 44.9,
    description: "Pepperoni generoso, mussarela e orégano.",
    banner: photo("umbra-pepperoni"),
    category: "Pizzas Salgadas",
  },
  {
    name: "Pizza Quatro Queijos",
    price: 46.9,
    description: "Mussarela, provolone, parmesão e gorgonzola.",
    banner: photo("umbra-quatro-queijos"),
    category: "Pizzas Salgadas",
  },
  {
    name: "Pizza Frango com Catupiry",
    price: 45.9,
    description: "Frango desfiado, catupiry e milho.",
    banner: photo("umbra-frango-catupiry"),
    category: "Pizzas Salgadas",
  },
  {
    name: "Pizza Chocolate com Morango",
    price: 38.9,
    description: "Chocolate ao leite, morangos frescos e leite condensado.",
    banner: photo("umbra-choco-morango"),
    category: "Pizzas Doces",
  },
  {
    name: "Pizza Banana com Canela",
    price: 34.9,
    description: "Banana caramelizada, canela e açúcar.",
    banner: photo("umbra-banana-canela"),
    category: "Pizzas Doces",
  },
  {
    name: "Coca-Cola 600ml",
    price: 8.0,
    description: "Refrigerante gelado, garrafa de 600ml.",
    banner: photo("umbra-coca-cola"),
    category: "Bebidas",
  },
  {
    name: "Suco de Laranja 500ml",
    price: 9.5,
    description: "Suco natural de laranja, sem açúcar adicionado.",
    banner: photo("umbra-suco-laranja"),
    category: "Bebidas",
  },
  {
    name: "Água Mineral 500ml",
    price: 5.0,
    description: "Água mineral sem gás.",
    banner: photo("umbra-agua-mineral"),
    category: "Bebidas",
  },
  {
    name: "Petit Gateau",
    price: 18.9,
    description: "Bolo de chocolate quente com sorvete de creme.",
    banner: photo("umbra-petit-gateau"),
    category: "Sobremesas",
  },
];

async function upsertProduct(data: Omit<SeedProduct, "category"> & { category_id: string }) {
  const existing = await prisma.product.findFirst({ where: { name: data.name } });

  if (existing) {
    return prisma.product.update({ where: { id: existing.id }, data });
  }

  return prisma.product.create({ data });
}

async function main() {
  const passwordHash = await hash(DEMO_PASSWORD, 10);

  const demoUser = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { password: passwordHash, name: "Conta Demonstração" },
    create: { name: "Conta Demonstração", email: DEMO_EMAIL, password: passwordHash },
  });
  console.log(`✅ Usuário demo: ${demoUser.email} / ${DEMO_PASSWORD}`);

  const categoryNames: CategoryName[] = ["Pizzas Salgadas", "Pizzas Doces", "Bebidas", "Sobremesas"];
  const categories = new Map<CategoryName, { id: string }>();

  for (const name of categoryNames) {
    const category = await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    categories.set(name, category);
  }
  console.log(`✅ ${categories.size} categorias`);

  const productsByName = new Map<string, { id: string }>();

  for (const { category, ...data } of products) {
    const category_id = categories.get(category)!.id;
    const product = await upsertProduct({ ...data, category_id });
    productsByName.set(product.name, product);
  }
  console.log(`✅ ${productsByName.size} produtos`);

  // As mesas de demonstração são recriadas do zero a cada seed: isso garante
  // que o painel sempre abre com os dois cenários esperados, mesmo que um
  // recrutador já tenha fechado/alterado essas mesas em um teste anterior.
  await prisma.order.deleteMany({
    where: { table: { in: [DEMO_TABLE_PREPARING, DEMO_TABLE_AWAITING_PAYMENT, DEMO_TABLE_OPEN] } },
  });

  const preparingOrder = await prisma.order.create({
    data: {
      table: DEMO_TABLE_PREPARING,
      status: "SENT", // em preparo — aparece na fila da cozinha
      items: {
        create: [
          { amount: 2, product_id: productsByName.get("Pizza Marguerita")!.id },
          { amount: 1, product_id: productsByName.get("Coca-Cola 600ml")!.id },
        ],
      },
    },
  });

  const awaitingPaymentOrder = await prisma.order.create({
    data: {
      table: DEMO_TABLE_AWAITING_PAYMENT,
      status: "READY", // concluído pela cozinha — aparece no caixa
      items: {
        create: [
          { amount: 1, product_id: productsByName.get("Pizza Calabresa")!.id },
          { amount: 2, product_id: productsByName.get("Suco de Laranja 500ml")!.id },
          { amount: 1, product_id: productsByName.get("Petit Gateau")!.id },
        ],
      },
    },
  });

  const openOrder = await prisma.order.create({
    data: {
      table: DEMO_TABLE_OPEN,
      status: "DRAFT", // ainda sendo montada — testa "Adicionar itens" + "Enviar para a cozinha" no painel web
      items: {
        create: [{ amount: 1, product_id: productsByName.get("Água Mineral 500ml")!.id }],
      },
    },
  });

  console.log(
    `✅ Mesa ${preparingOrder.table} (em preparo), mesa ${awaitingPaymentOrder.table} (aguardando pagamento) ` +
      `e mesa ${openOrder.table} (aberta, no caixa) criadas`,
  );
}

main()
  .catch((error) => {
    console.error("❌ Falha ao popular o banco:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
