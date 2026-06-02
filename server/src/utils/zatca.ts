import * as QRCode from 'qrcode'

interface ZatcaInvoiceData {
  sellerName: string
  vatNumber: string
  invoiceDate: string
  totalWithVat: number
  vatTotal: number
}

function encodeTLV(tag: number, value: string): Buffer {
  const valueBuffer = Buffer.from(value, 'utf-8')
  const tagBuffer = Buffer.from([tag])
  const lengthBuffer = Buffer.alloc(1)
  lengthBuffer.writeUInt8(valueBuffer.length)
  return Buffer.concat([tagBuffer, lengthBuffer, valueBuffer])
}

export function generateZatcaTLV(data: ZatcaInvoiceData): Buffer {
  return Buffer.concat([
    encodeTLV(1, data.sellerName),
    encodeTLV(2, data.vatNumber),
    encodeTLV(3, data.invoiceDate),
    encodeTLV(4, data.totalWithVat.toFixed(2)),
    encodeTLV(5, data.vatTotal.toFixed(2)),
  ])
}

export async function generateZatcaQRBase64(data: ZatcaInvoiceData): Promise<string> {
  const tlvBuffer = generateZatcaTLV(data)
  const base64String = tlvBuffer.toString('base64')
  const qrDataUrl = await QRCode.toDataURL(base64String, {
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  })
  return qrDataUrl
}

export async function generateZatcaQRBuffer(data: ZatcaInvoiceData): Promise<Buffer> {
  const tlvBuffer = generateZatcaTLV(data)
  const base64String = tlvBuffer.toString('base64')
  return QRCode.toBuffer(base64String, {
    width: 300,
    margin: 2,
    type: 'png',
  })
}

export function formatZatcaInvoiceDate(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z')
}
