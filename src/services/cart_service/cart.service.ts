import { prisma } from '../../../db/prisma'
import { CACHED_TICKETS } from '../../trpc/routers/tickets.router'

export class CartService {
  // Получить или создать корзину
  static async getOrCreateCart(userId?: string, guestId?: string) {
    if (!userId && !guestId) {
      throw new Error('Either userId or guestId is required')
    }

    let cart = await prisma.cart.findFirst({
      where: userId ? { userId } : { guestId },
      include: { items: true }
    })

    if (!cart) {
      cart = await prisma.cart.create({
        data: userId ? { userId } : { guestId },
        include: { items: true }
      })
    }

    return cart
  }

  // Добавить товар в корзину
  static async addItem(userId: string | undefined, guestId: string | undefined, ticketId: string, quantity: number = 1) {
    const cart = await this.getOrCreateCart(userId, guestId)
    
    // Используем кешированные билеты напрямую
    const ticket = CACHED_TICKETS.find(t => t.id === ticketId)
    
    if (!ticket) {
      console.error(' Ticket not found:', ticketId)
      console.error('Available ticket IDs:', CACHED_TICKETS.map(t => t.id))
      throw new Error(`Ticket not found: ${ticketId}`)
    }

    console.log(' Ticket found:', ticket.id, ticket.price)

    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        ticketId
      }
    })

    if (existingItem) {
      return prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity }
      })
    } else {
      return prisma.cartItem.create({
        data: {
          cartId: cart.id,
          ticketId,
          quantity,
          price: ticket.price
        }
      })
    }
  }

  // Получить корзину с товарами
  static async getCart(userId?: string, guestId?: string) {
    const cart = await prisma.cart.findFirst({
      where: userId ? { userId } : { guestId },
      include: { items: true }
    })

    if (!cart) return null

    const itemsWithDetails = cart.items.map(item => {
      const ticket = CACHED_TICKETS.find(t => t.id === item.ticketId)
      return {
        ...item,
        ticket: ticket || null,
        totalPrice: item.price * item.quantity
      }
    })

    return {
      id: cart.id,
      items: itemsWithDetails,
      totalAmount: itemsWithDetails.reduce((sum, item) => sum + item.totalPrice, 0),
      itemCount: itemsWithDetails.reduce((sum, item) => sum + item.quantity, 0),
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt
    }
  }

  // Обновить количество товара
  static async updateQuantity(userId: string | undefined, guestId: string | undefined, itemId: string, quantity: number) {
    if (quantity <= 0) {
      return this.removeItem(userId, guestId, itemId)
    }

    return prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity }
    })
  }

  // Удалить товар из корзины
  static async removeItem(userId: string | undefined, guestId: string | undefined, itemId: string) {
    return prisma.cartItem.delete({
      where: { id: itemId }
    })
  }

  // Очистить корзину
  static async clearCart(userId?: string, guestId?: string) {
    const cart = await prisma.cart.findFirst({
      where: userId ? { userId } : { guestId }
    })

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id }
      })
    }
  }
 

  // Объединить гостевую корзину с пользовательской после логина
  static async mergeCarts(guestId: string, userId: string) {
    const guestCart = await prisma.cart.findFirst({
      where: { guestId },
      include: { items: true }
    })

    const userCart = await prisma.cart.findFirst({
      where: { userId },
      include: { items: true }
    })

    if (!guestCart) return userCart

    let targetCart = userCart
    if (!targetCart) {
      targetCart = await prisma.cart.update({
        where: { id: guestCart.id },
        data: { userId, guestId: null },
        include: { items: true }
      })
    } else {
      for (const item of guestCart.items) {
        const existingItem = targetCart.items.find(i => i.ticketId === item.ticketId)
        if (existingItem) {
          await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + item.quantity }
          })
        } else {
          await prisma.cartItem.update({
            where: { id: item.id },
            data: { cartId: targetCart.id }
          })
        }
      }
      await prisma.cart.delete({ where: { id: guestCart.id } })
      targetCart = await prisma.cart.findFirst({
        where: { userId },
        include: { items: true }
      })
    }

    return this.getCart(userId, undefined)
  }
}