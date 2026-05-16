import type { ProjectRecord } from '@/lib/api';

interface Props {
  items: ProjectRecord[];
  updateItem: (index: number, field: string, value: any) => void;
  addItem: (item: any) => void;
  removeItem: (index: number) => void;
}

export function ProjectsSection({ items, updateItem, addItem, removeItem }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold font-mono">Projects</h2>
        <button
          type="button"
          onClick={() => addItem({ projectName: '', description: '', techStack: [], liveLink: '', githubLink: '' })}
          className="text-sm font-mono px-3 py-1 bg-black text-white rounded hover:bg-gray-800 transition"
        >
          + Add Project
        </button>
      </div>
      <div className="space-y-6">
        {items.map((proj, i) => (
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
                <label className="block text-xs font-medium text-gray-500 uppercase">Project Name</label>
                <input
                  type="text"
                  value={proj.projectName || ''}
                  onChange={(e) => updateItem(i, 'projectName', e.target.value)}
                  className="w-full px-2 py-1 border-b focus:outline-none focus:border-black font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">Tech Stack (comma separated)</label>
                <input
                  type="text"
                  value={(proj.techStack || []).join(', ')}
                  onChange={(e) => {
                    const stack = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                    updateItem(i, 'techStack', stack);
                  }}
                  className="w-full px-2 py-1 border-b focus:outline-none focus:border-black"
                  placeholder="React, Node.js, TypeScript"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-500 uppercase">Description</label>
                <textarea
                  value={proj.description || ''}
                  onChange={(e) => updateItem(i, 'description', e.target.value)}
                  className="w-full px-2 py-1 border-b border-gray-200 focus:outline-none focus:border-black resize-y min-h-[60px]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">Live Link</label>
                <input
                  type="url"
                  value={proj.liveLink || ''}
                  onChange={(e) => updateItem(i, 'liveLink', e.target.value)}
                  className="w-full px-2 py-1 border-b focus:outline-none focus:border-black text-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase">GitHub Link</label>
                <input
                  type="url"
                  value={proj.githubLink || ''}
                  onChange={(e) => updateItem(i, 'githubLink', e.target.value)}
                  className="w-full px-2 py-1 border-b focus:outline-none focus:border-black text-blue-600"
                />
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-gray-500 text-sm">No projects entries. Add one above.</p>}
      </div>
    </div>
  );
}
