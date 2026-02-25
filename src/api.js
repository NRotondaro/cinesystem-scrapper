import axios from 'axios';

const BASE_URL = 'https://api-content.ingresso.com';
const CITY_ID = 53; // Maceió
const THEATER_ID = 1162; // Cinesystem Maceió

/**
 * Formato de data para API: YYYY-MM-DD
 * @param {string} date - Formato: DD/MM/YYYY
 * @returns {string} - Formato: YYYY-MM-DD
 */
function formatDateToAPI(date) {
  if (!date) return null;
  const [day, month, year] = date.split('/');
  return `${year}-${month}-${day}`;
}

/**
 * Busca filmes com preços da API de eventos e sessões
 * @param {string|null} date - Data no formato DD/MM/YYYY (opcional, padrão: hoje)
 * @returns {Promise<Array>} - Array de filmes com sessões e preços
 */
export async function getMoviesWithPrices(date = null) {
  try {
    const headers = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/json, text/plain, */*',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
    };

    // 1. Busca eventos do cinema
    console.log('🎬 Buscando eventos...');
    const eventsResponse = await axios.get(
      `${BASE_URL}/v0/sessions/city/${CITY_ID}/theater/${THEATER_ID}`,
      { headers },
    );

    if (!Array.isArray(eventsResponse.data)) {
      throw new Error('Invalid API response: expected array of events');
    }

    // Determine target date
    const targetDate = date
      ? formatDateToAPI(date)
      : new Date().toISOString().split('T')[0];

    console.log(`📅 Data alvo: ${targetDate}`);
    console.log(`📽️  ${eventsResponse.data.length} eventos encontrados`);

    // 2. Para cada evento, busca sessões com preços
    const movieMap = new Map();
    let sessionCount = 0;

    for (const event of eventsResponse.data) {
      try {
        const sessionsResponse = await axios.get(
          `${BASE_URL}/v0/sessions/city/${CITY_ID}/event/${event.id}/partnership/home/groupBy/sessionType`,
          {
            params: { date: targetDate },
            headers,
          },
        );

        // Filtra apenas cinema_id === 1162
        const sessions = sessionsResponse.data.sessions || [];

        for (const sessionGroup of sessions) {
          if (sessionGroup.cinemaId !== THEATER_ID) continue;

          const movieKey = event.title.toLowerCase().trim();
          if (!movieMap.has(movieKey)) {
            movieMap.set(movieKey, {
              name: event.title,
              sessions: [],
            });
          }

          const movieEntry = movieMap.get(movieKey);
          for (const session of sessionGroup.sessions || []) {
            movieEntry.sessions.push({
              time: session.time,
              sessionId: session.id,
              priceInteira: session.price?.fullPrice,
              priceMeia: session.price?.halfPrice,
              gratuito: !session.price?.fullPrice,
            });
            sessionCount++;
          }
        }
      } catch (err) {
        // Se um evento falhar, continua com o próximo
        console.warn(
          `⚠️  Erro ao buscar sessões para evento ${event.id}: ${err.message}`,
        );
      }
    }

    const movies = Array.from(movieMap.values());
    console.log(
      `✅ ${movies.length} filmes, ${sessionCount} sessões encontradas`,
    );

    return movies;
  } catch (err) {
    console.error('❌ Erro ao buscar filmes com preços:', err.message);
    throw err;
  }
}

export default { getMoviesWithPrices };
