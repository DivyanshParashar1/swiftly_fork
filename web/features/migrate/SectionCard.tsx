'use client';

import { useState } from 'react';
import type { SectionState } from './useMigrationState';

interface SectionCardProps {
  section: SectionState;
  index: number;
  isDragging: boolean;
  onToggleSection: (key: string) => void;
  onToggleItem: (sectionKey: string, itemId: string) => void;
  dragHandleProps?: Record<string, unknown>;
}

export default function SectionCard({
  section,
  index,
  isDragging,
  onToggleSection,
  onToggleItem,
  dragHandleProps,
}: SectionCardProps) {
  const [expanded, setExpanded] = useState(false);

  const visibleItems = section.items.filter((i) => !section.hiddenItems.includes(i.id));
  const totalItems = section.items.length;

  return (
    <div
      className={`rounded-xl border-2 transition-all select-none ${
        isDragging
          ? 'border-indigo-400 shadow-2xl shadow-indigo-200/60 rotate-1 scale-[1.02] bg-white z-50'
          : section.visible
          ? 'border-gray-200 bg-white hover:border-indigo-200 hover:shadow-md'
          : 'border-gray-100 bg-gray-50/80'
      }`}
    >
      {/* Card header */}
      <div className="flex items-center gap-3 p-4">
        {/* Drag handle */}
        <button
          {...(dragHandleProps as any)}
          className={`flex flex-col gap-0.5 p-1.5 rounded-lg cursor-grab active:cursor-grabbing transition-colors ${
            section.visible
              ? 'text-gray-400 hover:text-indigo-500 hover:bg-indigo-50'
              : 'text-gray-200'
          }`}
          aria-label={`Drag to reorder ${section.label}`}
          tabIndex={0}
        >
          <span className="flex gap-0.5">
            <span className="w-1 h-1 rounded-full bg-current" />
            <span className="w-1 h-1 rounded-full bg-current" />
          </span>
          <span className="flex gap-0.5">
            <span className="w-1 h-1 rounded-full bg-current" />
            <span className="w-1 h-1 rounded-full bg-current" />
          </span>
          <span className="flex gap-0.5">
            <span className="w-1 h-1 rounded-full bg-current" />
            <span className="w-1 h-1 rounded-full bg-current" />
          </span>
        </button>

        {/* Section index badge */}
        <span
          className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
            section.visible ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'
          }`}
        >
          {index + 1}
        </span>

        {/* Section info */}
        <div className="flex-1 min-w-0">
          <p
            className={`font-semibold text-sm font-mono ${
              section.visible ? 'text-gray-900' : 'text-gray-400 line-through'
            }`}
          >
            {section.label}
          </p>
          {totalItems > 0 && (
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              {visibleItems.length}/{totalItems} items
            </p>
          )}
        </div>

        {/* Expand toggle (only for sections with items) */}
        {totalItems > 0 && section.visible && (
          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors text-xs"
            aria-label={expanded ? 'Collapse' : 'Expand items'}
          >
            {expanded ? '▲' : '▼'}
          </button>
        )}

        {/* Visibility toggle */}
        <button
          type="button"
          onClick={() => onToggleSection(section.key)}
          className={`p-1.5 rounded-lg transition-all text-sm ${
            section.visible
              ? 'text-indigo-500 hover:bg-indigo-50 hover:text-indigo-700'
              : 'text-gray-300 hover:bg-gray-100 hover:text-gray-500'
          }`}
          aria-label={section.visible ? `Hide ${section.label}` : `Show ${section.label}`}
          title={section.visible ? 'Click to hide section' : 'Click to show section'}
        >
          {section.visible ? '👁' : '🙈'}
        </button>
      </div>

      {/* Expanded item list */}
      {expanded && section.visible && totalItems > 0 && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-2">
          <p className="text-xs font-mono text-gray-400 mb-2">// Toggle individual items</p>
          {section.items.map((item) => {
            const isHidden = section.hiddenItems.includes(item.id);
            return (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-2.5 rounded-lg border transition-all ${
                  isHidden
                    ? 'border-gray-100 bg-gray-50 opacity-50'
                    : 'border-indigo-100 bg-indigo-50/50'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onToggleItem(section.key, item.id)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                    isHidden
                      ? 'border-gray-300 bg-white'
                      : 'border-indigo-500 bg-indigo-500 text-white'
                  }`}
                  aria-label={isHidden ? `Include ${item.label}` : `Exclude ${item.label}`}
                >
                  {!isHidden && (
                    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium truncate ${isHidden ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {item.label}
                  </p>
                  {item.sublabel && (
                    <p className="text-xs text-gray-400 truncate font-mono">{item.sublabel}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
