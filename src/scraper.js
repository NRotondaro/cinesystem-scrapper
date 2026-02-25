import { getMoviesWithPrices } from './api.js';

/**
 * Faz scrape da programação do cinema
 * @param {object} options - { date?: string (DD/MM/YYYY), forceRefresh?: boolean }
 * @returns {Promise<{ movies, noSessions, raw, scrapedAt }>}
 */
export async function scrape(options = {}) {
  try {
    const movies = await getMoviesWithPrices(options.date);

    return {
      movies,
      noSessions: !movies || movies.length === 0,
      raw: '',
      scrapedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error('❌ Erro ao fazer scrape:', err.message);
    throw err;
  }
}
