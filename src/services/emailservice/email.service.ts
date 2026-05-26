import nodemailer from 'nodemailer'
import { PDFTicketService } from '../pdf-ticket/pdf-ticket.service'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
})

export class EmailService {
  static async sendTicketConfirmation(
    email: string, 
    ticket: any, 
    orderId: string,
    passengerData: {
      fullName: string
      phone: string
      email: string
      passportNumber?: string
    }
  ) {
    console.log('📧 [EMAIL] Preparing to send ticket confirmation to:', email)
    
    // Генерируем PDF
    const pdfBuffer = await PDFTicketService.generateTicketPDF(
      orderId,
      ticket,
      passengerData
    )
    
    // Русская версия письма
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Подтверждение билета</title>
      </head>
      <body style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 30px; text-align: center; border-radius: 15px 15px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">✈️ SKYTRACKER</h1>
          <p style="color: #dbeafe; margin: 5px 0 0;">Электронный билет</p>
        </div>
        
        <div style="background-color: #ffffff; padding: 25px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 15px 15px;">
          <div style="text-align: center; margin-bottom: 25px;">
            <div style="background-color: #22c55e20; display: inline-block; padding: 10px 20px; border-radius: 50px;">
              <span style="color: #22c55e; font-weight: bold;">✅ БРОНИРОВАНИЕ ПОДТВЕРЖДЕНО</span>
            </div>
          </div>
          
          <h2 style="color: #1f2937; border-left: 4px solid #2563eb; padding-left: 15px; margin-top: 0;">Информация о рейсе</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
            <tr style="background-color: #f3f4f6;">
              <td style="padding: 12px; font-weight: bold; width: 40%;">Маршрут</td>
              <td style="padding: 12px;">${ticket.from.city} (${ticket.from.code}) → ${ticket.to.city} (${ticket.to.code})</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold;">Авиакомпания</td>
              <td style="padding: 12px;">${ticket.airline} · ${ticket.flightNumber}</td>
            </tr>
            <tr style="background-color: #f3f4f6;">
              <td style="padding: 12px; font-weight: bold;">Дата и время вылета</td>
              <td style="padding: 12px;">${new Date(ticket.departureTime).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold;">Дата и время прилёта</td>
              <td style="padding: 12px;">${new Date(ticket.arrivalTime).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</td>
            </tr>
            <tr style="background-color: #f3f4f6;">
              <td style="padding: 12px; font-weight: bold;">В пути</td>
              <td style="padding: 12px;">${ticket.duration}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold;">Пересадки</td>
              <td style="padding: 12px;">${ticket.stops === 0 ? 'Прямой рейс' : `${ticket.stops} пересадк${ticket.stops === 1 ? 'а' : 'и'}`}</td>
            </tr>
          </table>
          
          <h2 style="color: #1f2937; border-left: 4px solid #2563eb; padding-left: 15px;">Информация о пассажире</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
            <tr style="background-color: #f3f4f6;">
              <td style="padding: 12px; font-weight: bold; width: 40%;">Пассажир</td>
              <td style="padding: 12px;">${passengerData.fullName}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold;">Телефон</td>
              <td style="padding: 12px;">${passengerData.phone}</td>
            </tr>
            <tr style="background-color: #f3f4f6;">
              <td style="padding: 12px; font-weight: bold;">Email</td>
              <td style="padding: 12px;">${passengerData.email}</td>
            </tr>
            ${passengerData.passportNumber ? `
            <tr>
              <td style="padding: 12px; font-weight: bold;">Номер паспорта</td>
              <td style="padding: 12px;">${passengerData.passportNumber}</td>
            </tr>
            ` : ''}
          </table>
          
          <div style="background-color: #dcfce7; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
            <p style="font-size: 24px; font-weight: bold; color: #1f2937; margin: 0;">${ticket.price.toLocaleString('ru-RU')} ₽</p>
            <p style="color: #6b7280; margin: 5px 0 0;">Итого к оплате</p>
          </div>
          
          <div style="text-align: center; padding: 15px; background-color: #f3f4f6; border-radius: 10px;">
            <p style="font-size: 12px; color: #6b7280; margin: 0;">
              <strong>Код бронирования:</strong> ${orderId.slice(0, 12).toUpperCase()}
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          
          <div style="text-align: center;">
            <p style="font-size: 12px; color: #6b7280;">
              PDF-билет прикреплён к этому письму.<br>
              Пожалуйста, прибудьте в аэропорт за 2 часа до вылета.
            </p>
            <p style="font-size: 11px; color: #9ca3af;">
              Это автоматическое сообщение, пожалуйста, не отвечайте на него.
            </p>
          </div>
        </div>
      </body>
      </html>
    `

    try {
      const info = await transporter.sendMail({
        from: `"SkyTracker" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: email,
        subject: `✈️ Подтверждение билета - ${orderId.slice(0, 8)}`,
        html,
        attachments: [
          {
            filename: `ticket-${orderId.slice(0, 8)}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      })
      
      console.log('✅ [EMAIL] Email sent successfully!')
      console.log('✅ [EMAIL] PDF ticket attached')
      console.log('✅ [EMAIL] Message ID:', info.messageId)
      
      if (process.env.SMTP_HOST === 'smtp.ethereal.email') {
        console.log('🔗 [EMAIL] Preview URL:', nodemailer.getTestMessageUrl(info))
      }
      
      return info
    } catch (error) {
      console.error('❌ [EMAIL] Failed to send email:', error)
      throw error
    }
  }
}