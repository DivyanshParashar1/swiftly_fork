# Multi-arch compatible (AMD64 + ARM64 / Apple Silicon)
# Node 20 on Debian Bookworm slim — then install only the TeX packages we need
FROM node:20-bookworm-slim

# Install texlive packages required for our resume templates:
#   texlive-latex-base       → pdflatex, core packages (geometry, inputenc, fontenc, parskip)
#   texlive-latex-extra      → titlesec, enumitem, microtype, tabularx, array, xcolor, hyperref, tcolorbox
#   texlive-fonts-recommended → standard fonts (needed by most templates)
#   texlive-fonts-extra      → fontawesome5, cfr-lm, marvosym (needed by jakes-resume & rgipt-template)
RUN apt-get update && apt-get install -y --no-install-recommends \
    texlive-latex-base \
    texlive-latex-extra \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    lmodern \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Node dependencies first (layer caching)
COPY package.json ./
RUN npm install --omit=dev

# Copy source
COPY src/ ./src/

# Copy shared template assets (logos etc.). Each compile job stages these
# into its working dir so templates can reference them by bare filename.
# It's fine if the dir is empty or absent; copyAssets() handles that.
COPY assets/ ./assets/

ENV PORT=4000
ENV NODE_ENV=production

EXPOSE 4000

# Verify pdflatex is available at build time
RUN pdflatex --version

CMD ["node", "src/index.js"]
