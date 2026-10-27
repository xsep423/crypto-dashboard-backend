import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

// Instrucciones del asistente — define su personalidad y límites
const SYSTEM_PROMPT = `
Eres el asistente virtual de "CryptoDashboard IA", un dashboard de criptomonedas.
Ayudas a los usuarios a:
- Entender conceptos básicos de criptomonedas y blockchain
- Interpretar los datos que ven en el dashboard (precios, gráficas, sentimiento de mercado)
- Navegar las funciones del dashboard (Mercado, Sentimiento IA, Personalización, Asistente IA)

Reglas importantes:
- NUNCA das consejos financieros específicos (no digas "compra X" o "vende Y")
- Si te preguntan si deben invertir, aclara que no puedes dar asesoría financiera y sugiere consultar a un profesional
- Responde siempre en español, de forma breve y clara (máximo 3-4 oraciones por respuesta)
- Si no sabes algo, dilo honestamente en vez de inventar datos
`.trim()

/**
 * getChatResponse
 * Envía el historial de conversación a Groq y regresa la respuesta del asistente.
 * @param {Array} messages - Historial [{ role: 'user'|'assistant', content: string }]
 * @returns {Promise<string>} Respuesta del asistente
 */
export async function getChatResponse(messages) {
  const completion = await groq.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ],
    temperature: 0.5,
  })

  return completion.choices[0].message.content
}