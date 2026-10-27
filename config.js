import 'dotenv/config'

// Sin la API key no funciona ni el chat ni el sentimiento: mejor fallar al arrancar
if (!process.env.GROQ_API_KEY) {
  console.error('❌ Falta la variable de entorno GROQ_API_KEY. Agrégala al archivo .env')
  process.exit(1)
}

export const config = {
  port: process.env.PORT || 3001,
  isProduction: process.env.NODE_ENV === 'production',
  groqApiKey: process.env.GROQ_API_KEY,
  groqModel: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
  // Orígenes permitidos para CORS, separados por coma (ej. http://localhost:5173,https://mi-front.com)
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  // Cuánto tiempo se reutiliza un análisis de sentimiento antes de pedir uno nuevo
  sentimentCacheMinutes: Number(process.env.SENTIMENT_CACHE_MINUTES) || 10,
}
