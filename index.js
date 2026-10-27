import { config } from './config.js'
import express from 'express'
import cors from 'cors'
import rateLimit from 'express-rate-limit'
import { getLatestNews } from './services/newsService.js'
import { getMarketSentiment } from './services/marketSentimentService.js'
import { getChatResponse, validateMessages } from './services/chatService.js'

const app = express()

// En Elastic Beanstalk hay un balanceador delante: sin esto todas las IPs parecerían la misma
app.set('trust proxy', 1)

// CORS: solo el frontend puede llamar al backend desde el navegador
if (config.allowedOrigins.length > 0) {
  app.use(cors({ origin: config.allowedOrigins }))
} else {
  console.warn('⚠️ ALLOWED_ORIGINS no está configurado: se aceptan peticiones de cualquier origen')
  app.use(cors())
}

app.use(express.json({ limit: '100kb' }))

// Límites de peticiones por IP para proteger la cuota de Groq
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiados mensajes. Espera un momento e inténtalo de nuevo.' },
})

const sentimentLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones. Espera un momento e inténtalo de nuevo.' },
})

// Endpoint de salud — para verificar que el servidor está vivo
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend funcionando correctamente' })
})

// Endpoint de prueba — solo en desarrollo, para verificar que el RSS funciona
if (!config.isProduction) {
  app.get('/api/news-test', async (req, res) => {
    try {
      const news = await getLatestNews(5)
      res.json({ count: news.length, news })
    } catch (err) {
      console.error('Error en /api/news-test:', err.message)
      res.status(500).json({ error: err.message })
    }
  })
}

// Endpoint principal: noticias + análisis de sentimiento con IA (con caché)
app.get('/api/sentiment', sentimentLimiter, async (req, res) => {
  try {
    const result = await getMarketSentiment()
    res.json(result)
  } catch (err) {
    console.error('Error en /api/sentiment:', err.message)
    res.status(502).json({ error: 'Error al analizar el sentimiento del mercado' })
  }
})

// Endpoint de chat — recibe el historial de mensajes y regresa la respuesta del asistente
app.post('/api/chat', chatLimiter, async (req, res) => {
  const { messages } = req.body ?? {}

  const validationError = validateMessages(messages)
  if (validationError) {
    return res.status(400).json({ error: validationError })
  }

  try {
    const respuesta = await getChatResponse(messages)
    res.json({ respuesta })
  } catch (err) {
    console.error('Error en /api/chat:', err.message)
    res.status(500).json({ error: 'Error al generar la respuesta del asistente' })
  }
})

app.listen(config.port, () => {
  console.log(`✅ Backend corriendo en http://localhost:${config.port}`)
})
