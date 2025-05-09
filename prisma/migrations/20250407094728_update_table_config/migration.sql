/*
  Warnings:

  - A unique constraint covering the columns `[nifContacto]` on the table `Client` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[identificacionVAT]` on the table `Client` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "TableConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TableConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TableConfig_userId_tableId_key" ON "TableConfig"("userId", "tableId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_nifContacto_key" ON "Client"("nifContacto");

-- CreateIndex
CREATE UNIQUE INDEX "Client_identificacionVAT_key" ON "Client"("identificacionVAT");

-- AddForeignKey
ALTER TABLE "TableConfig" ADD CONSTRAINT "TableConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
