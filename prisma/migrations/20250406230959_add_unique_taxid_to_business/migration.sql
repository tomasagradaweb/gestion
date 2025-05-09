/*
  Warnings:

  - A unique constraint covering the columns `[taxId]` on the table `Business` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Business_taxId_key" ON "Business"("taxId");
