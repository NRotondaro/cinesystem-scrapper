/**
 * Formatação de mensagens Telegram para filmes e lançamentos.
 */

import { getMovieRatings, formatRatingsLine } from './ratings.js';

const MESES = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

const FORMAT_LABELS = { '2D': '2D', Cinépic: 'Cinépic', VIP: 'VIP', '3D': '3D' };
const FORMAT_ICONS = { '2D': '🎞', Cinépic: '🖥', VIP: '⭐' };

export function getMaceioTodayStr() {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Maceio' }));
  return now.toISOString().split('T')[0];
}

export function formatDatePt(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return 'data não disponível';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return 'data não disponível';
  const monthIdx = parseInt(month, 10) - 1;
  return `${parseInt(day, 10)} de ${MESES[monthIdx]} de ${year}`;
}

function formatPriceTag(ref) {
  if (ref?.gratuito) return ' — Gratuito ✨';
  if (ref?.priceInteira) return ` — R$ ${ref.priceInteira.toFixed(2).replace('.', ',')}`;
  return '';
}

export function formatContentRating(rawRating) {
  if (!rawRating) return null;
  const normalized = String(rawRating).trim().toLowerCase();
  if (!normalized || normalized === 'l' || normalized === 'livre') return '🟢 Livre';
  if (normalized.startsWith('10')) return '🟡 10 anos';
  if (normalized.startsWith('12')) return '🟡 12 anos';
  if (normalized.startsWith('14')) return '🟠 14 anos';
  if (normalized.startsWith('16')) return '🔴 16 anos';
  if (normalized.startsWith('18')) return '🔴 18 anos';
  return `🔹 ${rawRating}`;
}

function formatSessionsBlock(filme) {
  if (!filme.sessions || filme.sessions.length === 0) return '';
  const byFormat = new Map();
  for (const s of filme.sessions) {
    const key = s.format || '2D';
    if (!byFormat.has(key)) byFormat.set(key, []);
    byFormat.get(key).push(s);
  }
  let block = '   🕒 Sessões (preços para ingresso inteira):\n';
  for (const [format, sessions] of byFormat) {
    const icon = FORMAT_ICONS[format] || '🎬';
    const times = sessions.map((s) => s.time).join(', ');
    const ref = sessions.find((s) => s.priceInteira);
    block += `   ${icon} *${format}:* ${times}${formatPriceTag(ref)}\n`;
  }
  return block;
}

function formatWhen(diffDays, item) {
  if (diffDays === 1) return `amanhã (${item.firstDateFormatted})`;
  if (diffDays <= 7) return `nesta *${item.firstDateDayOfWeek}* (${item.firstDateFormatted})`;
  return `em ${item.firstDateFormatted} (${item.firstDateDayOfWeek})`;
}

export async function formatSingleMovieCard(filme, cinemaLabel, dateStr) {
  let text = `*🎬 PROGRAMAÇÃO*\n📍 ${cinemaLabel}\n📅 ${formatDatePt(dateStr)}\n\n`;
  text += `*${filme.name}*\n`;

  const genres =
    Array.isArray(filme.genres) && filme.genres.length ? filme.genres.join(', ') : null;
  const contentRating = formatContentRating(filme.contentRating);
  if (genres || contentRating) {
    let infoLine = '   ';
    if (contentRating) infoLine += `🎟 Classificação etária: ${contentRating}`;
    if (genres) infoLine += contentRating ? ` — _${genres}_` : `_${genres}_`;
    text += `${infoLine}\n`;
  }

  const ratings = await getMovieRatings(filme.originalTitle || filme.name);
  const ratingsLine = formatRatingsLine(ratings);
  if (ratingsLine) text += ratingsLine;
  text += formatSessionsBlock(filme);
  return text;
}

export async function formatSingleUpcomingCard(item, cinemaLabel) {
  const todayStr = getMaceioTodayStr();
  const diffDays = Math.ceil((new Date(item.firstDate) - new Date(todayStr)) / 86400000);
  const quando = formatWhen(diffDays, item);

  let text = `*🆕 PRÓXIMOS LANÇAMENTOS*\n📍 ${cinemaLabel}\n\n`;
  text += `🎬 *${item.title}*${item.inPreSale ? ' 🔥 PRÉ-VENDA' : ''}\n`;

  const ratings = await getMovieRatings(item.originalTitle || item.title);
  const ratingsLine = formatRatingsLine(ratings);
  if (ratingsLine) text += `   ${ratingsLine.trim()}\n`;

  text += `   📅 Estreia ${quando}\n`;
  if (item.genres?.length) text += `   _${item.genres.join(', ')}_\n`;
  if (item.formats?.length) {
    text += `   ${item.formats.map((f) => FORMAT_LABELS[f] || f).join(', ')}\n`;
  }
  if (item.priceFrom != null) {
    text += `   A partir de R$ ${item.priceFrom.toFixed(2).replace('.', ',')}\n`;
  }
  return text;
}
