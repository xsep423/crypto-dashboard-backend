import Groq from 'groq-sdk'
import { config } from '../config.js'

// Cliente compartido por el chat y el análisis de sentimiento
export const groq = new Groq({ apiKey: config.groqApiKey })
