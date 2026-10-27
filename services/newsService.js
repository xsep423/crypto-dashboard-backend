import Parser from 'rss-parser'

// Si un feed tarda más de esto, se descarta para no dejar colgada la petición
const parser = new Parser({ timeout: 8000 })

// Feeds públicos y gratuitos de noticias cripto (no requieren API key)
const RSS_FEEDS = [
  { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
  { name: 'Cointelegraph', url: 'https://cointelegraph.com/rss' },
]

/**
 * getLatestNews
 * Descarga en paralelo y combina las noticias más recientes de varios feeds RSS.
 * @param {number} limitPerFeed - Cuántas noticias tomar de cada fuente
 * @returns {Promise<Array>} Lista de noticias { title, source, link, pubDate }
 */
export async function getLatestNews(limitPerFeed = 5) {
  const results = await Promise.allSettled(
    RSS_FEEDS.map((feed) => parser.parseURL(feed.url))
  )

  const allNews = []

  results.forEach((result, i) => {
    const feed = RSS_FEEDS[i]

    if (result.status === 'rejected') {
      // Si un feed falla (ej. está caído), seguimos con los demás en vez de tronar todo
      console.error(`Error al leer feed de ${feed.name}:`, result.reason.message)
      return
    }

    const items = result.value.items.slice(0, limitPerFeed).map((item) => ({
      title: item.title,
      source: feed.name,
      link: item.link,
      pubDate: item.pubDate,
    }))
    allNews.push(...items)
  })

  return allNews
}
