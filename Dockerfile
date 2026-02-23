# 1. Usamos a imagem oficial da Microsoft que JÁ VEM com o Chrome e as dependências de sistema
FROM mcr.microsoft.com/playwright:v1.49.0-jammy

# 2. Criamos a pasta onde o bot vai morar dentro do servidor
WORKDIR /app

# 3. Copiamos os arquivos de configuração primeiro (para o build ser mais rápido)
COPY package*.json ./

# 4. Instalamos as bibliotecas do seu bot (node-telegram-bot-api, express, etc)
RUN npm install

# 5. Copiamos o resto do seu código (pasta src, etc)
COPY . .

# 6. Definimos que o bot deve rodar o comando que você configurou no package.json
CMD ["npm", "run", "bot:listen"]