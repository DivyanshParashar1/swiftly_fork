'use client';

import type { UserInputField } from './types';
import type { ResumeDetailRecord } from '@/lib/api';

const inputClass =
  'w-full px-3 py-2.5 rounded-lg border-2 border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 text-sm font-mono transition-colors';

const labelClass = 'block text-xs font-mono text-indigo-600 mb-1.5 font-medium';

/** Map a USER_INPUT key to a sensible placeholder hint. */
function getPlaceholder(key: string): string {
  const map: Record<string, string> = {
    roll: 'e.g. 23CD3025',
    course: 'e.g. Bachelor of Technology',
    collegeEmail: 'e.g. 23cd3025@rgipt.ac.in',
  };
  return map[key] ?? `Enter ${key}`;
}

interface UserInputFormProps {
  fields: UserInputField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  /** Optional — used to pre-fill matching DB fields */
  resume: ResumeDetailRecord;
}

export default function UserInputForm({
  fields,
  values,
  onChange,
  resume,
}: UserInputFormProps) {
  if (fields.length === 0) return null;

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl border-2 border-amber-200/80 shadow-xl p-6">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
          <span className="text-amber-600 text-sm">⚠</span>
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 font-mono">
            // Additional fields required
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            These fields are not in your resume database — fill them in before export.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((field) => {
          const value = values[field.key] ?? '';
          const isEmpty = value.trim() === '';

          return (
            <label key={field.key} className="block">
              <span className={`${labelClass} ${isEmpty ? 'text-amber-600' : 'text-indigo-600'}`}>
                {field.label}
                {isEmpty && <span className="ml-1 text-amber-500">*</span>}
              </span>
              <input
                type="text"
                className={`${inputClass} ${
                  isEmpty
                    ? 'border-amber-300 focus:border-amber-500'
                    : 'border-green-300 focus:border-indigo-500'
                }`}
                placeholder={getPlaceholder(field.key)}
                value={value}
                onChange={(e) => onChange(field.key, e.target.value)}
              />
            </label>
          );
        })}
      </div>

      {/* Validation hint */}
      {fields.some((f) => !(values[f.key]?.trim())) && (
        <p className="mt-4 text-xs font-mono text-amber-600 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
          // Fill all required fields before proceeding to section builder
        </p>
      )}
    </div>
  );
}
