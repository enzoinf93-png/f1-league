/*
  Warnings:

  - You are about to drop the column `leagueId` on the `GrandPrix` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "GrandPrix" DROP CONSTRAINT "GrandPrix_leagueId_fkey";

-- AlterTable
ALTER TABLE "GrandPrix" DROP COLUMN "leagueId";

-- CreateTable
CREATE TABLE "LeagueGrandPrix" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "grandPrixId" TEXT NOT NULL,

    CONSTRAINT "LeagueGrandPrix_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LeagueGrandPrix_leagueId_grandPrixId_key" ON "LeagueGrandPrix"("leagueId", "grandPrixId");

-- AddForeignKey
ALTER TABLE "LeagueGrandPrix" ADD CONSTRAINT "LeagueGrandPrix_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeagueGrandPrix" ADD CONSTRAINT "LeagueGrandPrix_grandPrixId_fkey" FOREIGN KEY ("grandPrixId") REFERENCES "GrandPrix"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
