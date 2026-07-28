import * as fs from 'fs';
import * as path from 'path';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Skill {
  name: string;
  description: string;
  content: string;
  path: string;
}

export type SkillName =
  | 'healing-policy'
  | 'coding-standards'
  | 'bugasura-write-back'
  | 'bugasura-to-test-plan'
  | 'test-data-setup'
  | 'requirements-only-planning'
  | 'ci-reporting';

// ─── Constants ────────────────────────────────────────────────────────────────

const SKILLS_ROOT = path.resolve(process.cwd(), '.claude', 'skills');

// Skills always loaded for any healing pass
export const HEALING_SKILLS: SkillName[] = [
  'healing-policy',
  'coding-standards',
  'bugasura-write-back',
];

// Skills always loaded for write-back only (pass reporting)
export const REPORTING_SKILLS: SkillName[] = [
  'bugasura-write-back',
];

// ─── Core loader ─────────────────────────────────────────────────────────────

/**
 * Loads a single SKILL.md file by skill name.
 * Expects file at: .claude/skills/<name>/SKILL.md
 */
export function loadSkill(name: SkillName): Skill {
  const skillPath = path.join(SKILLS_ROOT, name, 'SKILL.md');

  if (!fs.existsSync(skillPath)) {
    throw new Error(
      `Skill "${name}" not found at expected path: ${skillPath}\n` +
      `Ensure the skill folder exists under .claude/skills/${name}/SKILL.md`
    );
  }

  const raw = fs.readFileSync(skillPath, 'utf-8');

  // Strip YAML frontmatter (between --- delimiters) to get clean content
  const frontmatterMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  const frontmatter = frontmatterMatch ? frontmatterMatch[1] : '';
  const content = frontmatterMatch ? frontmatterMatch[2].trim() : raw.trim();

  // Extract name and description from frontmatter
  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);

  // Handle multiple YAML description formats:
  //   description: "quoted text"
  //   description: unquoted text
  //   description: >\n  block scalar
  const descMatch = frontmatter.match(
    /^description:\s*(?:"([^"]+)"|([>|+-]?\s*\n[\s\S]*?)(?=\n\w|$)|(.+))$/m
  );

  let description = '';
  if (descMatch) {
    // Quoted string (group 1), block scalar (group 2), or unquoted (group 3)
    const raw = descMatch[1] ?? descMatch[2] ?? descMatch[3] ?? '';
    // Strip YAML block indent and collapse whitespace
    description = raw
      .replace(/^>\s*\n?/m, '')   // strip > indicator
      .replace(/^[\s-]+\n/gm, '') // strip YAML block markers
      .replace(/^\s{2}/gm, '')    // strip 2-space indent
      .trim();
  }

  return {
    name: nameMatch ? nameMatch[1].trim() : name,
    description,
    content,
    path: skillPath,
  };
}

/**
 * Loads multiple skills by name.
 * Returns array of Skill objects in the same order as input.
 */
export function loadSkills(names: SkillName[]): Skill[] {
  return names.map(name => {
    try {
      return loadSkill(name);
    } catch (err) {
      console.warn(`[skill-loader] WARNING: ${(err as Error).message}`);
      // Return a minimal placeholder so orchestrator doesn't crash
      return {
        name,
        description: `Skill "${name}" could not be loaded`,
        content: `[Skill "${name}" is missing — check .claude/skills/${name}/SKILL.md]`,
        path: '',
      };
    }
  });
}

/**
 * Formats loaded skills into a single system prompt block
 * ready to inject into the Claude API call.
 *
 * Format:
 *   <skills>
 *     <skill name="healing-policy">
 *       ... SKILL.md content ...
 *     </skill>
 *     ...
 *   </skills>
 */
export function buildSkillContext(skills: Skill[]): string {
  if (skills.length === 0) return '';

  const skillBlocks = skills
    .map(skill => `  <skill name="${skill.name}">\n${skill.content}\n  </skill>`)
    .join('\n\n');

  return `<skills>\n${skillBlocks}\n</skills>`;
}

/**
 * Convenience: load a named set of skills and return as formatted context string.
 * This is the primary function the orchestrator calls.
 */
export function loadSkillContext(names: SkillName[]): string {
  const skills = loadSkills(names);
  return buildSkillContext(skills);
}

/**
 * Lists all skill names available in .claude/skills/.
 * Useful for debugging — logs which skills are installed.
 */
export function listAvailableSkills(): string[] {
  if (!fs.existsSync(SKILLS_ROOT)) {
    console.warn(`[skill-loader] Skills root not found: ${SKILLS_ROOT}`);
    return [];
  }

  return fs
    .readdirSync(SKILLS_ROOT, { withFileTypes: true })
    .filter(entry => {
      if (!entry.isDirectory()) return false;
      const skillFile = path.join(SKILLS_ROOT, entry.name, 'SKILL.md');
      return fs.existsSync(skillFile);
    })
    .map(entry => entry.name);
}

// ─── Skill selector ───────────────────────────────────────────────────────────

/**
 * Returns the right skill set based on what the orchestrator
 * needs to do for a given failure type.
 *
 * LOCATOR_MISSING     → needs healing-policy + coding-standards + bugasura-write-back
 * COPY_MISMATCH       → needs healing-policy + coding-standards + bugasura-write-back
 * ROUTE_CHANGE        → needs healing-policy + coding-standards + bugasura-write-back
 * TIMEOUT             → needs healing-policy + coding-standards + bugasura-write-back
 * ASSERTION_LOGIC     → escalate only → needs healing-policy + bugasura-write-back
 * API_ERROR           → escalate only → needs healing-policy + bugasura-write-back
 * AUTH_FAILURE        → escalate only → needs healing-policy + bugasura-write-back
 * FLAKY               → escalate only → needs healing-policy + bugasura-write-back
 * UNKNOWN             → escalate only → needs healing-policy + bugasura-write-back
 */
export function selectSkillsForFailure(
  errorType: string
): SkillName[] {
  const autoFixable = [
    'LOCATOR_MISSING',
    'LOCATOR_AMBIGUOUS',
    'COPY_MISMATCH',
    'ROUTE_CHANGE',
    'TIMEOUT',
  ];

  if (autoFixable.includes(errorType)) {
    return HEALING_SKILLS; // healing-policy + coding-standards + bugasura-write-back
  }

  // Escalation-only failures don't need coding-standards
  return ['healing-policy', 'bugasura-write-back'];
}