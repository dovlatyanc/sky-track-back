import { z } from 'zod'
import { protectedProcedure, router } from '../trpc'
import { FavoriteTicketService } from '../../services/ticketservices/favorite-ticket.service'

export const favoriteTicketsRouter = router({
  // Добавить в избранное
  add: protectedProcedure
    .input(z.object({ ticketId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return await FavoriteTicketService.add(ctx.userId!, input.ticketId)
    }),

  // Удалить из избранного
  remove: protectedProcedure
    .input(z.object({ ticketId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return await FavoriteTicketService.remove(ctx.userId!, input.ticketId)
    }),

  // Получить все избранные билеты
  getUserFavorites: protectedProcedure.query(async ({ ctx }) => {
    return await FavoriteTicketService.getUserFavorites(ctx.userId!)
  }),

  // Проверить, в избранном ли билет
  isFavorite: protectedProcedure
    .input(z.object({ ticketId: z.string() }))
    .query(async ({ input, ctx }) => {
      return await FavoriteTicketService.isFavorite(ctx.userId!, input.ticketId)
    })
})