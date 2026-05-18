'use client';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import type { SectionState } from './useMigrationState';
import SectionCard from './SectionCard';

// ─── Sortable wrapper ─────────────────────────────────────────────────────────

function SortableSectionCard({
  section,
  index,
  activeId,
  onToggleSection,
  onToggleItem,
}: {
  section: SectionState;
  index: number;
  activeId: string | null;
  onToggleSection: (key: string) => void;
  onToggleItem: (sectionKey: string, itemId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <SectionCard
        section={section}
        index={index}
        isDragging={isDragging}
        onToggleSection={onToggleSection}
        onToggleItem={onToggleItem}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

// ─── SectionBuilder ───────────────────────────────────────────────────────────

interface SectionBuilderProps {
  sections: SectionState[];
  onReorder: (newSections: SectionState[]) => void;
  onToggleSection: (key: string) => void;
  onToggleItem: (sectionKey: string, itemId: string) => void;
  onReset: () => void;
  visibleCount: number;
}

export default function SectionBuilder({
  sections,
  onReorder,
  onToggleSection,
  onToggleItem,
  onReset,
  visibleCount,
}: SectionBuilderProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.key === active.id);
    const newIndex = sections.findIndex((s) => s.key === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      onReorder(arrayMove(sections, oldIndex, newIndex));
    }
  }

  return (
    <div className="bg-white/80 backdrop-blur-lg rounded-2xl border-2 border-gray-200/60 shadow-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div>
          <h3 className="text-sm font-bold text-gray-900 font-mono">
            // Section Builder
          </h3>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            {visibleCount} of {sections.length} sections visible · drag to reorder
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="px-3 py-1.5 text-xs font-mono border border-gray-200 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
          >
            ↺ reset
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 pt-4 pb-2 flex items-center gap-4 text-xs font-mono text-gray-400 flex-wrap">
        <span className="flex items-center gap-1">
          <span>⋮⋮</span> drag to reorder
        </span>
        <span className="flex items-center gap-1">
          <span>👁</span> toggle visibility
        </span>
        <span className="flex items-center gap-1">
          <span>▼</span> expand to manage items
        </span>
      </div>

      {/* Sortable list */}
      <div className="px-6 pb-6 pt-2 space-y-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map((s) => s.key)}
            strategy={verticalListSortingStrategy}
          >
            {sections.map((section, index) => (
              <SortableSectionCard
                key={section.key}
                section={section}
                index={index}
                activeId={activeId}
                onToggleSection={onToggleSection}
                onToggleItem={onToggleItem}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Warning if nothing visible */}
      {visibleCount === 0 && (
        <div className="mx-6 mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-xs font-mono text-red-600">
          // Warning: no sections are visible — enable at least one before exporting
        </div>
      )}
    </div>
  );
}
