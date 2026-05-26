import { prisma } from '../../../db/prisma'
import { CACHED_TICKETS } from '../../trpc/routers/tickets.router'
import { EmailService } from '../emailservice/email.service'

export class OrderService {
  // Создать заказ
  static async createOrder(userId: string | undefined, guestId: string | undefined, items: { ticketId: string; quantity: number; price: number }[]) {
    const order = await prisma.order.create({
      data: {
        userId,
        guestId,
        isGuest: !userId,
        status: 'pending',
        items: {
          create: items.map(item => ({
            ticketId: item.ticketId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      },
      include: {
        items: true
      }
    })
    
    // Очищаем корзину после создания заказа
    if (userId) {
      await prisma.cart.deleteMany({ where: { userId } })
    } else if (guestId) {
      await prisma.cart.deleteMany({ where: { guestId } })
    }
    
    return order
  }

  // Получить заказы пользователя
  static async getUserOrders(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: { 
      items: true,
      passengerData: true  
    },
    orderBy: { createdAt: 'desc' }
  })
  
  return orders.map(order => ({
    ...order,
    items: order.items.map(item => ({
      ...item,
      ticket: CACHED_TICKETS.find(t => t.id === item.ticketId) || null
    }))
  }))
}

  // Получить заказ по ID
  static async getOrderById(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        items: true,
        passengerData: true 
      }
    })
    
    if (!order) return null
    
    return {
      ...order,
      items: order.items.map(item => ({
        ...item,
        ticket: CACHED_TICKETS.find(t => t.id === item.ticketId) || null
      }))
    }
  }

  // Обновить статус заказа (для админа)
  static async updateOrderStatus(orderId: string, status: string) {
    return prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { items: true }
    })
  }


static async getAllOrders() {
  const orders = await prisma.order.findMany({
    include: { 
      items: true, 
      user: { select: { id: true, email: true, name: true } },
      passengerData: true 
    },
    orderBy: { createdAt: 'desc' }
  })
  
  return orders.map(order => ({
    ...order,
    items: order.items.map(item => ({
      ...item,
      ticket: CACHED_TICKETS.find(t => t.id === item.ticketId) || null
    }))
  }))
}

 
    static async processTicketPurchase(
  userId: string | undefined,
  email: string,
  customerData: {
    fullName: string
    phone: string
    passportNumber?: string
  },
  ticketId: string,
  quantity: number = 1
) {
  const ticket = CACHED_TICKETS.find(t => t.id === ticketId)
  if (!ticket) {
    throw new Error('Ticket not found')
  }

  // Создаём заказ
  const order = await prisma.order.create({
    data: {
      userId,
      isGuest: !userId,
      status: 'confirmed',
      items: {
        create: {
          ticketId,
          quantity,
          price: ticket.price
        }
      }
    },
    include: { items: true }
  })

  // Сохраняем данные пассажира
  await prisma.passengerData.create({
    data: {
      orderId: order.id,
      fullName: customerData.fullName,
      phone: customerData.phone,
      passportNumber: customerData.passportNumber,
      email
    }
  })

  // Отправляем email с PDF вложением
  await EmailService.sendTicketConfirmation(email, ticket, order.id, {
    fullName: customerData.fullName,
    phone: customerData.phone,
    email: email,
    passportNumber: customerData.passportNumber
  })

  // Очищаем корзину если была
  if (userId) {
    await prisma.cart.deleteMany({ where: { userId } })
  }

  return { order, ticket }
}
}