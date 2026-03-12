/**
 * Busca notas de filmes:
 * - IMDb e Rotten Tomatoes via OMDb
 * - Fallback via TMDb (quando OMDb não retorna nada)
 *
 * Se nenhuma API estiver configurada ou não houver dados, nada é exibido.
 */

import axios from 'axios';

const OMDb_BASE = 'https://www.omdbapi.com/';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h

const memoryCache = new Map();

function cacheKey(title, year) {
  const t = (title || '').trim().toLowerCase();
  const y = year ? String(year) : '';
  return `${t}|${y}`;
}

/**
 * Extrai nota do Rotten Tomatoes do array Ratings da OMDb.
 * @param {Array} ratings - Array de { Source, Value }
 * @returns {string|null} Ex: "85%" ou null
 */
function extractRottenTomatoes(ratings) {
  if (!Array.isArray(ratings)) return null;
  const rt = ratings.find(
    (r) => r.Source && r.Source.toLowerCase().includes('rotten tomatoes'),
  );
  if (!rt || !rt.Value) return null;
  const value = String(rt.Value).trim();
  if (value === 'N/A') return null;
  return value;
}

async function fetchFromOmdb(title, year) {
  const apiKey = process.env.OMDb_API_KEY;
  if (!apiKey) return null;

  const params = {
    apikey: apiKey,
    t: title,
    type: 'movie',
    r: 'json',
  };
  if (year) params.y = year;

  const { data } = await axios.get(OMDb_BASE, {
    params,
    timeout: 5000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; MaceioCineBot/1.0)',
    },
  });

  if (!data || data.Response === 'False') {
    return null;
  }

  const imdb =
    data.imdbRating && data.imdbRating !== 'N/A'
      ? String(data.imdbRating).trim()
      : null;
  const rottenTomatoes = extractRottenTomatoes(data.Ratings || []);

  return imdb || rottenTomatoes
    ? { imdb: imdb || null, rottenTomatoes: rottenTomatoes || null, tmdb: null }
    : null;
}

async function fetchFromTmdb(title, year) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return null;

  const params = {
    api_key: apiKey,
    query: title,
    include_adult: false,
    language: 'en-US',
  };
  if (year) params.year = year;

  const { data } = await axios.get(`${TMDB_BASE}/search/movie`, {
    params,
    timeout: 5000,
  });

  if (!data || !Array.isArray(data.results) || data.results.length === 0) {
    return null;
  }

  const best = data.results[0];
  if (!best || !best.vote_average) return null;

  const tmdb = Number(best.vote_average).toFixed(1);
  return { imdb: null, rottenTomatoes: null, tmdb };
}

/**
 * Busca nota de um filme usando OMDb (IMDb/RT) e TMDb como fallback.
 *
 * @param {string} title - Título do filme (de preferência o original)
 * @param {number|string|null} [year] - Ano (opcional, melhora a precisão)
 * @returns {Promise<{ imdb: string|null, rottenTomatoes: string|null, tmdb: string|null }|null>}
 */
export async function getMovieRatings(title, year = null) {
  const key = cacheKey(title, year);
  const cached = memoryCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return cached.data;
  }

  let result = null;

  try {
    result = await fetchFromOmdb(title, year);
  } catch (err) {
    console.warn(`⚠️ OMDb: erro ao buscar "${title}":`, err.message);
  }

  // Fallback: se OMDb não trouxe nada, tenta TMDb
  if (!result) {
    try {
      result = await fetchFromTmdb(title, year);
    } catch (err) {
      console.warn(`⚠️ TMDb: erro ao buscar "${title}":`, err.message);
    }
  }

  memoryCache.set(key, { at: Date.now(), data: result || null });
  return result || null;
}

/**
 * Formata linha de notas para exibição no Telegram.
 * @param {{ imdb: string|null, rottenTomatoes: string|null, tmdb: string|null }|null} ratings
 * @returns {string} Ex: "⭐ IMDB 7.5 | 🍅 RT 85% | ⭐ TMDB 7.3" ou ""
 */
export function formatRatingsLine(ratings) {
  if (!ratings) return '';
  const parts = [];
  if (ratings.imdb) parts.push(`⭐ IMDB ${ratings.imdb}`);
  if (ratings.rottenTomatoes) parts.push(`🍅 RT ${ratings.rottenTomatoes}`);
  if (ratings.tmdb) parts.push(`⭐ TMDB ${ratings.tmdb}`);
  if (parts.length === 0) return '';
  return parts.join(' | ') + '\n';
}

export default { getMovieRatings, formatRatingsLine };
