import { groq } from './groqClient.js'
import { config } from '../config.js'

const SENTIMIENTOS_VALIDOS = ['positivo', 'negativo', 'neutral']

/**
 * analyzeSentiment
 * Envía una lista de titulares de noticias a un modelo de Groq
 * y pide una clasificación de sentimiento general del mercado, en JSON.
 * @param {Array} newsItems - Lista de noticias { title, source }
 * @returns {Promise<Object>} { sentimiento, confianza, resumen }
 */
export async function analyzeSentiment(newsItems) {
  const titulares = newsItems
    .map((item, i) => `${i + 1}. [${item.source}] ${item.title}`)
    .join('\n')

  const prompt = `
Eres un analista financiero especializado en criptomonedas.
Analiza los siguientes titulares de noticias recientes y determina
el sentimiento GENERAL del mercado cripto en este momento.

Titulares:
${titulares}

Responde ÚNICAMENTE con un objeto JSON válido (sin texto adicional, sin markdown),
con esta estructura exacta:
{
  "sentimiento": "positivo" | "negativo" | "neutral",
  "confianza": <número del 0 al 100>,
  "resumen": "<explicación breve en 1-2 oraciones, en español>"
}
`.trim()

  let completion
  try {
    completion = await groq.chat.completions.create({
      model: config.groqModel,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })
  } catch (err) {
    console.error('❌ Error llamando a Groq:', err.status, err.message)
    throw new Error(`Groq falló: ${err.message}`)
  }

  const responseText = completion.choices[0].message.content

  // Por si acaso el modelo envuelve el JSON en ```json ... ```
  const cleanJson = responseText.replace(/```json|```/g, '').trim()

  let parsed
  try {
    parsed = JSON.parse(cleanJson)
  } catch (err) {
    throw new Error('Groq no devolvió un JSON válido: ' + responseText)
  }

  return normalizeAnalysis(parsed)
}

/**
 * normalizeAnalysis
 * Asegura que la respuesta del modelo tenga el formato que espera el frontend.
 */
function normalizeAnalysis(data) {
  const sentimiento = String(data.sentimiento || '').toLowerCase().trim()
  if (!SENTIMIENTOS_VALIDOS.includes(sentimiento)) {
    throw new Error(`Sentimiento inválido devuelto por Groq: ${data.sentimiento}`)
  }

  const confianza = Number(data.confianza)
  if (!Number.isFinite(confianza)) {
    throw new Error(`Confianza inválida devuelta por Groq: ${data.confianza}`)
  }

  return {
    sentimiento,
    confianza: Math.round(Math.min(100, Math.max(0, confianza))),
    resumen: String(data.resumen || '').trim(),
  }
}
