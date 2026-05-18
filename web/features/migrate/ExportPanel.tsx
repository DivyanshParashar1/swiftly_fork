'use client';

import { useState, useRef } from 'react';
import type { MigrationConfig } from './types';
import type { LatexTemplate, ResumeDetailRecord } from '@/lib/api';
import { migrateApi } from '@/lib/api';

interface ExportPanelProps {
  resume: ResumeDetailRecord;
  template: LatexTemplate;
  migrationConfig: MigrationConfig;
  visibleCount: number;
}

type CompileState = 'idle' | 'compiling' | 'success' | 'error';

export default function ExportPanel({
  resume,
  template,
  migrationConfig,
  visibleCount,
}: ExportPanelProps) {
  const [compileState, setCompileState] = useState<CompileState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isDownloadingTex, setIsDownloadingTex] = useState(false);
  const blobUrlRef = useRef<string | null>(null);

  // ── Compile PDF ────────────────────────────────────────────────────────────

  async function handleCompile() {
    if (visibleCount === 0) {
      setErrorMsg('No sections are visible — enable at least one section before compiling.');
      setCompileState('error');
      return;
    }

    setCompileState('compiling');
    setErrorMsg('');

    // Revoke old blob URL if any
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
      setPdfBlobUrl(null);
    }

    try {
      const blob = await migrateApi.compileToPdf(resume.id, template.id, migrationConfig);
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      setPdfBlobUrl(url);
      setCompileState('success');
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Compilation failed. Is the latex-service running?');
      setCompileState('error');
    }
  }

  // ── Download PDF ───────────────────────────────────────────────────────────

  function handleDownloadPdf() {
    if (!pdfBlobUrl) return;
    const a = document.createElement('a');
    a.href = pdfBlobUrl;
    a.download = `resume-${template.id}-${Date.now()}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // ── Preview PDF in new tab ─────────────────────────────────────────────────

  function handlePreviewPdf() {
    if (!pdfBlobUrl) return;
    window.open(pdfBlobUrl, '_blank');
  }

  // ── Download .tex ──────────────────────────────────────────────────────────

  async function handleDownloadTex() {
    setIsDownloadingTex(true);
    try {
      const texStr = await migrateApi.getLatexSource(resume.id, template.id, migrationConfig);
      const blob = new Blob([texStr], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume-${template.id}.tex`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Failed to retrieve .tex source');
      setCompileState('error');
    } finally {
      setIsDownloadingTex(false);
    }
  }

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl border-2 border-gray-200/60 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
        <h3 className="text-sm font-bold text-gray-900 font-mono">// Export Resume</h3>
        <p className="text-xs text-gray-400 font-mono mt-0.5">
          Template: <span className="text-indigo-600">{template.name}</span> ·{' '}
          {visibleCount} section{visibleCount !== 1 ? 's' : ''} included
        </p>
      </div>

      <div className="p-6 space-y-4">
        {/* Primary compile button */}
        <button
          type="button"
          onClick={handleCompile}
          disabled={compileState === 'compiling' || visibleCount === 0}
          className={`w-full py-3.5 rounded-xl font-mono text-sm font-semibold border-2 transition-all shadow-md ${
            compileState === 'compiling'
              ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
              : compileState === 'success'
              ? 'bg-green-600 border-green-600 text-white hover:bg-green-700 hover:shadow-green-500/40 hover:shadow-lg'
              : 'bg-black border-black text-white hover:bg-indigo-600 hover:border-indigo-600 hover:shadow-indigo-500/40 hover:shadow-lg'
          }`}
        >
          {compileState === 'compiling' ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              compiling PDF...
            </span>
          ) : compileState === 'success' ? (
            '✓ Re-Generate Resume'
          ) : (
            '$ generate --resume'
          )}
        </button>

        {/* Error state */}
        {compileState === 'error' && (
          <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4">
            <p className="text-xs font-mono text-red-700 font-semibold mb-1">
              // Compilation Error
            </p>
            <p className="text-xs text-red-600 font-mono whitespace-pre-wrap break-words">
              {errorMsg}
            </p>
            <button
              type="button"
              onClick={handleCompile}
              className="mt-3 text-xs font-mono text-red-600 underline hover:text-red-800"
            >
              Retry →
            </button>
          </div>
        )}

        {/* Success actions */}
        {compileState === 'success' && pdfBlobUrl && (
          <div className="rounded-xl border-2 border-green-200 bg-green-50 p-4 space-y-3">
            <p className="text-xs font-mono text-green-700 font-semibold">
              ✓ Resume compiled successfully
            </p>
            <div className="flex flex-wrap gap-2">
              {/* Download PDF */}
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-green-300 text-green-700 rounded-lg text-xs font-mono hover:bg-green-50 hover:border-green-500 transition-all shadow-sm"
              >
                ↓ Download PDF
              </button>

              {/* Preview in new tab */}
              <button
                type="button"
                onClick={handlePreviewPdf}
                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-indigo-200 text-indigo-600 rounded-lg text-xs font-mono hover:bg-indigo-50 hover:border-indigo-400 transition-all shadow-sm"
              >
                ↗ Preview PDF
              </button>

              {/* Download .tex */}
              <button
                type="button"
                onClick={handleDownloadTex}
                disabled={isDownloadingTex}
                className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 text-gray-600 rounded-lg text-xs font-mono hover:bg-gray-50 hover:border-gray-400 transition-all shadow-sm disabled:opacity-50"
              >
                {isDownloadingTex ? '…' : '↓ Download .tex'}
              </button>
            </div>
          </div>
        )}

        {/* .tex download available even before compile */}
        {compileState === 'idle' && (
          <button
            type="button"
            onClick={handleDownloadTex}
            disabled={isDownloadingTex}
            className="w-full py-2.5 rounded-xl font-mono text-xs border-2 border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50"
          >
            {isDownloadingTex ? '…' : '↓ Download .tex (without compiling)'}
          </button>
        )}

        {/* Info note */}
        <p className="text-xs font-mono text-gray-400 text-center">
          // Compilation may take 10–30s · powered by latex-service
        </p>
      </div>
    </div>
  );
}
