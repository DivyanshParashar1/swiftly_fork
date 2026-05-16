import type { ExperienceRecord } from '@/lib/api';

interface Props {
  items: ExperienceRecord[];
  updateItem: (index: number, field: string, value: any) => void;
  addItem: (item: any) => void;
  removeItem: (index: number) => void;
}

export function ExperienceSection({ items, updateItem, addItem, removeItem }: Props) {
  const handleBulletChange = (expIndex: number, bulletIndex: number, newValue: string) => {
    const desc = items[expIndex].description || '';
    const bullets = desc.split('\n').filter(Boolean);
    bullets[bulletIndex] = newValue;
    updateItem(expIndex, 'description', bullets.join('\n'));
  };

  const addBullet = (expIndex: number) => {
    const desc = items[expIndex].description || '';
    const newDesc = desc ? `${desc}\nNew Bullet` : 'New Bullet';
    updateItem(expIndex, 'description', newDesc);
  };

  const removeBullet = (expIndex: number, bulletIndex: number) => {
    const desc = items[expIndex].description || '';
    const bullets = desc.split('\n').filter(Boolean);
    bullets.splice(bulletIndex, 1);
    updateItem(expIndex, 'description', bullets.join('\n'));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold font-mono">Experience</h2>
        <button
          type="button"
          onClick={() => addItem({ companyName: '', position: '', location: '', startDate: '', endDate: '', description: '' })}
          className="text-sm font-mono px-3 py-1 bg-black text-white rounded hover:bg-gray-800 transition"
        >
          + Add Experience
        </button>
      </div>
      <div className="space-y-6">
        {items.map((exp, i) => (
          <div key={i} className="p-4 border border-gray-200 rounded-lg relative bg-white shadow-sm transition-all group">
            <button
              onClick={() => removeItem(i)}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition"
              title="Remove"
            >
              ✕
            </button>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">Company</label>
                <input
                  type="text"
                  value={exp.companyName || ''}
                  onChange={(e) => updateItem(i, 'companyName', e.target.value)}
                  className="w-full px-2 py-1 border-b focus:outline-none focus:border-black font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">Role</label>
                <input
                  type="text"
                  value={exp.position || ''}
                  onChange={(e) => updateItem(i, 'position', e.target.value)}
                  className="w-full px-2 py-1 border-b focus:outline-none focus:border-black font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">Location</label>
                <input
                  type="text"
                  value={exp.location || ''}
                  onChange={(e) => updateItem(i, 'location', e.target.value)}
                  className="w-full px-2 py-1 border-b focus:outline-none focus:border-black"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 uppercase">Start Date</label>
                  <input
                    type="text"
                    value={exp.startDate || ''}
                    onChange={(e) => updateItem(i, 'startDate', e.target.value)}
                    className="w-full px-2 py-1 border-b focus:outline-none focus:border-black"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 uppercase">End Date</label>
                  <input
                    type="text"
                    value={exp.endDate || ''}
                    onChange={(e) => updateItem(i, 'endDate', e.target.value)}
                    className="w-full px-2 py-1 border-b focus:outline-none focus:border-black"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-2 mt-4">
              <label className="block text-xs font-medium text-gray-500 uppercase">Bullets</label>
              {(exp.description || '').split('\n').filter(Boolean).map((bullet, bIndex) => (
                <div key={bIndex} className="flex gap-2 items-start">
                  <span className="mt-1 text-gray-400">•</span>
                  <textarea
                    value={bullet}
                    onChange={(e) => handleBulletChange(i, bIndex, e.target.value)}
                    className="flex-1 border-b border-gray-200 focus:outline-none focus:border-black resize-none"
                    rows={2}
                  />
                  <button onClick={() => removeBullet(i, bIndex)} className="text-gray-400 hover:text-red-500">
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addBullet(i)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-2"
              >
                + Add Bullet
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-gray-500 text-sm">No experience entries. Add one above.</p>}
      </div>
    </div>
  );
}
