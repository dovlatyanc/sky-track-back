import { z } from 'zod'
import { AuthService } from '../../services/authservice/auth.service'
import { CaptchaService } from '../../services/capctha_service/captcha.service'
import { publicProcedure, protectedProcedure, router } from '../trpc'
export const authRouter = router({
  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        name: z.string().optional(),
        captchaToken: z.string()
      })
    )
    .mutation(async ({ input }) => {
      const isValid = await CaptchaService.verify(input.captchaToken)
      if (!isValid) throw new Error('CAPTCHA verification failed')
      return await AuthService.register(input.email, input.password, input.name)
    }),

  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(6),
        rememberMe: z.boolean().default(false),
        captchaToken: z.string()
      })
    )
    .mutation(async ({ input }) => {
      const isValid = await CaptchaService.verify(input.captchaToken)
      if (!isValid) throw new Error('CAPTCHA verification failed')
      const result = await AuthService.login(input.email, input.password, input.rememberMe)
      if (!result) throw new Error('Invalid credentials')
      return result
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await AuthService.findById(ctx.userId!)
    if (!user) throw new Error('User not found')
    return user
  }),
})