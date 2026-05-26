/*
  Warnings:

  - You are about to drop the `Ticket` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "FavoriteTicket" DROP CONSTRAINT "FavoriteTicket_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_ticketId_fkey";

-- DropTable
DROP TABLE "Ticket";
