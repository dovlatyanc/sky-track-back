import { z } from 'zod'
import { publicProcedure, router } from '../trpc'
import airportsData from '../../data/airports/airports.json'

interface IAirport {
  id: string
  ident: string
  name: string
  municipality: string
  iso_country: string
  iata_code: string
  gps_code: string
  latitude_deg: string
  longitude_deg: string
  scheduled_service?: string
}

export interface ITicket {
  id: string
  from: { code: string; city: string; country: string }
  to: { code: string; city: string; country: string }
  price: number
  departureTime: string
  arrivalTime: string
  duration: string
  airline: string
  flightNumber: string
  stops: number
}

const usableAirports = (airportsData as IAirport[]).filter(a => a.iata_code)

// Генерируем билеты один раз при старте сервера
export const CACHED_TICKETS: ITicket[] = (() => {
  const airlines = ['Aeroflot', 'S7 Airlines', 'Ural Airlines', 'Pobeda', 'Azur Air', 'Red Wings']

  return Array.from({ length: 50 }, (_, i) => {
    const fromIndex = Math.floor(Math.random() * usableAirports.length)
    let toIndex = Math.floor(Math.random() * usableAirports.length)
    while (toIndex === fromIndex) {
      toIndex = Math.floor(Math.random() * usableAirports.length)
    }

    const from = usableAirports[fromIndex]
    const to = usableAirports[toIndex]

    const departure = new Date(Date.now() + Math.random() * 1000 * 60 * 60 * 24 * 7)
    const durationMinutes = Math.floor(Math.random() * 6) * 60 + 30
    const arrival = new Date(departure.getTime() + durationMinutes * 60 * 1000)

    return {
      id: `ticket-${i}`,
      from: {
        code: from.iata_code,
        city: from.municipality,
        country: from.iso_country
      },
      to: {
        code: to.iata_code,
        city: to.municipality,
        country: to.iso_country
      },
      price: Math.floor(Math.random() * 50000) + 5000,
      departureTime: departure.toISOString(),
      arrivalTime: arrival.toISOString(),
      duration: `${Math.floor(durationMinutes / 60)}h ${(durationMinutes % 60)}m`,
      airline: airlines[Math.floor(Math.random() * airlines.length)],
      flightNumber: `SU${Math.floor(Math.random() * 900) + 100}`,
      stops: Math.floor(Math.random() * 3)
    }
  })
})()

// Для отладки - выводим первые 5 ID билетов
console.log('🎫 Tickets loaded:', CACHED_TICKETS.slice(0, 3).map(t => ({ id: t.id, from: t.from.code, to: t.to.code })))

export const ticketsRouter = router({
  // Получить все билеты
  getAll: publicProcedure.query(() => {
    return CACHED_TICKETS
  }),

  // Получить билет по ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input }) => {
      return CACHED_TICKETS.find(t => t.id === input.id) || null
    })
})