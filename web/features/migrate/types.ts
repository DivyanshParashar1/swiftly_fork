// ─── Migration Pipeline — Shared Types ────────────────────────────────────────

/**
 * Represents a single section in the migration builder.
 * Mirrors the backend MigrationSection interface.
 */
export interface MigrationSection {
  key: string;        // e.g. 'experience'
  visible: boolean;   // whether the section appears in the output
  itemOrder: string[];   // ordered item IDs (future use for per-item drag-drop)
  hiddenItems: string[]; // IDs of items excluded from the final resume
}

/**
 * Full payload sent to the backend compile / latex endpoints.
 */
export interface MigrationConfig {
  sections: MigrationSection[];
  userInputs: Record<string, string>; // extra fields like roll, course, collegeEmail
}

/**
 * Template metadata loaded from /api/v1/migrate/meta/:templateId
 */
export interface TemplateMeta {
  id: string;
  supportsSectionReordering: boolean;
  supportsItemVisibility: boolean;
  requiredUserInputs: string[];
  defaultSectionOrder: string[];
}

/**
 * Template schema loaded from /api/v1/migrate/schema/:templateId
 * Keys are Handlebars placeholder names, values are either:
 *   - a DB field name (string)
 *   - "USER_INPUT" (requires a form field)
 *   - an object with _db_source + per-field mappings (for array sections)
 */
export type TemplateSchemaValue =
  | string
  | { _db_source: string; [field: string]: string };

export type TemplateSchema = Record<string, TemplateSchemaValue>;

/**
 * Derived from TemplateSchema — only entries where value === 'USER_INPUT'.
 */
export interface UserInputField {
  key: string;   // Handlebars placeholder key (e.g. 'roll')
  label: string; // Human-readable label (e.g. 'Roll No.')
}

/** Human-readable section labels. */
export const SECTION_LABELS: Record<string, string> = {
  summary: 'Summary',
  education: 'Education',
  experience: 'Experience',
  projects: 'Projects',
  skills: 'Technical Skills',
  achievements: 'Achievements',
  por: 'Positions of Responsibility',
  publications: 'Publications',
};

/** Derive USER_INPUT fields from a TemplateSchema. */
export function extractUserInputFields(schema: TemplateSchema): UserInputField[] {
  return Object.entries(schema)
    .filter(([, val]) => val === 'USER_INPUT')
    .map(([key]) => ({
      key,
      label: key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (c) => c.toUpperCase())
        .trim(),
    }));
}
