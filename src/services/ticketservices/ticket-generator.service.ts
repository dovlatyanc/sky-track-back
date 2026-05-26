import airportsData from '../../data/airports/airports.json'

interface IAirport {
  iata_code: string
  municipality: string
  iso_country: string
}

const usableAirports = (airportsData as IAirport[]).filter(a => a.iata_code)

// Кеш для билетов
let cachedTickets: any[] | null = null

export function generateFakeTickets(limit: number = 50, forceRefresh: boolean = false) {
  // Если уже есть кеш и не нужно принудительное обновление — возвращаем кеш
  if (cachedTickets && !forceRefresh) {
    return cachedTickets
  }
  
  const airlines = ['Aeroflot', 'S7 Airlines', 'Ural Airlines', 'Pobeda', 'Azur Air', 'Red Wings']

  const tickets = Array.from({ length: limit }, (_, i) => {
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
      id: `ticket-${i}-${Date.now()}`, 
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
  
  cachedTickets = tickets
  return tickets
}

// Функция для принудительного обновления кеша (если нужно)
export function refreshTickets(limit: number = 50) {
  return generateFakeTickets(limit, true)
}