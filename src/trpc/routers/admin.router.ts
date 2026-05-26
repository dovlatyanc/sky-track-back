import { z } from 'zod'
import { adminProcedure, router } from '../trpc'
import { prisma } from '../../../db/prisma'  // 👈 должен быть такой импорт
import bcrypt from 'bcrypt'

export const adminRouter = router({
  // Получить всех пользователей
  getAllUsers: adminProcedure.query(async () => {
    return await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    })
  }),
  
  // Получить пользователя по ID
  getUserById: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const user = await prisma.user.findUnique({
        where: { id: input.id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true
        }
      })
      if (!user) throw new Error('User not found')
      return user
    }),
  
  // Создать пользователя (админом)
  createUser: adminProcedure
    .input(z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().optional(),
      role: z.enum(['USER', 'ADMIN']).default('USER')
    }))
    .mutation(async ({ input }) => {
      const hashedPassword = await bcrypt.hash(input.password, 10)
      return await prisma.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
          name: input.name,
          role: input.role
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true
        }
      })
    }),
  
  // Обновить пользователя
  updateUser: adminProcedure
    .input(z.object({
      id: z.string(),
      email: z.string().email().optional(),
      name: z.string().optional(),
      role: z.enum(['USER', 'ADMIN']).optional(),
      password: z.string().min(6).optional()
    }))
    .mutation(async ({ input }) => {
      const data: any = {}
      if (input.email !== undefined) data.email = input.email
      if (input.name !== undefined) data.name = input.name
      if (input.role !== undefined) data.role = input.role
      if (input.password !== undefined) {
        data.password = await bcrypt.hash(input.password, 10)
      }
      
      return await prisma.user.update({
        where: { id: input.id },
        data,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          updatedAt: true
        }
      })
    }),
  
  // Удалить пользователя
  deleteUser: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // ctx.userId из middleware
      if (input.id === ctx.userId) {
        throw new Error('Cannot delete yourself')
      }
      
      return await prisma.user.delete({
        where: { id: input.id },
        select: { id: true, email: true }
      })
    }),
  
  // Назначить админа
  makeAdmin: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await prisma.user.update({
        where: { id: input.id },
        data: { role: 'ADMIN' },
        select: { id: true, email: true, role: true }
      })
    })
})