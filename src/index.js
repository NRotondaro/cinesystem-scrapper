#!/usr/bin/env node

/**
 * CLI para scraping de programação do Cinesystem Maceió.
 * Uso:
 *   node src/index.js scrape [data]  → extrai filmes + sessões + preços
 *
 * Exemplos:
 *   node src/index.js scrape                  → hoje
 *   node src/index.js scrape 23/02/2026       → data específica
 */

import { scrape } from './scraper.js';
import fs from 'fs/promises';

const command = process.argv[2];

async function saveState(data) {
  const stateFile = 'data/state.json';
  await fs.mkdir('data', { recursive: true });
  await fs.writeFile(stateFile, JSON.stringify(data, null, 2));
}

async function main() {
  if (!command || command === 'scrape') {
    const date = process.argv[3];

    console.log('Extraindo programação...');
    if (date) console.log(`📅 Data: ${date}`);

    const result = await scrape({
      date,
    });

    await saveState({ movies: result.movies, scrapedAt: result.scrapedAt });
    console.log('✅ Salvo em data/state.json');
    console.log(`📽️  Filmes: ${result.movies.length}`);

    if (result.noSessions) {
      console.log('⚠️  Nenhuma sessão encontrada para esta data');
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
      console.log(`  🎬 ${m.name}: ${m.sessions.length} sessão(ões)`);
      console.log(`     ${sessionsList}`);
    });
    return;
  }

  console.error(`❌ Comando desconhecido: ${command}`);
  console.error('Use: node src/index.js scrape [data]');
  process.exit(1);
}

main().catch((err) => {
  console.error('❌ Erro:', err.message);
  process.exit(2);
});
