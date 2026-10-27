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
```

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
| GET    | `/api/news-test`  | Endpoint de prueba que devuelve las noticias obtenidas del RSS     |

### `GET /api/sentiment`

```json
{
  "sentimiento": "positivo",
  "confianza": 72,
  "resumen": "Explicación breve del sentimiento general.",
  "noticias": [
    { "title": "...", "source": "CoinDesk", "link": "https://...", "pubDate": "..." }
  ]
}
```

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

El asistente responde en español, de forma breve, y no da consejos financieros.

## Estructura

```
├── index.js                  # Servidor Express y definición de endpoints
├── services/
│   ├── newsService.js        # Lectura de feeds RSS
│   ├── sentimentService.js   # Análisis de sentimiento con Groq
│   └── chatService.js        # Asistente conversacional con Groq
├── Procfile                  # Comando de arranque para Elastic Beanstalk
└── package.json
```

## Despliegue

El proyecto está configurado para AWS Elastic Beanstalk (Node.js en Amazon Linux 2023, región `us-east-1`). Con la [EB CLI](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/eb-cli3.html) instalada:

```bash
eb deploy
```

Recuerda configurar `GROQ_API_KEY` como variable de entorno en el entorno de Elastic Beanstalk.
