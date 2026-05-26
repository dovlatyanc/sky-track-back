import { z } from 'zod'
import { publicProcedure, protectedProcedure, router } from '../trpc'
import { CartService } from '../../services/cart_service/cart.service'
import { OrderService } from '../../services/order_service/order.service'

export const cartRouter = router({
  // Получить корзину
  getCart: publicProcedure
    .input(z.object({
      guestId: z.string().optional()
    }))
    .query(async ({ input, ctx }) => {
      const userId = ctx.userId
      const guestId = input.guestId
      
      return await CartService.getCart(userId || undefined, guestId)
    }),

  // Добавить в корзину
  addItem: publicProcedure
    .input(z.object({
      ticketId: z.string(),
      quantity: z.number().min(1).default(1),
      guestId: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId
      const guestId = input.guestId
      
      return await CartService.addItem(userId || undefined, guestId, input.ticketId, input.quantity)
    }),

  // Обновить количество
  updateQuantity: publicProcedure
    .input(z.object({
      itemId: z.string(),
      quantity: z.number().min(0),
      guestId: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId
      const guestId = input.guestId
      
      return await CartService.updateQuantity(userId || undefined, guestId, input.itemId, input.quantity)
    }),

  // Удалить товар
  removeItem: publicProcedure
    .input(z.object({
      itemId: z.string(),
      guestId: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId
      const guestId = input.guestId
      
      return await CartService.removeItem(userId || undefined, guestId, input.itemId)
    }),

  // Очистить корзину
  clearCart: publicProcedure
    .input(z.object({
      guestId: z.string().optional()
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId
      const guestId = input.guestId
      
      return await CartService.clearCart(userId || undefined, guestId)
    }),

  // Объединить корзины после логина
  mergeCarts: protectedProcedure
    .input(z.object({ guestId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return await CartService.mergeCarts(input.guestId, ctx.userId!)
    }),

  // Оформить заказ (поддерживает гостей)
  checkout: publicProcedure
    .input(z.object({
      guestId: z.string().optional(),
      customerData: z.object({
        fullName: z.string().min(3),
        phone: z.string().min(10),
        passportNumber: z.string().optional(),
        email: z.string().email()
      })
    }))
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.userId
      const guestId = input.guestId
      
      console.log('🔵 [checkout] userId:', userId)
      console.log('🔵 [checkout] guestId:', guestId)
      
      // Получаем корзину (по userId или guestId)
      const cart = await CartService.getCart(userId || undefined, guestId)
      
      console.log('🔵 [checkout] cart found:', !!cart)
      console.log('🔵 [checkout] cart items:', cart?.items?.length || 0)
      
      if (!cart || cart.items.length === 0) {
        throw new Error('Cart is empty')
      }
      
      // Создаём заказы для всех товаров в корзине
      const orders = []
      for (const item of cart.items) {
        console.log('🔵 [checkout] processing item:', item)
        
        const result = await OrderService.processTicketPurchase(
          userId || undefined,
          input.customerData.email,
          {
            fullName: input.customerData.fullName,
            phone: input.customerData.phone,
            passportNumber: input.customerData.passportNumber
          },
          item.ticketId,
          item.quantity
        )
        orders.push(result)
      }
      
      // Очищаем корзину
      await CartService.clearCart(userId || undefined, guestId)
      
      // Возвращаем orderId первого заказа для редиректа
      return { 
        success: true, 
        orderId: orders[0]?.order?.id,
        orders 
      }
    })
})