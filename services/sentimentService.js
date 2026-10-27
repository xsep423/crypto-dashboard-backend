import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

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
      model: 'openai/gpt-oss-20b',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })
  } catch (err) {
    console.error('❌ Error llamando a Groq:', err.status, err.message)
    throw new Error(`Groq falló: ${err.message}`)
  }

  const responseText = completion.choices[0].message.content
  console.log('📩 Respuesta cruda de Groq:', responseText)

  // Por si acaso el modelo envuelve el JSON en ```json ... ```
  const cleanJson = responseText.replace(/```json|```/g, '').trim()

  try {
    return JSON.parse(cleanJson)
  } catch (err) {
    throw new Error('Groq no devolvió un JSON válido: ' + responseText)
  }
}