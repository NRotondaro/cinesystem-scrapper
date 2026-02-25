import axios from 'axios';
import { normalizeSessionsResponse } from './normalize.js';

const BASE_URL = 'https://api-content.ingresso.com';
const CITY_ID = 53; // Maceió
const THEATER_ID = 1162; // Cinesystem Maceió

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Encoding': 'gzip, deflate, br',
  'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8',
};

function getTodayInMaceioISO() {
  return new Date().toLocaleString('en-CA', {
    timeZone: 'America/Maceio',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Resolve a data alvo:
 * - Se informada (YYYY-MM-DD), usa diretamente
 * - Caso contrário, busca a data "hoje" via API do cinema
 * - Se falhar, usa a data local de Maceió
 */
async function resolveTargetDate(date) {
  if (date) return date;

  try {
    console.log('📅 Buscando datas disponíveis na API...');
    const { data: response } = await axios.get(
      `${BASE_URL}/v0/sessions/city/${CITY_ID}/theater/${THEATER_ID}/dates/partnership/home`,
      { headers: HEADERS },
    );

    const dates = Array.isArray(response)
      ? response
      : Array.isArray(response?.dates) ? response.dates : [];

    if (dates.length === 0) {
      console.warn('⚠️ Nenhuma data disponível, usando hoje em Maceió.');
      return getTodayInMaceioISO();
    }

    const todayEntry = dates.find((d) => d.isToday || d.today) || dates[0];
    const apiDate = todayEntry.date || todayEntry;
    console.log(`📅 Data alvo da API: ${apiDate}`);
    return apiDate;
  } catch (err) {
    console.warn(`⚠️ Fallback para data local: ${err.message}`);
    return getTodayInMaceioISO();
  }
}

/**
 * Busca sessões de um cinema para uma data e retorna dados normalizados.
 *
 * @param {string|null} date - Data YYYY-MM-DD (null = hoje)
 * @returns {Promise<{ movies, sessions, date, fetchedAt }>} Dados normalizados
 */
export async function fetchNormalized(date = null) {
  const targetDate = await resolveTargetDate(date);

  console.log(`🎬 Buscando sessões para ${targetDate}...`);
  const { data: response } = await axios.get(
    `${BASE_URL}/v0/sessions/city/${CITY_ID}/theater/${THEATER_ID}/partnership/home/groupBy/sessionType`,
    { params: { date: targetDate }, headers: HEADERS },
  );

  const normalized = normalizeSessionsResponse(response);
  normalized.date = targetDate;

  console.log(
    `✅ ${Object.keys(normalized.movies).length} filmes, ${normalized.sessions.length} sessões`,
  );

  return normalized;
}

export default { fetchNormalized };
