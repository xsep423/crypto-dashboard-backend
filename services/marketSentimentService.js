import { getLatestNews } from './newsService.js'
import { analyzeSentiment } from './sentimentService.js'
import { config } from '../config.js'

const CACHE_TTL_MS = config.sentimentCacheMinutes * 60 * 1000

let cache = null // { data, timestamp }
let pendingRequest = null // evita lanzar varios análisis a la vez si llegan peticiones simultáneas

/**
 * getMarketSentiment
 * Regresa noticias + análisis de sentimiento, reutilizando el último resultado
 * mientras siga vigente. Si Groq o los feeds fallan, regresa el último resultado bueno.
 * @returns {Promise<Object>} { sentimiento, confianza, resumen, noticias, actualizado, desactualizado }
 */
export async function getMarketSentiment() {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL_MS) {
    return cache.data
  }

  if (!pendingRequest) {
    pendingRequest = fetchFreshSentiment().finally(() => {
      pendingRequest = null
    })
  }

  try {
    return await pendingRequest
  } catch (err) {
    if (cache) {
      console.error('⚠️ Usando el último análisis guardado porque falló uno nuevo:', err.message)
      return { ...cache.data, desactualizado: true }
    }
    throw err
  }
}

async function fetchFreshSentiment() {
  const news = await getLatestNews(5)

  if (news.length === 0) {
    throw new Error('No se pudieron obtener noticias de ningún feed')
  }

  const analysis = await analyzeSentiment(news)

  const data = {
    ...analysis,
    noticias: news, // regresamos también las noticias usadas, para mostrarlas en el frontend
    actualizado: new Date().toISOString(),
    desactualizado: false,
  }

  cache = { data, timestamp: Date.now() }
  return data
}
