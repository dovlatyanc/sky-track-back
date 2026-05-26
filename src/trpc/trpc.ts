import { initTRPC, TRPCError } from '@trpc/server'
import superjson from 'superjson'
import type { Context } from './context'

export const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      status: 'error',
      message: error.message,
      code: error.code,
      path: error.cause ?? null,
      stack: process.env.NODE_ENV === 'development' ? shape.data.stack : undefined
    }
  }
})

export const router = t.router
export const publicProcedure = t.procedure

// Middleware для проверки авторизации
const isAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ 
      code: 'UNAUTHORIZED', 
      message: 'Not authenticated' 
    })
  }
  return next({ ctx: { userId: ctx.userId } })
})

const isAdmin = t.middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' })
  }
  
  // Получаем пользователя из БД и проверяем роль
  const { prisma } = await import('../../db/prisma')
  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { role: true }
  })
  
  if (user?.role !== 'ADMIN') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' })
  }
  
  return next({ ctx: { userId: ctx.userId } })
})

export const protectedProcedure = t.procedure.use(isAuthed)
export const adminProcedure = t.procedure.use(isAdmin)  