export interface IUser {
  id: string
  email: string
  name?: string
  createdAt: Date
  updatedAt: Date
}

export interface IOrder {
  id: string
  userId?: string
  isGuest: boolean
  guestId?: string // напр. uuid.v4()
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled'
  createdAt: Date
  updatedAt: Date
  items: IOrderItem[]
}

export interface IOrderItem {
  id: string
  ticketId: string
  quantity: number
  price: number
}