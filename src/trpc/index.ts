import type { inferRouterOutputs } from '@trpc/server'

import { airlinesRouter } from './routers/airlines.router'
import { countriesRouter } from './routers/countries.router'
import { flightsRouter } from './routers/flights.router'
import { ticketsRouter } from './routers/tickets.router'
import { authRouter } from './routers/auth.router'

import { adminRouter } from './routers/admin.router'
import { favoriteTicketsRouter } from './routers/favorite-tickets.router'
import { newsRouter } from './routers/news.router'
import { cartRouter } from './routers/cart.router'
import { ordersRouter } from './routers/orders.router'
import { router } from './trpc'

export const appRouter = router({
	flights: flightsRouter,
	countries: countriesRouter,
	airlines: airlinesRouter,
	tickets: ticketsRouter,
	auth: authRouter,
  	orders: ordersRouter,
	admin: adminRouter,
	favoriteTickets: favoriteTicketsRouter,
	news: newsRouter,
	cart: cartRouter
	
})

export type TAppRouter = typeof appRouter
export type TRouterOutput = inferRouterOutputs<TAppRouter>
