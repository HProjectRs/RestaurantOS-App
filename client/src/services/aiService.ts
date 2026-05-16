import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = 'AIzaSyCDxafZQBCkVUZmDjAQ5eUJAK-2oWWo3cg'
const genAI = new GoogleGenerativeAI(API_KEY)

export interface ReceiptData {
  description: string
  amount: number
  category: string
  date: string
  items?: string[]
  vendor?: string
}

export async function scanReceipt(imageBase64: string): Promise<ReceiptData> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `Extract receipt data from this image. Return ONLY a JSON object with these fields (no other text):
{
  "description": "what was purchased",
  "amount": total amount as number,
  "category": one of: إمدادات, صيانة, رواتب, فواتير, أخرى,
  "date": date in ISO format (YYYY-MM-DD) or today's date if not visible,
  "items": array of items if visible,
  "vendor": store name if visible
}`

  const imagePart = {
    inlineData: {
      data: imageBase64,
      mimeType: 'image/jpeg'
    }
  }

  const result = await model.generateContent([prompt, imagePart])
  const text = result.response.text()
  
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Failed to parse receipt data')
  
  return JSON.parse(jsonMatch[0])
}

export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}