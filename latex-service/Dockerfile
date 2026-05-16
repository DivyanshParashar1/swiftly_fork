# Multi-arch compatible (AMD64 + ARM64 / Apple Silicon)
# Node 20 on Debian Bookworm slim — then install only the TeX packages we need
FROM node:20-bookworm-slim

# Install texlive packages required for our resume templates:
#   texlive-latex-base       → pdflatex, core packages (geometry, inputenc, fontenc, parskip)
#   texlive-latex-extra      → titlesec, enumitem, microtype, tabularx, array, xcolor, hyperref
#   texlive-fonts-recommended → standard fonts (needed by most templates)
RUN apt-get update && apt-get install -y --no-install-recommends \
    texlive-latex-base \
    texlive-latex-extra \
    texlive-fonts-recommended \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Node dependencies first (layer caching)
COPY package.json ./
RUN npm install --omit=dev

# Copy source
COPY src/ ./src/

ENV PORT=4000
ENV NODE_ENV=production

EXPOSE 4000

# Verify pdflatex is available at build time
RUN pdflatex --version

CMD ["node", "src/index.js"]
