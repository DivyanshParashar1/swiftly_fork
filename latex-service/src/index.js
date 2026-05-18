'use strict';

const express = require('express');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 4000;

// Shared assets (logos, images) bundled with the service. Any file placed
// in this directory is copied into each compilation's working dir, so
// templates can reference them by filename (e.g. \includegraphics{rgipt_logo.png}).
const ASSETS_DIR = path.resolve(__dirname, '..', 'assets');

// Accept large .tex payloads (some templates can be verbose)
app.use(express.text({ type: 'text/plain', limit: '5mb' }));
app.use(express.json({ limit: '5mb' }));

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'latex-service' });
});

// ---------------------------------------------------------------------------
// POST /compile
//
// Body (JSON):  { "tex": "<full LaTeX source string>" }
// Response:     application/pdf binary  |  { error, details } on failure
// ---------------------------------------------------------------------------
app.post('/compile', async (req, res) => {
  // Support both JSON body { tex: "..." } and raw text body
  let texSource;
  if (typeof req.body === 'string') {
    texSource = req.body;
  } else if (req.body && typeof req.body.tex === 'string') {
    texSource = req.body.tex;
  } else {
    return res.status(400).json({ error: 'Missing tex source. Send JSON { "tex": "..." } or plain text body.' });
  }

  // Create an isolated temp directory for this compilation job
  const jobId = crypto.randomBytes(8).toString('hex');
  const jobDir = path.join(os.tmpdir(), `latex-job-${jobId}`);

  try {
    await fs.promises.mkdir(jobDir, { recursive: true });

    const texFile = path.join(jobDir, 'document.tex');
    const pdfFile = path.join(jobDir, 'document.pdf');

    await fs.promises.writeFile(texFile, texSource, 'utf-8');

    // Stage shared assets (logos etc.) into the job dir so templates can
    // reference them by bare filename. Missing dir is fine (no-op).
    await copyAssets(ASSETS_DIR, jobDir);

    // Run pdflatex twice — second pass resolves references/TOC (standard practice)
    await runPdflatex(texFile, jobDir);
    await runPdflatex(texFile, jobDir); // second pass

    const pdfExists = await fs.promises
      .access(pdfFile)
      .then(() => true)
      .catch(() => false);

    if (!pdfExists) {
      const logContent = await readLogFile(jobDir);
      return res.status(500).json({
        error: 'pdflatex ran but produced no PDF',
        details: logContent,
      });
    }

    const pdfBuffer = await fs.promises.readFile(pdfFile);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);
  } catch (err) {
    // If pdflatex itself failed, try to send back the log for debugging
    const logContent = await readLogFile(jobDir);
    return res.status(422).json({
      error: 'LaTeX compilation failed',
      details: logContent || String(err.message),
    });
  } finally {
    // Always clean up the temp directory
    fs.promises.rm(jobDir, { recursive: true, force: true }).catch(() => {});
  }
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Run pdflatex in non-interactive mode, confined to the job directory.
 * Resolves on exit code 0, rejects with log content otherwise.
 */
function runPdflatex(texFile, jobDir) {
  return new Promise((resolve, reject) => {
    execFile(
      'pdflatex',
      [
        '-interaction=nonstopmode', // never pause for user input
        '-halt-on-error',           // stop at first error
        '-output-directory', jobDir,
        texFile,
      ],
      {
        cwd: jobDir,
        timeout: 60_000, // 60 s hard limit
        maxBuffer: 10 * 1024 * 1024, // 10 MB stdout buffer
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stdout || stderr || error.message));
        } else {
          resolve(stdout);
        }
      }
    );
  });
}

/**
 * Copy every file from srcDir into destDir. Skips silently if srcDir doesn't exist.
 * Used to stage shared assets (logos, images) for templates.
 */
async function copyAssets(srcDir, destDir) {
  try {
    const entries = await fs.promises.readdir(srcDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile()) continue;
      await fs.promises.copyFile(
        path.join(srcDir, entry.name),
        path.join(destDir, entry.name)
      );
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn(`[latex-service] copyAssets warning: ${err.message}`);
    }
  }
}

/** Read the pdflatex .log file if it exists, for error reporting. */
async function readLogFile(jobDir) {
  const logFile = path.join(jobDir, 'document.log');
  try {
    const raw = await fs.promises.readFile(logFile, 'utf-8');
    // Return the last 3000 chars — that's where errors usually are
    return raw.slice(-3000);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`[latex-service] Running on port ${PORT}`);
});
