#!/usr/bin/env node

/**
 * Bot Telegram Reativo - Modo Polling
 * Escuta comandos e responde dinamicamente
 * Uso: npm run bot:listen
 */

import TelegramBot from 'node-telegram-bot-api';
import { config } from 'dotenv';

config();

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN não configurado no .env');
}

const bot = new TelegramBot(token, { polling: true });

// URL de imagem placeholder
const MAIN_IMAGE_URL =
  'https://imgs.search.brave.com/RR3QyRyk8txiCmdUFGV3jlLc6hEyUR29hg2Gyb_m5iw/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9wb3J0/YWxob3J0b2xhbmRp/YS5jb20uYnIvd3At/Y29udGVudC91cGxv/YWRzLzIwMjUvMDMv/Y2luZXN5c3RlbS1o/b3J0b2xhbmRpYS0z/NTB4MjUwLmpwZw';

// Construir inline keyboard
const getMainKeyboard = () => {
  return {
    inline_keyboard: [
      [
        { text: '🎬 Filmes de Hoje', callback_data: 'filmes_hoje' },
        { text: '📅 Filmes de Amanhã', callback_data: 'filmes_amanha' },
      ],
      [
        {
          text: '⭐ Lançamentos da Semana',
          callback_data: 'lancamentos_semana',
        },
      ],
      [{ text: '❓ Como Funciona', callback_data: 'como_funciona' }],
    ],
  };
};

// Definir menu de comandos
const setCommands = async () => {
  try {
    await bot.setMyCommands([
      { command: 'start', description: 'Iniciar e testar o bot' },
    ]);
    console.log('✅ Menu de comandos configurado');
  } catch (err) {
    console.error('❌ Erro ao configurar menu de comandos:', err.message);
  }
};

// Handler para /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  const caption = `*🎬 Bem-vindo ao Cinesystem Bot!*

Aqui você encontra a programação dos filmes em cartaz no Cinesystem Maceió.

Escolha uma opção abaixo para começar:`;

  try {
    await bot.sendPhoto(chatId, MAIN_IMAGE_URL, {
      caption,
      parse_mode: 'Markdown',
      reply_markup: getMainKeyboard(),
    });
    console.log(
      `✅ Mensagem /start com keyboard enviada para: ${msg.from.username || chatId}`,
    );
  } catch (err) {
    console.error(`❌ Erro ao responder /start para ${chatId}:`, err.message);
  }
});

// Handler para cliques nos botões (callback_query)
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const callbackData = query.data;
  const queryId = query.id;

  // Responder ao clique (remove "loading" do botão)
  try {
    await bot.answerCallbackQuery(queryId);
  } catch (err) {
    console.error('❌ Erro ao responder callback:', err.message);
  }

  // Processar cada opção
  let response = '';
  switch (callbackData) {
    case 'filmes_hoje':
      response =
        '🎬 *Filmes de Hoje*\n\nEm breve! Esta funcionalidade será implementada.';
      break;
    case 'filmes_amanha':
      response =
        '📅 *Filmes de Amanhã*\n\nEm breve! Esta funcionalidade será implementada.';
      break;
    case 'lancamentos_semana':
      response =
        '⭐ *Lançamentos da Semana*\n\nEm breve! Esta funcionalidade será implementada.';
      break;
    case 'como_funciona':
      response =
        '❓ *Como Funciona*\n\nEste bot provides informações sobre os filmes em cartaz no Cinesystem Maceió. Use os botões acima para navegar!';
      break;
    default:
      response = '❓ Opção não reconhecida.';
  }

  try {
    await bot.sendMessage(chatId, response, {
      parse_mode: 'Markdown',
    });
    console.log(
      `✅ Resposta enviada para callback: ${callbackData} de ${query.from.username || chatId}`,
    );
  } catch (err) {
    console.error(`❌ Erro ao responder callback para ${chatId}:`, err.message);
  }
});

// Handler para mensagens de texto genéricas
bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  // Ignora mensagens que já foram processadas por outros handlers
  if (msg.text && msg.text.startsWith('/')) {
    return;
  }

  // Exibir em log que recebeu mensagem
  if (msg.text) {
    console.log(
      `📨 Mensagem recebida de ${msg.from.username || chatId}: "${msg.text}"`,
    );
  }
});

// Handler de erro
bot.on('polling_error', (err) => {
  console.error('❌ Erro de polling:', err.message);
});

// Inicializar
(async () => {
  await setCommands();
  console.log('🚀 Bot iniciado em modo polling...');
  console.log('Aguardando mensagens. Envie /start ou outros comandos.');
})();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Desligando bot...');
  bot.stopPolling();
  process.exit(0);
});
