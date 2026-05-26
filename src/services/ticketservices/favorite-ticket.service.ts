import { prisma } from '../../../db/prisma'
import { CACHED_TICKETS } from '../../trpc/routers/tickets.router'

export class FavoriteTicketService {
  // Добавить в избранное
  static async add(userId: string, ticketId: string) {
    return prisma.favoriteTicket.create({
      data: { userId, ticketId }
    })
  }

  // Удалить из избранного
  static async remove(userId: string, ticketId: string) {
    return prisma.favoriteTicket.delete({
      where: {
        userId_ticketId: { userId, ticketId }
      }
    })
  }

  // Получить все избранные билеты пользователя
  static async getUserFavorites(userId: string) {
    const favorites = await prisma.favoriteTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
    
    // Добавляем данные билетов из кеша
    return favorites.map(fav => ({
      id: fav.id,
      ticketId: fav.ticketId,
      ticket: CACHED_TICKETS.find(t => t.id === fav.ticketId) || null,
      createdAt: fav.createdAt
    }))
  }

  // Проверить, в избранном ли билет
  static async isFavorite(userId: string, ticketId: string) {
    const favorite = await prisma.favoriteTicket.findUnique({
      where: {
        userId_ticketId: { userId, ticketId }
      }
    })
    return !!favorite
  }
}