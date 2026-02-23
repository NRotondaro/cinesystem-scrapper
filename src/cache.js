/**
 * Sistema de cache para filmes do Cinesystem
 * Armazena resultados de scraping em arquivo JSON
 * Expira automaticamente à meia-noite
 */

import fs from 'fs/promises';
import path from 'path';

class MovieCache {
  constructor() {
    this.cacheFile = 'data/movies-cache.json';
    this.cache = { hoje: null, amanha: null };
  }

  /**
   * Carrega cache do arquivo
   */
  async load() {
    try {
      const data = await fs.readFile(this.cacheFile, 'utf-8');
      this.cache = JSON.parse(data);
    } catch (err) {
      // Arquivo não existe ou é inválido - inicializa vazio
      this.cache = { hoje: null, amanha: null };
    }
  }

  /**
   * Salva cache no arquivo
   */
  async save() {
    try {
      await fs.mkdir('data', { recursive: true });
      await fs.writeFile(
        this.cacheFile,
        JSON.stringify(this.cache, null, 2),
        'utf-8'
      );
    } catch (err) {
      console.error('❌ Erro ao salvar cache:', err.message);
    }
  }

  /**
   * Verifica se o cache expirou (passou de meia-noite)
   * @param {string} expiresAt - data ISO em que o cache expira
   * @returns {boolean} true se expirou
   */
  isExpired(expiresAt) {
    if (!expiresAt) return true;
    const now = new Date();
    const expireDate = new Date(expiresAt);
    return now >= expireDate;
  }

  /**
   * Calcula timestamp de meia-noite (próximas 00:00)
   * @returns {string} data ISO
   */
  getMidnightTimestamp() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    return tomorrow.toISOString();
  }

  /**
   * Retorna filmes de hoje do cache (se válido)
   * @returns {object|null} { movies, scrapedAt } ou null se expirado
   */
  getToday() {
    if (!this.cache.hoje) return null;
    if (this.isExpired(this.cache.hoje.expiresAt)) {
      this.cache.hoje = null;
      return null;
    }
    return {
      movies: this.cache.hoje.movies,
      scrapedAt: this.cache.hoje.scrapedAt,
    };
  }

  /**
   * Retorna filmes de amanhã do cache (se válido)
   * @returns {object|null} { movies, scrapedAt } ou null se expirado
   */
  getAmanha() {
    if (!this.cache.amanha) return null;
    if (this.isExpired(this.cache.amanha.expiresAt)) {
      this.cache.amanha = null;
      return null;
    }
    return {
      movies: this.cache.amanha.movies,
      scrapedAt: this.cache.amanha.scrapedAt,
    };
  }

  /**
   * Salva filmes de hoje no cache
   * @param {array} movies - lista de filmes
   * @param {string} scrapedAt - data ISO de quando foi feito o scrape
   */
  async setToday(movies, scrapedAt) {
    this.cache.hoje = {
      movies,
      scrapedAt,
      expiresAt: this.getMidnightTimestamp(),
    };
    await this.save();
    console.log('💾 Cache de Filmes de Hoje salvo');
  }

  /**
   * Salva filmes de amanhã no cache
   * @param {array} movies - lista de filmes
   * @param {string} scrapedAt - data ISO de quando foi feito o scrape
   */
  async setAmanha(movies, scrapedAt) {
    this.cache.amanha = {
      movies,
      scrapedAt,
      expiresAt: this.getMidnightTimestamp(),
    };
    await this.save();
    console.log('💾 Cache de Filmes de Amanhã salvo');
  }
}

export default MovieCache;
