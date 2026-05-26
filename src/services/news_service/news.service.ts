import { prisma } from '../../../db/prisma'

export interface CreateNewsDTO {
  title: string
  content: string
  imageUrl?: string
  authorId: string
  isPublished?: boolean
}

export interface UpdateNewsDTO {
  title?: string
  content?: string
  imageUrl?: string
  isPublished?: boolean
}

export class NewsService {
static async create(data: CreateNewsDTO) {
  console.log('Creating news with data:', data) 
  return prisma.news.create({
    data: {
      title: data.title,
      content: data.content,
      imageUrl: data.imageUrl,
      authorId: data.authorId,
      isPublished: data.isPublished ?? true
    },
    include: {
      author: {
        select: { id: true, name: true, email: true }
      }
    }
  })
}

  // Получить все новости (публичные)
  static async getAllPublished() {
    return prisma.news.findMany({
      where: { isPublished: true },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Получить все новости (для админа)
  static async getAllAdmin() {
    return prisma.news.findMany({
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  // Получить новость по ID
  static async getById(id: string) {
    return prisma.news.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      }
    })
  }

  // Обновить новость (только админ)
  static async update(id: string, data: UpdateNewsDTO) {
    return prisma.news.update({
      where: { id },
      data,
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      }
    })
  }

  // Удалить новость (только админ)
  static async delete(id: string) {
    return prisma.news.delete({ where: { id } })
  }

  // Увеличить просмотры
  static async incrementViews(id: string) {
    return prisma.news.update({
      where: { id },
      data: { views: { increment: 1 } }
    })
  }
}