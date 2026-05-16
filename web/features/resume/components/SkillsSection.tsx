import type { SkillRecord } from '@/lib/api';

interface Props {
  items: SkillRecord[];
  updateItem: (index: number, field: string, value: any) => void;
  addItem: (item: any) => void;
  removeItem: (index: number) => void;
}

export function SkillsSection({ items, updateItem, addItem, removeItem }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold font-mono">Skills</h2>
        <button
          type="button"
          onClick={() => addItem({ category: '', name: '' })}
          className="text-sm font-mono px-3 py-1 bg-black text-white rounded hover:bg-gray-800 transition"
        >
          + Add Skill Category
        </button>
      </div>
      <div className="space-y-4">
        {items.map((skill, i) => (
          <div key={i} className="flex gap-4 items-start group">
            <div className="w-1/3">
              <input
                type="text"
                value={skill.category || ''}
                onChange={(e) => updateItem(i, 'category', e.target.value)}
                placeholder="Category (e.g. Languages)"
                className="w-full px-2 py-1 border-b focus:outline-none focus:border-black font-semibold text-sm"
              />
            </div>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={skill.name || ''}
                onChange={(e) => updateItem(i, 'name', e.target.value)}
                placeholder="Comma separated skills (e.g. Python, Java)"
                className="w-full px-2 py-1 border-b focus:outline-none focus:border-black text-sm"
              />
              <button
                onClick={() => removeItem(i)}
                className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition px-2"
                title="Remove"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-gray-500 text-sm">No skills added. Add a category above.</p>}
      </div>
    </div>
  );
}
