import { type CreateExpressContextOptions } from '@trpc/server/adapters/express'
import jwt from 'jsonwebtoken'
import { prisma } from '../../db/prisma'

export async function createContext({ req, res }: CreateExpressContextOptions) {
  let userId: string | null = null
  let userRole: string | null = null
  
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string }
      userId = decoded.id
      
      // Получаем роль пользователя
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      })
      userRole = user?.role || null
    } catch (error) {
      console.log('Invalid token')
    }
  }
  
  return { userId, userRole, req, res }
}

export type Context = Awaited<ReturnType<typeof createContext>>