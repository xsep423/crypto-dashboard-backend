# CryptoDashboard IA — Backend

API en Node.js + Express que da servicio al frontend [crypto-dashboard-ia](https://github.com/xsep423/crypto-dashboard-ia). Obtiene noticias cripto de feeds RSS, analiza el sentimiento del mercado con IA y ofrece un asistente conversacional, ambos usando [Groq](https://groq.com).

## Tecnologías

- Node.js (ES Modules) + Express 5
- [groq-sdk](https://www.npmjs.com/package/groq-sdk) — modelo `openai/gpt-oss-20b`
- [rss-parser](https://www.npmjs.com/package/rss-parser) — noticias de CoinDesk y Cointelegraph
- AWS Elastic Beanstalk para el despliegue

## Requisitos

- Node.js 18 o superior
- Una API key de Groq ([console.groq.com](https://console.groq.com/keys))

## Instalación

```bash
git clone https://github.com/xsep423/crypto-dashboard-backend.git
cd crypto-dashboard-backend
npm install
```

Crea un archivo `.env` en la raíz:

```env
GROQ_API_KEY=tu_api_key_de_groq
PORT=3001
ALLOWED_ORIGINS=http://localhost:5173
```

| Variable                  | Obligatoria | Descripción                                                                 |
|---------------------------|-------------|-----------------------------------------------------------------------------|
| `GROQ_API_KEY`            | Sí          | API key de Groq. El servidor no arranca sin ella                            |
| `PORT`                    | No          | Puerto del servidor (por defecto `3001`)                                    |
| `ALLOWED_ORIGINS`         | Recomendada | Orígenes permitidos por CORS, separados por coma. Si se omite, se acepta cualquiera |
| `NODE_ENV`                | No          | Con `production` se desactiva `/api/news-test`                              |
| `GROQ_MODEL`              | No          | Modelo de Groq (por defecto `openai/gpt-oss-20b`)                           |
| `SENTIMENT_CACHE_MINUTES` | No          | Minutos que se reutiliza el análisis de sentimiento (por defecto `10`)      |

## Uso

```bash
npm run dev    # desarrollo, se reinicia al guardar cambios
npm start      # producción
```

El servidor queda disponible en `http://localhost:3001`.

## Endpoints

| Método | Ruta              | Descripción                                                        |
|--------|-------------------|--------------------------------------------------------------------|
| GET    | `/api/health`     | Verifica que el servidor esté funcionando                          |
| GET    | `/api/sentiment`  | Noticias recientes + análisis de sentimiento del mercado con IA    |
| POST   | `/api/chat`       | Respuesta del asistente virtual a partir del historial de mensajes |
| GET    | `/api/news-test`  | Noticias obtenidas del RSS (solo en desarrollo)                    |

Límites por IP: 20 peticiones por minuto en `/api/chat` y 30 en `/api/sentiment`. Al superarlos se responde con `429`.

### `GET /api/sentiment`

```json
{
  "sentimiento": "positivo",
  "confianza": 72,
  "resumen": "Explicación breve del sentimiento general.",
  "noticias": [
    { "title": "...", "source": "CoinDesk", "link": "https://...", "pubDate": "..." }
  ],
  "actualizado": "2026-10-27T22:00:00.000Z",
  "desactualizado": false
}
```

El resultado se guarda en caché durante `SENTIMENT_CACHE_MINUTES`. Si Groq o los feeds fallan, se devuelve el último análisis guardado con `"desactualizado": true`.

### `POST /api/chat`

Cuerpo de la petición:

```json
{
  "messages": [
    { "role": "user", "content": "¿Qué es Bitcoin?" }
  ]
}
```

Respuesta:

```json
{ "respuesta": "Bitcoin es una criptomoneda descentralizada..." }
```

Solo se aceptan los roles `user` y `assistant`, con un máximo de 2000 caracteres por mensaje. Se envían a Groq los últimos 20 mensajes. El asistente responde en español, de forma breve, y no da consejos financieros.

## Estructura

```
├── index.js                       # Servidor Express, CORS, límites y endpoints
├── config.js                      # Lectura y validación de variables de entorno
├── services/
│   ├── groqClient.js              # Cliente de Groq compartido
│   ├── newsService.js             # Lectura de feeds RSS en paralelo
│   ├── sentimentService.js        # Análisis de sentimiento con Groq
│   ├── marketSentimentService.js  # Caché y respaldo del análisis de sentimiento
│   └── chatService.js             # Validación y asistente conversacional con Groq
├── Procfile                  # Comando de arranque para Elastic Beanstalk
└── package.json
```

## Despliegue

El proyecto está configurado para AWS Elastic Beanstalk (Node.js en Amazon Linux 2023, región `us-east-1`). Con la [EB CLI](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3.html) instalada:

```bash
eb deploy
```

Configura las variables de entorno en Elastic Beanstalk antes de desplegar:

```bash
eb setenv GROQ_API_KEY=tu_api_key NODE_ENV=production ALLOWED_ORIGINS=https://url-de-tu-frontend
```
