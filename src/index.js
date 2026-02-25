#!/usr/bin/env node

/**
 * CLI para scraping de programação do Cinesystem Maceió.
 * Uso:
 *   node src/index.js scrape [data]        → extrai filmes + sessões (API)
 *   node src/index.js scrape prices [data] → extrai filmes + sessões + preços
 *   node src/index.js telegram [data]      → extrai + envia para Telegram
 *
 * Exemplos:
 *   node src/index.js scrape                    → hoje, sem preços (0.1s)
 *   node src/index.js scrape prices            → hoje, com preços (68s)
 *   node src/index.js scrape 23/02/2026         → data específica, sem preços
 *   node src/index.js scrape prices 23/02/2026 → data específica, com preços
 *   node src/index.js telegram                  → hoje, envia via Telegram
 *   node src/index.js telegram 23/02/2026       → data específica, envia via Telegram
 */

import { scrape } from './scraper.js';
import TelegramSender from './telegram.js';
import fs from 'fs/promises';

const command = process.argv[2];
const subArg = process.argv[3];

async function saveState(data) {
  const stateFile = 'data/state.json';
  await fs.mkdir('data', { recursive: true });
  await fs.writeFile(stateFile, JSON.stringify(data, null, 2));
}

async function main() {
  if (!command || command === 'scrape') {
    const withPrices = subArg === 'prices';
    const date = withPrices ? process.argv[4] : subArg;

    console.log('Extraindo programação...');
    if (withPrices) console.log('(com extração de preços)');

    const result = await scrape({
      headless: true,
      date,
      extractPrices: withPrices,
    });

    if (date && !withPrices) {
      console.log(`Programação para: ${date}`);
    }

    await saveState({ movies: result.movies, scrapedAt: result.scrapedAt });
    console.log('Salvo em data/state.json');
    console.log('Filmes:', result.movies.length);

    if (result.noSessions) {
      console.log('(Página indicou: sem sessões no momento)');
    }

    result.movies.forEach((m) => {
      const sessionsList = m.sessions
        .map((s) => {
          if (typeof s === 'string') return s;
          let str = s.time || '';
          if (s.priceInteira !== undefined) {
            str += ` (R$ ${s.priceInteira.toFixed(2)})`;
          }
          if (s.priceMeia !== undefined) {
            str += ` / meia: R$ ${s.priceMeia.toFixed(2)}`;
          }
          return str;
        })
        .join(', ');
      console.log(`  - ${m.name}: ${m.sessions.length} sessão(ões)`);
      console.log(`    ${sessionsList}`);
    });
    return;
  }

  if (command === 'telegram') {
    const withPrices = subArg === 'prices';

    console.log('Extraindo programação...');
    if (withPrices) console.log('(com extração de preços)');

    const result = await scrape({
      headless: true,
      extractPrices: withPrices,
    });

    try {
      const sender = new TelegramSender();
      await sender.sendProgramacao(result.movies, result.scrapedAt);
      console.log('✅ Mensagem enviada para Telegram');
    } catch (err) {
      console.error('❌ Erro ao enviar para Telegram:', err.message);
    }
    return;
  }

  console.error(`Comando desconhecido: ${command}`);
  console.error('Use: node src/index.js scrape [prices] [data]');
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
