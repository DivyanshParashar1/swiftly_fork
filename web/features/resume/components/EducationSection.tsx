import type { EducationRecord } from '@/lib/api';

interface Props {
  items: EducationRecord[];
  updateItem: (index: number, field: string, value: any) => void;
  addItem: (item: any) => void;
  removeItem: (index: number) => void;
}

export function EducationSection({ items, updateItem, addItem, removeItem }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold font-mono">Education</h2>
        <button
          type="button"
          onClick={() => addItem({ instituteName: '', degree: '', branch: '', location: '', startDate: '', endDate: '', grade: '' })}
          className="text-sm font-mono px-3 py-1 bg-black text-white rounded hover:bg-gray-800 transition"
        >
          + Add Education
        </button>
      </div>
      <div className="space-y-6">
        {items.map((edu, i) => (
          <div key={i} className="p-4 border border-gray-200 rounded-lg relative bg-white shadow-sm transition-all group">
            <button
              onClick={() => removeItem(i)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition"
              title="Remove"
            >
              ✕
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">Institution</label>
                <input
                  type="text"
                  value={edu.instituteName || ''}
                  onChange={(e) => updateItem(i, 'instituteName', e.target.value)}
                  className="w-full px-2 py-1 border-b focus:outline-none focus:border-black font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">Location</label>
                <input
                  type="text"
                  value={edu.location || ''}
                  onChange={(e) => updateItem(i, 'location', e.target.value)}
                  className="w-full px-2 py-1 border-b focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">Degree</label>
                <input
                  type="text"
                  value={edu.degree || ''}
                  onChange={(e) => updateItem(i, 'degree', e.target.value)}
                  className="w-full px-2 py-1 border-b focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">Field of Study</label>
                <input
                  type="text"
                  value={edu.branch || ''}
                  onChange={(e) => updateItem(i, 'branch', e.target.value)}
                  className="w-full px-2 py-1 border-b focus:outline-none focus:border-black"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 uppercase">Start Date</label>
                  <input
                    type="text"
                    value={edu.startDate || ''}
                    onChange={(e) => updateItem(i, 'startDate', e.target.value)}
                    className="w-full px-2 py-1 border-b focus:outline-none focus:border-black"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 uppercase">End Date</label>
                  <input
                    type="text"
                    value={edu.endDate || ''}
                    onChange={(e) => updateItem(i, 'endDate', e.target.value)}
                    className="w-full px-2 py-1 border-b focus:outline-none focus:border-black"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">GPA / Grade</label>
                <input
                  type="text"
                  value={edu.grade || ''}
                  onChange={(e) => updateItem(i, 'grade', e.target.value)}
                  className="w-full px-2 py-1 border-b focus:outline-none focus:border-black"
                />
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-gray-500 text-sm">No education entries. Add one above.</p>}
      </div>
    </div>
  );
}
