import { COMPANY_SECTIONS, CONTACT_SECTIONS, type FieldDefinition } from './catalog';

function fieldToSchemaLine(field: FieldDefinition): string {
  let line = `  "${field.key}": `;
  switch (field.type) {
    case 'number':
    case 'score':
      line += 'number | null';
      break;
    case 'date':
      line += 'string (ISO date) | null';
      break;
    case 'select':
      line += `"${field.options?.join('" | "')}" | null`;
      break;
    case 'multiselect':
      line += `Array<string> | null`;
      break;
    default:
      line += 'string | null';
  }
  line += `,  // ${field.label}`;
  return line;
}

export function buildCompanyEnrichmentSchema(): string {
  const lines: string[] = [];
  for (const section of COMPANY_SECTIONS) {
    if (section.key === 'predictive' || section.key === 'engagement_history') continue;
    lines.push(`  // ${section.label}`);
    for (const field of section.fields) {
      lines.push(fieldToSchemaLine(field));
    }
  }
  return `{\n${lines.join('\n')}\n}`;
}

export function buildContactEnrichmentSchema(): string {
  const lines: string[] = [];
  for (const section of CONTACT_SECTIONS) {
    if (section.key === 'contact_predictive') continue;
    lines.push(`  // ${section.label}`);
    for (const field of section.fields) {
      lines.push(fieldToSchemaLine(field));
    }
  }
  return `{\n${lines.join('\n')}\n}`;
}

export function buildCompanyPredictiveSchema(): string {
  return `{
  "conversion_probability": number,
  "mrr_potential": string,
  "best_next_action": string,
  "time_to_close_estimate": string,
  "lookalike_accounts": string
}`;
}

export function buildContactPredictiveSchema(): string {
  return `{
  "influence_score": number,
  "likelihood_to_champion": number,
  "best_message_angle": string,
  "optimal_touch_frequency": number,
  "risk_of_disengagement": number
}`;
}

export function buildCallAnalysisSchema(): string {
  return `{
  "call_summary": string,
  "call_score": number,
  "score_grade": "A" | "B" | "C" | "D" | "F",
  "score_reasoning": string,
  "strengths": Array<string>,
  "weaknesses": Array<string>,
  "red_flags": Array<string>,
  "sentiment": "very_positive" | "positive" | "neutral" | "negative" | "very_negative",
  "outcome": "follow_up_scheduled" | "not_interested" | "closed_won" | "no_answer" | "voicemail" | "other",
  "company_field_updates": { ...company catalog fields, null for unmentioned... },
  "contact_field_updates": { ...contact catalog fields, null for unmentioned... },
  "next_steps": Array<{
    "action_type": "task" | "appointment" | "email" | "note" | "stage_change" | "research",
    "title": string,
    "description": string
  }>,
  "data_points": Array<{
    "field_name": string,
    "suggested_value": string,
    "reasoning": string,
    "scope": "company" | "contact"
  }>
}`;
}
