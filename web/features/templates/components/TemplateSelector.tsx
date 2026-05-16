import { useState, useEffect } from 'react';
import type { ResumeDetailRecord } from '@/lib/api';
import { resumeApi } from '@/lib/api';
import { useSnackbar } from 'notistack';

interface Template {
  id: string;
  name: string;
  description: string;
  tags: string[];
}

const TEMPLATES: Template[] = [
  {
    id: 'default',
    name: 'Professional Default',
    description: 'A clean, ATS-friendly LaTeX template focusing on readability and structure. Perfect for software engineering and technical roles.',
    tags: ['minimal', 'technical', 'academic'],
  },
];

interface Props {
  resumeData: ResumeDetailRecord;
  onClose: () => void;
  onSelect: (templateId: string) => void;
}

export function TemplateSelector({ resumeData, onClose, onSelect }: Props) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>(TEMPLATES[0].id);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    let active = true;
    const fetchPreview = async () => {
      setIsLoadingPreview(true);
      try {
        const blob = await resumeApi.previewResumePdf(resumeData, selectedTemplate);
        if (active && blob) {
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
        }
      } catch (error) {
        if (active) {
          enqueueSnackbar('Failed to generate preview', { variant: 'error' });
        }
      } finally {
        if (active) setIsLoadingPreview(false);
      }
    };

    void fetchPreview();

    return () => {
      active = false;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [resumeData, selectedTemplate]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8">
      <div className="bg-gray-50 w-full max-w-6xl h-full max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-white border-b border-gray-200 shrink-0">
          <div>
            <h2 className="text-2xl font-bold font-mono">Select a Template</h2>
            <p className="text-sm text-gray-500 mt-1">Choose a design to export your resume. More coming soon!</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-black transition">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel: Template List */}
          <div className="w-1/3 bg-white border-r border-gray-200 p-6 overflow-y-auto">
            <div className="space-y-4">
              {TEMPLATES.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedTemplate === tmpl.id
                      ? 'border-black bg-gray-50'
                      : 'border-gray-100 hover:border-gray-300'
                  }`}
                >
                  <h3 className="font-bold font-mono text-lg">{tmpl.name}</h3>
                  <p className="text-sm text-gray-600 mt-2">{tmpl.description}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {tmpl.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel: Live Preview */}
          <div className="flex-1 bg-gray-100 p-6 flex flex-col relative">
            <div className="flex justify-between items-center mb-4 shrink-0">
              <h3 className="font-semibold text-gray-700">Live Preview</h3>
              <button
                onClick={() => onSelect(selectedTemplate)}
                disabled={isLoadingPreview || !previewUrl}
                className="px-6 py-2 bg-black text-white font-mono rounded-lg hover:bg-gray-800 disabled:opacity-50 transition shadow"
              >
                Download PDF
              </button>
            </div>
            
            <div className="flex-1 bg-white rounded-xl shadow-inner border border-gray-200 overflow-hidden relative flex items-center justify-center">
              {isLoadingPreview && (
                <div className="absolute inset-0 bg-white/80 z-10 flex flex-col items-center justify-center gap-4">
                  <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                  <p className="font-mono text-sm text-gray-600 animate-pulse">Compiling LaTeX...</p>
                </div>
              )}
              {previewUrl ? (
                <iframe src={`${previewUrl}#toolbar=0`} className="w-full h-full" title="PDF Preview" />
              ) : (
                !isLoadingPreview && <p className="text-gray-400 font-mono">Failed to load preview</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
