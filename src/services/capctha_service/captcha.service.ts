export class CaptchaService {
  static async verify(token: string): Promise<boolean> {
    try {
      const secretKey = process.env.TURNSTILE_SECRET_KEY
      if (!secretKey) {
        console.error('❌ TURNSTILE_SECRET_KEY is missing in .env')
        return false
      }

      const formData = new FormData()
      formData.append('secret', secretKey)
      formData.append('response', token)

      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      console.log('🔵 Turnstile verification response:', data)
      
      return data.success === true
    } catch (error) {
      console.error('CAPTCHA verification error:', error)
      return false
    }
  }
}