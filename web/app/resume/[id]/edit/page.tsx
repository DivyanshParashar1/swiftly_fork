'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSnackbar } from 'notistack';
import { resumeApi } from '@/lib/api';
import { useResumeForm } from '@/features/resume/hooks/useResumeForm';

import { PersonalInfoSection } from '@/features/resume/components/PersonalInfoSection';
import { EducationSection } from '@/features/resume/components/EducationSection';
import { ExperienceSection } from '@/features/resume/components/ExperienceSection';
import { ProjectsSection } from '@/features/resume/components/ProjectsSection';
import { SkillsSection } from '@/features/resume/components/SkillsSection';
import { CertificationsSection } from '@/features/resume/components/CertificationsSection';
import { TemplateSelector } from '@/features/templates/components/TemplateSelector';

export default function ResumeEditPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { enqueueSnackbar } = useSnackbar();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  const {
    formData,
    setEntireForm,
    updateField,
    updateArrayField,
    addArrayItem,
    removeArrayItem,
  } = useResumeForm(null);

  useEffect(() => {
    async function loadResume() {
      try {
        const response = await resumeApi.fetchResumeById(id);
        const rawData = response.data;
        const data = Array.isArray(rawData) ? rawData[0] : rawData;
        
        if (data) {
          // Normalise arrays if missing
          setEntireForm({
            ...data,
            education: data.education || [],
            experience: data.experience || [],
            projects: data.projects || [],
            skills: data.skills || [],
            achievements: data.achievements || [],
            pors: data.pors || [],
            publications: data.publications || [],
          });
        }
      } catch (error) {
        enqueueSnackbar('Failed to load resume', { variant: 'error' });
      } finally {
        setIsLoading(false);
      }
    }
    void loadResume();
  }, [id, setEntireForm, enqueueSnackbar]);

  const handleMigrateClick = async () => {
    if (!formData) return;
    setIsSaving(true);
    try {
      await resumeApi.updateFullResume(id, formData);
      enqueueSnackbar('Resume saved successfully', { variant: 'success' });
      setShowTemplateSelector(true);
    } catch (error) {
      enqueueSnackbar('Failed to save resume', { variant: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const blob = await resumeApi.exportResumeToPdf(id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const filename = (formData?.title || 'resume').replace(/\s+/g, '_');
      anchor.href = url;
      anchor.download = `${filename}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
      enqueueSnackbar('PDF downloaded successfully', { variant: 'success' });
      setShowTemplateSelector(false);
    } catch (error) {
      enqueueSnackbar('PDF export failed.', { variant: 'error' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin w-12 h-12 border-4 border-black border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl font-mono text-gray-500">Resume not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold font-mono">Resume Builder</h1>
            <p className="text-gray-500 mt-1">Review and edit your data before generating the final PDF.</p>
          </div>
          <button
            onClick={handleMigrateClick}
            disabled={isSaving}
            className="px-6 py-3 bg-black text-white font-mono rounded-xl hover:bg-gray-800 disabled:opacity-50 transition shadow-lg w-full sm:w-auto"
          >
            {isSaving ? 'Saving...' : 'Migrate Resume →'}
          </button>
        </div>

        {/* Editor Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 md:p-8 space-y-12 divide-y divide-gray-100">
            
            <PersonalInfoSection formData={formData} updateField={updateField} />

            <div className="pt-12">
              <ExperienceSection
                items={formData.experience || []}
                updateItem={(idx, field, val) => updateArrayField('experience', idx, field, val)}
                addItem={(item) => addArrayItem('experience', item)}
                removeItem={(idx) => removeArrayItem('experience', idx)}
              />
            </div>

            <div className="pt-12">
              <EducationSection
                items={formData.education || []}
                updateItem={(idx, field, val) => updateArrayField('education', idx, field, val)}
                addItem={(item) => addArrayItem('education', item)}
                removeItem={(idx) => removeArrayItem('education', idx)}
              />
            </div>

            <div className="pt-12">
              <ProjectsSection
                items={formData.projects || []}
                updateItem={(idx, field, val) => updateArrayField('projects', idx, field, val)}
                addItem={(item) => addArrayItem('projects', item)}
                removeItem={(idx) => removeArrayItem('projects', idx)}
              />
            </div>

            <div className="pt-12">
              <SkillsSection
                items={formData.skills || []}
                updateItem={(idx, field, val) => updateArrayField('skills', idx, field, val)}
                addItem={(item) => addArrayItem('skills', item)}
                removeItem={(idx) => removeArrayItem('skills', idx)}
              />
            </div>

            <div className="pt-12">
              <CertificationsSection
                items={formData.achievements || []}
                updateItem={(idx, field, val) => updateArrayField('achievements', idx, field, val)}
                addItem={(item) => addArrayItem('achievements', item)}
                removeItem={(idx) => removeArrayItem('achievements', idx)}
              />
            </div>

          </div>
        </div>

        {/* Bottom CTA */}
        <div className="flex justify-end pt-4 pb-12">
          <button
            onClick={handleMigrateClick}
            disabled={isSaving}
            className="px-8 py-4 bg-blue-600 text-white font-mono font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition shadow-lg shadow-blue-500/30 text-lg"
          >
            {isSaving ? 'Saving...' : 'Migrate Resume'}
          </button>
        </div>

      </div>

      {showTemplateSelector && (
        <TemplateSelector
          resumeData={formData}
          onClose={() => setShowTemplateSelector(false)}
          onSelect={handleDownloadPdf}
        />
      )}
    </div>
  );
}
