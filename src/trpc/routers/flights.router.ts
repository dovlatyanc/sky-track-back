import { z } from 'zod'

import aviationService from '../../services/aviationstack/aviation.service'
import { mapAviationToFlight } from '../../utils/map-aviation-stack'
import { publicProcedure, router } from '../trpc'

export const flightsRouter = router({
	getLive: publicProcedure
		.input(
			z.object({
				limit: z.number().min(1).max(100).nullish(),
				cursor: z.number().min(0).nullish(),
				airlineName: z.string().optional()
			})
		)
		.query(async ({ input }) => {
			const limit = input.limit ?? 10
			const offset = input.cursor ?? 0

			const data = await aviationService.fetchLiveFlights(
				limit,
				offset,
				input.airlineName
			)

			const newData = data?.data
				.filter(f => !!f.flight.iata && !!f.departure.icao && !!f.arrival.icao)
				.map(mapAviationToFlight)
				.filter(f => f !== null && f.progress > 0 && f.progress < 100) // ← Фильтруем рейсы в полете

			const uniqueFlights = Array.from(
				new Map(newData.map(f => [f?.id, f])).values()
			)

			return {
				items: uniqueFlights,
				nextCursor: offset + limit
			}
		})
})
