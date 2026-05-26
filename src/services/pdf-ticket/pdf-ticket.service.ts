import PDFDocument from 'pdfkit'
import { Buffer } from 'buffer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Абсолютный путь к папке со шрифтами
const FONTS_DIR = path.join(process.cwd(), 'src', 'fonts')
const FONT_PATH = path.join(FONTS_DIR, 'arial.ttf')

console.log('📁 Font path:', FONT_PATH)
console.log('📁 Font exists:', fs.existsSync(FONT_PATH))

export class PDFTicketService {
  static async generateTicketPDF(
    orderId: string,
    ticket: any,
    passengerData: {
      fullName: string
      phone: string
      email: string
      passportNumber?: string
    }
  ): Promise<Buffer> {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50, layout: 'portrait' })
      const buffers: Buffer[] = []
      
      doc.on('data', buffers.push.bind(buffers))
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers)
        resolve(pdfData)
      })
      
      // Проверяем и загружаем шрифт
      let useCustomFont = false
      if (fs.existsSync(FONT_PATH)) {
        doc.registerFont('MainFont', FONT_PATH)
        useCustomFont = true
        console.log('✅ Русский шрифт загружен')
      } else {
        console.warn('⚠️ Шрифт не найден, русские буквы могут отображаться некорректно')
      }
      
      // Header
      doc.fontSize(24)
        .font(useCustomFont ? 'MainFont' : 'Helvetica-Bold')
        .fillColor('#1e3a8a')
        .text('✈️ SKYTRACKER', { align: 'center' })
      
      doc.fontSize(10)
        .font(useCustomFont ? 'MainFont' : 'Helvetica')
        .fillColor('#6b7280')
        .text('Электронный билет • Посадочный талон', { align: 'center' })
        .moveDown()
      
      doc.strokeColor('#1e3a8a')
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(550, doc.y)
        .stroke()
        .moveDown()
      
      // ИНФОРМАЦИЯ О РЕЙСЕ
      doc.fontSize(14)
        .font(useCustomFont ? 'MainFont' : 'Helvetica-Bold')
        .fillColor('#1f2937')
        .text('Информация о рейсе', { underline: true })
        .moveDown(0.8)
      
      const startX = 50
      const centerX = 300
      const routeY = doc.y
      
      doc.fontSize(20)
        .font(useCustomFont ? 'MainFont' : 'Helvetica-Bold')
        .fillColor('#1f2937')
        .text(ticket.from.code, startX, routeY)
      
      doc.fontSize(14)
        .fillColor('#1e3a8a')
        .text('✈️', centerX - 15, routeY + 5)
      
      doc.fontSize(20)
        .fillColor('#1f2937')
        .text(ticket.to.code, centerX + 15, routeY)
      
      doc.fontSize(10)
        .font(useCustomFont ? 'MainFont' : 'Helvetica')
        .fillColor('#6b7280')
        .text(ticket.from.city, startX, routeY + 25)
        .text(ticket.to.city, centerX + 15, routeY + 25)
        .moveDown(2)
      
      const details = [
        { label: 'Авиакомпания', value: ticket.airline },
        { label: 'Номер рейса', value: ticket.flightNumber },
        { label: 'Дата', value: new Date(ticket.departureTime).toLocaleDateString('ru-RU') },
        { label: 'Время вылета', value: new Date(ticket.departureTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) },
        { label: 'Время прилёта', value: new Date(ticket.arrivalTime).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) },
        { label: 'В пути', value: ticket.duration },
        { label: 'Пересадки', value: ticket.stops === 0 ? 'Прямой рейс' : `${ticket.stops} пересадк${ticket.stops === 1 ? 'а' : 'и'}` }
      ]
      
      let yPos = doc.y
      details.forEach((detail, index) => {
        const y = yPos + (index * 22)
        doc.fontSize(10)
          .font(useCustomFont ? 'MainFont' : 'Helvetica-Bold')
          .fillColor('#4b5563')
          .text(detail.label + ':', 50, y)
        doc.font(useCustomFont ? 'MainFont' : 'Helvetica')
          .fillColor('#1f2937')
          .text(detail.value, 160, y)
      })
      
      doc.moveDown(details.length + 1)
      
      // ИНФОРМАЦИЯ О ПАССАЖИРЕ
      doc.fontSize(14)
        .font(useCustomFont ? 'MainFont' : 'Helvetica-Bold')
        .fillColor('#1f2937')
        .text('Информация о пассажире', { underline: true })
        .moveDown(0.8)
      
      const passengerDetails = [
        { label: 'Пассажир', value: passengerData.fullName },
        { label: 'Телефон', value: passengerData.phone },
        { label: 'Email', value: passengerData.email }
      ]
      
      if (passengerData.passportNumber) {
        passengerDetails.push({ label: 'Номер паспорта', value: passengerData.passportNumber })
      }
      
      passengerDetails.forEach((detail, index) => {
        const y = doc.y + (index * 22)
        doc.fontSize(10)
          .font(useCustomFont ? 'MainFont' : 'Helvetica-Bold')
          .fillColor('#4b5563')
          .text(detail.label + ':', 50, y)
        doc.font(useCustomFont ? 'MainFont' : 'Helvetica')
          .fillColor('#1f2937')
          .text(detail.value, 160, y)
      })
      
      doc.moveDown(passengerDetails.length + 1)
      
      // ЦЕНА
      doc.fontSize(16)
        .font(useCustomFont ? 'MainFont' : 'Helvetica-Bold')
        .fillColor('#1e3a8a')
        .text(`Итого: ${ticket.price.toLocaleString('ru-RU')} ₽`, { align: 'right' })
        .moveDown()
      
      // НОМЕР БРОНИРОВАНИЯ
      doc.fontSize(28)
        .font('Courier')
        .fillColor('#1f2937')
        .text(orderId.slice(0, 12).toUpperCase(), { align: 'center' })
      
      doc.fontSize(8)
        .font(useCustomFont ? 'MainFont' : 'Helvetica')
        .fillColor('#6b7280')
        .text('Код бронирования', { align: 'center' })
      
      doc.end()
    })
  }
}