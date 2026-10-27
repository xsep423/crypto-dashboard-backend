import Parser from 'rss-parser'

const parser = new Parser()

// Feeds públicos y gratuitos de noticias cripto (no requieren API key)
const RSS_FEEDS = [
  { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
  { name: 'Cointelegraph', url: 'https://cointelegraph.com/rss' },
]

/**
 * getLatestNews
 * Descarga y combina las noticias más recientes de varios feeds RSS.
 * @param {number} limitPerFeed - Cuántas noticias tomar de cada fuente
 * @returns {Promise<Array>} Lista de noticias { title, source, link, pubDate }
 */
export async function getLatestNews(limitPerFeed = 5) {
  const allNews = []

  for (const feed of RSS_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url)
      const items = parsed.items.slice(0, limitPerFeed).map((item) => ({
        title: item.title,
        source: feed.name,
        link: item.link,
        pubDate: item.pubDate,
      }))
      allNews.push(...items)
    } catch (err) {
      // Si un feed falla (ej. está caído), seguimos con los demás en vez de tronar todo
      console.error(`Error al leer feed de ${feed.name}:`, err.message)
    }
  }

  return allNews
}