import { groq } from './groqClient.js'
import { config } from '../config.js'

// Límites para que nadie use el endpoint como proxy gratuito de Groq
const MAX_MESSAGES = 20 // solo se envían a Groq los últimos N mensajes
const MAX_MESSAGE_LENGTH = 2000 // caracteres por mensaje
const ROLES_PERMITIDOS = ['user', 'assistant']

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
 * validateMessages
 * Revisa que el historial tenga el formato correcto. El rol "system" no se acepta
 * para que nadie pueda reemplazar las reglas del asistente.
 * @param {*} messages - Lo que llegó en el body de la petición
 * @returns {string|null} Mensaje de error, o null si es válido
 */
export function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return 'Se requiere un arreglo de mensajes'
  }

  for (const msg of messages) {
    if (!msg || !ROLES_PERMITIDOS.includes(msg.role)) {
      return `Cada mensaje debe tener un rol válido: ${ROLES_PERMITIDOS.join(' o ')}`
    }
    if (typeof msg.content !== 'string' || msg.content.trim() === '') {
      return 'Cada mensaje debe tener contenido de texto'
    }
    if (msg.content.length > MAX_MESSAGE_LENGTH) {
      return `Cada mensaje puede tener como máximo ${MAX_MESSAGE_LENGTH} caracteres`
    }
  }

  return null
}

/**
 * getChatResponse
 * Envía el historial de conversación a Groq y regresa la respuesta del asistente.
 * @param {Array} messages - Historial [{ role: 'user'|'assistant', content: string }]
 * @returns {Promise<string>} Respuesta del asistente
 */
export async function getChatResponse(messages) {
  // Solo copiamos role y content para no reenviar campos extra a Groq
  const history = messages
    .slice(-MAX_MESSAGES)
    .map(({ role, content }) => ({ role, content }))

  const completion = await groq.chat.completions.create({
    model: config.groqModel,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
    ],
    temperature: 0.5,
  })

  return completion.choices[0].message.content
}
