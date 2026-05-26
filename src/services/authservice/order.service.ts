import { PrismaClient } from '@prisma/client'
import type { IOrder, IOrderItem } from '../../types/user.types'

const prisma = new PrismaClient()

export class OrderService {
  static async createOrder(
    userId: string | undefined,
    guestId: string | undefined,
    items: { ticketId: string; quantity: number; price: number }[]
  ): Promise<IOrder> {
    const order = await prisma.order.create({
      data: {
        userId,
        isGuest: !!guestId,
        guestId,
        status: 'pending',
        items: {
          create: items.map(item => ({
            ticketId: item.ticketId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { items: true },
    })

    return order as unknown as IOrder
  }

  static async getUserOrders(userId: string): Promise<IOrder[]> {
    return await prisma.order.findMany({
      where: { userId },
      include: { items: true },
    })
  }
}