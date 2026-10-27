import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { getLatestNews } from './services/newsService.js'
import { analyzeSentiment } from './services/sentimentService.js'
import { getChatResponse } from './services/chatService.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors()) // permite peticiones desde el frontend (localhost:5173)
app.use(express.json())

// Endpoint de salud — para verificar que el servidor está vivo
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend funcionando correctamente' })
})

// Endpoint temporal de prueba — solo para verificar que el RSS funciona
app.get('/api/news-test', async (req, res) => {
  try {
    const news = await getLatestNews(5)
    res.json({ count: news.length, news })
  } catch (err) {
    console.error('Error en /api/news-test:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// Endpoint principal: noticias + análisis de sentimiento con IA
app.get('/api/sentiment', async (req, res) => {
  try {
    const news = await getLatestNews(5)

    if (news.length === 0) {
      return res.status(502).json({ error: 'No se pudieron obtener noticias de ningún feed' })
    }

    const analysis = await analyzeSentiment(news)

    res.json({
      ...analysis,
      noticias: news, // regresamos también las noticias usadas, para mostrarlas en el frontend
    })
  } catch (err) {
    console.error('Error en /api/sentiment:', err.message)
    res.status(500).json({ error: 'Error al analizar el sentimiento del mercado' })
  }
})

// Endpoint de chat — recibe el historial de mensajes y regresa la respuesta del asistente
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Se requiere un arreglo de mensajes' })
    }

    const respuesta = await getChatResponse(messages)
    res.json({ respuesta })
  } catch (err) {
    console.error('Error en /api/chat:', err.message)
    res.status(500).json({ error: 'Error al generar la respuesta del asistente' })
  }
})

app.listen(PORT, () => {
  console.log(`✅ Backend corriendo en http://localhost:${PORT}`)
})