# Node.js 20 lightweight image (without Playwright/Chromium)
FROM node:20-slim

# Create app directory
WORKDIR /app

# Copy package files first (for faster builds)
COPY package*.json ./

# Install dependencies (no Playwright browser download needed)
RUN npm ci

# Copy the rest of the code
COPY . .

# Run the bot
CMD ["npm", "run", "bot:listen"]
