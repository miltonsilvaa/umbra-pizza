-- Substitui os booleanos draft/status por um enum único OrderStatus,
-- preservando o estado de cada pedido já existente (em vez do
-- DROP COLUMN + ADD COLUMN padrão do Prisma, que resetaria tudo para DRAFT).

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'SENT', 'READY', 'CLOSED');

-- AlterTable: nova coluna status_new calculada a partir dos valores atuais
ALTER TABLE "orders" ADD COLUMN "status_new" "OrderStatus";

UPDATE "orders" SET "status_new" = CASE
  WHEN "draft" = true THEN 'DRAFT'::"OrderStatus"
  WHEN "draft" = false AND "status" = false THEN 'SENT'::"OrderStatus"
  WHEN "draft" = false AND "status" = true THEN 'READY'::"OrderStatus"
END;

-- DropIndex
DROP INDEX "orders_draft_status_idx";

-- AlterTable: remove as colunas antigas, promove status_new e adiciona closed_at
ALTER TABLE "orders" DROP COLUMN "draft",
DROP COLUMN "status",
ADD COLUMN "closed_at" TIMESTAMP(3);

ALTER TABLE "orders" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "orders" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");
