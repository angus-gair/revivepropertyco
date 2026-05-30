FROM node:20-slim

RUN apt-get update && apt-get install -y \
    xvfb fonts-liberation fonts-noto-color-emoji libxss1 libasound2 \
    libatk-bridge2.0-0 libatk1.0-0 libatspi2.0-0 libcups2 libdbus-1-3 \
    libdrm2 libgbm1 libgtk-3-0 libnspr4 libnss3 libwayland-client0 \
    libxcomposite1 libxdamage1 libxfixes3 libxkbcommon0 libxrandr2 xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
RUN useradd -m scraper && mkdir -p /app/output
COPY package*.json ./
RUN npm install --production && chown -R scraper:scraper /app
COPY src/ ./src/
USER scraper
RUN npx playwright install chromium
USER root
RUN chown -R scraper:scraper /app
USER scraper
VOLUME ["/app/output"]
ENV HEADLESS=true
ENV NODE_ENV=production
CMD ["node", "src/scheduler.js"]
