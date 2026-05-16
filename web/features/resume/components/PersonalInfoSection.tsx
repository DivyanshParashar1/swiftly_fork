import type { ResumeDetailRecord } from '@/lib/api';

interface Props {
  formData: ResumeDetailRecord;
  updateField: <K extends keyof ResumeDetailRecord>(key: K, value: ResumeDetailRecord[K]) => void;
}

export function PersonalInfoSection({ formData, updateField }: Props) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold font-mono">Personal Info</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">First Name</label>
          <input
            type="text"
            value={formData.firstName || ''}
            onChange={(e) => updateField('firstName', e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Last Name</label>
          <input
            type="text"
            value={formData.lastName || ''}
            onChange={(e) => updateField('lastName', e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={formData.resumeEmail || ''}
            onChange={(e) => updateField('resumeEmail', e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone</label>
          <input
            type="text"
            value={formData.phoneNumber || ''}
            onChange={(e) => updateField('phoneNumber', e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">LinkedIn</label>
          <input
            type="url"
            value={formData.linkedIn || ''}
            onChange={(e) => updateField('linkedIn', e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">GitHub</label>
          <input
            type="url"
            value={formData.github || ''}
            onChange={(e) => updateField('github', e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Portfolio / Website</label>
          <input
            type="url"
            value={formData.personalPortfolio || ''}
            onChange={(e) => updateField('personalPortfolio', e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">Summary</label>
          <textarea
            value={formData.summary || ''}
            onChange={(e) => updateField('summary', e.target.value)}
            className="w-full px-3 py-2 border rounded-md min-h-[100px]"
          />
        </div>
      </div>
    </div>
  );
}
