import type { AchievementRecord } from '@/lib/api';

interface Props {
  items: AchievementRecord[];
  updateItem: (index: number, field: string, value: any) => void;
  addItem: (item: any) => void;
  removeItem: (index: number) => void;
}

export function CertificationsSection({ items, updateItem, addItem, removeItem }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold font-mono">Certifications (Achievements)</h2>
        <button
          type="button"
          onClick={() => addItem({ title: '', org: '', date: '', description: '' })}
          className="text-sm font-mono px-3 py-1 bg-black text-white rounded hover:bg-gray-800 transition"
        >
          + Add Certification
        </button>
      </div>
      <div className="space-y-4">
        {items.map((cert, i) => (
          <div key={i} className="p-4 border border-gray-200 rounded-lg relative bg-white shadow-sm transition-all group">
            <button
              onClick={() => removeItem(i)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition"
              title="Remove"
            >
              ✕
            </button>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">Name / Title</label>
                <input
                  type="text"
                  value={cert.title || ''}
                  onChange={(e) => updateItem(i, 'title', e.target.value)}
                  className="w-full px-2 py-1 border-b focus:outline-none focus:border-black font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">Issuer / Org</label>
                <input
                  type="text"
                  value={cert.org || ''}
                  onChange={(e) => updateItem(i, 'org', e.target.value)}
                  className="w-full px-2 py-1 border-b focus:outline-none focus:border-black"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">Date</label>
                <input
                  type="text"
                  value={cert.date || ''}
                  onChange={(e) => updateItem(i, 'date', e.target.value)}
                  className="w-full px-2 py-1 border-b focus:outline-none focus:border-black"
                />
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-gray-500 text-sm">No certifications entries. Add one above.</p>}
      </div>
    </div>
  );
}
