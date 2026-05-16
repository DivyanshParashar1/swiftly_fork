import { useState, useCallback } from 'react';
import type { ResumeDetailRecord } from '@/lib/api';

export function useResumeForm(initialData: ResumeDetailRecord | null) {
  const [formData, setFormData] = useState<ResumeDetailRecord | null>(initialData);

  const updateField = useCallback(<K extends keyof ResumeDetailRecord>(key: K, value: ResumeDetailRecord[K]) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: value };
    });
  }, []);

  const updateArrayField = useCallback(<K extends 'education' | 'experience' | 'projects' | 'skills' | 'achievements' | 'pors' | 'publications'>(
    key: K,
    index: number,
    field: string,
    value: any
  ) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const arr = [...(prev[key] as any[])];
      arr[index] = { ...arr[index], [field]: value };
      return { ...prev, [key]: arr };
    });
  }, []);

  const addArrayItem = useCallback(<K extends 'education' | 'experience' | 'projects' | 'skills' | 'achievements' | 'pors' | 'publications'>(
    key: K,
    newItem: any
  ) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return { ...prev, [key]: [...(prev[key] as any[]), newItem] };
    });
  }, []);

  const removeArrayItem = useCallback(<K extends 'education' | 'experience' | 'projects' | 'skills' | 'achievements' | 'pors' | 'publications'>(
    key: K,
    index: number
  ) => {
    setFormData((prev) => {
      if (!prev) return prev;
      const arr = [...(prev[key] as any[])];
      arr.splice(index, 1);
      return { ...prev, [key]: arr };
    });
  }, []);

  const setEntireForm = useCallback((data: ResumeDetailRecord) => {
    setFormData(data);
  }, []);

  return {
    formData,
    updateField,
    updateArrayField,
    addArrayItem,
    removeArrayItem,
    setEntireForm,
  };
}
