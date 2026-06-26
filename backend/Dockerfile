FROM node:18-bullseye

# Install necessary libraries for WhatsApp Web (Puppeteer/Baileys dependencies if needed)
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV PORT=7860
EXPOSE 7860

CMD ["npm", "start"]
