import { z } from 'zod'
import { protectedProcedure, adminProcedure, router,publicProcedure } from '../trpc'
import { OrderService } from '../../services/order_service/order.service'

export const ordersRouter = router({
  // Получить заказы текущего пользователя
  getUserOrders: protectedProcedure.query(async ({ ctx }) => {
    return await OrderService.getUserOrders(ctx.userId!)
  }),
  
  // Получить заказ по ID (с passengerData)
  getOrderById: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ input, ctx }) => {
      const order = await OrderService.getOrderById(input.orderId)
      if (!order) throw new Error('Order not found')
      if (order.userId !== ctx.userId) throw new Error('Access denied')
      return order
    }),
  
  // Создать заказ (из корзины)
  createOrder: protectedProcedure
    .input(z.object({
      items: z.array(z.object({
        ticketId: z.string(),
        quantity: z.number().min(1),
        price: z.number().min(0)
      }))
    }))
    .mutation(async ({ input, ctx }) => {
      return await OrderService.createOrder(ctx.userId, undefined, input.items)
    }),
  
  // Админские методы
  getAllOrders: adminProcedure.query(async () => {
    return await OrderService.getAllOrders()
  }),
  
  updateOrderStatus: adminProcedure
    .input(z.object({
      orderId: z.string(),
      status: z.enum(['pending', 'confirmed', 'delivered', 'cancelled'])
    }))
    .mutation(async ({ input }) => {
      return await OrderService.updateOrderStatus(input.orderId, input.status)
    }),

    getOrderByIdPublic: publicProcedure
  .input(z.object({ orderId: z.string() }))
  .query(async ({ input }) => {
    const order = await OrderService.getOrderById(input.orderId)
    if (!order) throw new Error('Order not found')
    // Не проверяем userId, возвращаем заказ для гостей
    return order
  }),
})