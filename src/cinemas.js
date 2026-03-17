/**
 * Definições de cinemas em Maceió e gerenciamento de preferência por usuário.
 */

export const CINEMAS = [
  {
    id: '1162',
    name: 'Cinesystem',
    label: 'Cinesystem (Parque Shopping Maceió)',
    url: 'https://www.ingresso.com/cinema/cinesystem-maceio?city=maceio',
  },
  {
    id: '1230',
    name: 'Centerplex',
    label: 'Centerplex (Shopping Pátio Maceió)',
    url: 'https://www.ingresso.com/cinema/centerplex-shopping-patio-maceio?city=maceio',
  },
  {
    id: '924',
    name: 'Kinoplex',
    label: 'Kinoplex (Maceió Shopping)',
    url: 'https://www.ingresso.com/cinema/kinoplex-maceio?city=maceio',
  },
];

const userPreferences = new Map();

export function setUserCinema(chatId, theaterId) {
  userPreferences.set(chatId, theaterId);
}

export function getUserCinema(chatId) {
  const theaterId = userPreferences.get(chatId);
  if (!theaterId) return null;
  return CINEMAS.find((c) => c.id === theaterId) || null;
}

export function findCinemaById(theaterId) {
  return CINEMAS.find((c) => c.id === theaterId) || null;
}
