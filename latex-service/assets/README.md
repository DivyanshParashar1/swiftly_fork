# Shared Template Assets

Any file dropped into this directory is staged into every compilation's working directory before pdflatex runs. Templates can reference these by bare filename — for example, `rgipt-template/index.tex` does:

```latex
\IfFileExists{rgipt_logo.png}{\includegraphics[width=2cm,clip]{rgipt_logo.png}}{}%
```

To enable the RGIPT logo, place a file named `rgipt_logo.png` in this directory. The template uses `\IfFileExists` so it degrades gracefully when the file is absent — no compile failure, the logo area is simply empty.

Files placed here are baked into the Docker image at build time (see `Dockerfile`).
