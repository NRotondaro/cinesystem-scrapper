import TelegramBot from 'node-telegram-bot-api';
import { config } from 'dotenv';

config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

if (!token || !chatId) {
  throw new Error(
    'TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID não configurados no .env',
  );
}

class TelegramSender {
  constructor() {
    this.bot = new TelegramBot(token);
    this.chatId = chatId;
    this.maxMessageLength = 4096;
  }

  formatDate(dateString) {
    const meses = [
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

    const [year, month, day] = dateString.split('-');
    const monthIndex = parseInt(month) - 1;
    return `${parseInt(day)} de ${meses[monthIndex]} de ${year}`;
  }

  formatTime(date = new Date()) {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    const meses = [
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

    const monthName = meses[date.getMonth()];
    return `${day} de ${monthName} de ${year} às ${hours}:${minutes}`;
  }

  formatProgramacao(filmes, dateStr) {
    let message = '*🎬 PROGRAMAÇÃO - CINESYSTEM MACEIÓ*\n';
    message += `📅 Data: ${this.formatDate(dateStr)}\n\n`;

    filmes.forEach((filme) => {
      message += `*🎭 ${filme.name}*\n`;

      if (filme.sessions && filme.sessions.length > 0) {
        filme.sessions.forEach((session) => {
          const time = session.time;
          let priceInfo = '';

          if (session.gratuito) {
            priceInfo = 'Gratuito ✨';
          } else if (session.priceInteira && session.priceMeia) {
            const inteira = session.priceInteira.toFixed(2).replace('.', ',');
            const meia = session.priceMeia.toFixed(2).replace('.', ',');
            priceInfo = `💰 R$ ${inteira} (inteira) / R$ ${meia} (meia)`;
          } else {
            priceInfo = '(preço não disponível)';
          }

          message += `   ${time} - ${priceInfo}\n`;
        });
      }

      message += '\n';
    });

    const scrapedAt = this.formatTime();
    message += `✅ _Scrape realizado em: ${scrapedAt}_`;

    return message;
  }

  async sendProgramacao(filmes, dateStr) {
    try {
      const message = this.formatProgramacao(filmes, dateStr);

      // Se a mensagem for muito grande, dividir em múltiplas mensagens
      const messages = this.splitMessage(message);

      for (const msg of messages) {
        await this.bot.sendMessage(this.chatId, msg, {
          parse_mode: 'Markdown',
        });
      }

      console.log(`✅ Mensagem(ns) enviada(s) para Telegram com sucesso!`);
      return true;
    } catch (error) {
      console.error('❌ Erro ao enviar para Telegram:', error.message);
      throw error;
    }
  }

  splitMessage(message) {
    if (message.length <= this.maxMessageLength) {
      return [message];
    }

    const messages = [];
    let currentMessage = '';

    const lines = message.split('\n');

    for (const line of lines) {
      if ((currentMessage + line + '\n').length > this.maxMessageLength) {
        if (currentMessage) {
          messages.push(currentMessage.trim());
          currentMessage = '';
        }
      }
      currentMessage += line + '\n';
    }

    if (currentMessage) {
      messages.push(currentMessage.trim());
    }

    return messages;
  }
}

export default TelegramSender;
