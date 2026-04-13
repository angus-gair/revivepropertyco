FROM node:20-slim

# Install system dependencies for Playwright
RUN apt-get update && apt-get install -y \
    xvfb \
    fonts-liberation \
    fonts-noto-color-emoji \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    libxss1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Create non-root user first
RUN useradd -m scraper && \
    mkdir -p /app/output

# Copy package files
COPY package*.json ./

# Install dependencies as root but change ownership
RUN npm install --production && \
    chown -R scraper:scraper /app

# Copy source files
COPY src/ ./src/

# Switch to scraper user for Playwright install
USER scraper

# Install Playwright Chromium as scraper user
# Note: We skip install-deps since we installed system packages manually earlier
RUN npx playwright install chromium

# Switch back to root for final setup
USER root

# Ensure proper permissions
RUN chown -R scraper:scraper /app

# Final user
USER scraper

VOLUME ["/app/output"]

ENV HEADLESS=true
ENV NODE_ENV=production

# Run the scheduler which triggers periodic scrapes
CMD ["node", "src/scheduler.js"]
