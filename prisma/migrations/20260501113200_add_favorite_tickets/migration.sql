-- CreateTable
CREATE TABLE "FavoriteTicket" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavoriteTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FavoriteTicket_userId_ticketId_key" ON "FavoriteTicket"("userId", "ticketId");

-- AddForeignKey
ALTER TABLE "FavoriteTicket" ADD CONSTRAINT "FavoriteTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
