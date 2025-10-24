// Participant Context Builder for AI Agent
// Formats participant data into structured text for agent system prompt

import { Participant, Department } from '../types';

/**
 * Infer department code from job title using keyword matching heuristics.
 *
 * This function maps common job titles to Momentum department codes:
 * - BL (Business Leadership): Account, Client Service, Business, Commercial
 * - STR (Strategy): Strategy, Insights, Research, Planning
 * - PM (Project Management): Project Manager, Producer, Coordinator, PMO
 * - CR (Creative): Creative, Art Director, Copywriter, Designer
 * - XD (Experience Design): UX, Service Design, Interaction Design
 * - XP (Experience Production): Production, Fabrication, Build
 * - IPCT (Technology): Developer, Engineer, Software, Technical
 * - CON (Content): Video, Photo, Film, Content Production
 * - STU (Studio): Studio, Retoucher, Artworker, Print
 * - General (fallback): External participants or unclear roles
 *
 * @param jobTitle - The participant's job title
 * @returns Department code (BL, STR, PM, CR, XD, XP, IPCT, CON, STU, General)
 */
export function inferDepartmentFromRole(jobTitle?: string): Department {
  if (!jobTitle) return 'General';

  const title = jobTitle.toLowerCase();

  // BL: Business Leadership
  // Keywords: account, client service, business, commercial, managing director
  if (/account|client service|client director|business|commercial|managing director/.test(title)) {
    return 'BL';
  }

  // STR: Strategy
  // Keywords: strategy, strategic, insight, research, planning, strategist
  if (/strateg|insight|research|planning/.test(title)) {
    return 'STR';
  }

  // PM: Project Management
  // Keywords: project manager, producer, coordinator, program manager, delivery, pmo, traffic
  if (/project manager|producer|coordinator|program manager|delivery|pmo|traffic/.test(title)) {
    return 'PM';
  }

  // CR: Creative
  // Keywords: creative, art director, copywriter, design director, writer, designer
  if (/creative|art director|copywriter|design director|writer|designer/.test(title)) {
    return 'CR';
  }

  // XD: Experience Design
  // Keywords: experience design, service design, ux, user experience, interaction design
  if (/experience design|service design|ux|user experience|interaction design/.test(title)) {
    return 'XD';
  }

  // XP: Experience Production
  // Keywords: experience production, production manager, technical production, fabrication, build
  if (/experience production|technical production|fabrication|build/.test(title)) {
    return 'XP';
  }

  // IPCT: Integrated/Creative Technology
  // Keywords: developer, engineer, technology, technical, software, front-end, back-end, full-stack, innovation, prototype
  if (/developer|engineer|technology|technical|software|front-end|back-end|full-stack|innovation|prototype/.test(title)) {
    return 'IPCT';
  }

  // CON: Content
  // Keywords: content, video, photo, film, editor, motion, cinematographer, photographer, post-production
  if (/content|video|photo|film|editor|motion|cinematographer|photographer|post-production/.test(title)) {
    return 'CON';
  }

  // STU: Studio
  // Keywords: studio, retoucher, artworker, graphic design, print, mechanical, production artist
  if (/studio|retoucher|artworker|graphic design|print|mechanical|production artist/.test(title)) {
    return 'STU';
  }

  // Fallback to General if no keywords match
  return 'General';
}

/**
 * Build formatted participant context string for AI agent consumption.
 *
 * This function transforms the app's participant array into a structured text format
 * that the AI agent can parse and use for:
 * - Matching transcript speakers to real names/departments
 * - Assigning action items to correct owners
 * - Calculating participation metrics (if attendance data present)
 * - Identifying silent stakeholders
 *
 * Output format:
 * ```
 * Participants:
 *
 * INTERNAL PARTICIPANTS (Momentum Worldwide):
 * [BL] John Smith (john.smith@momentumww.com) - Account Director
 *   Status: accepted (required)
 *   Source: csv
 * [STR] Sarah Jones (sarah.jones@momentumww.com) - Strategy Lead
 *   Status: declined (optional)
 *   Source: manual
 *
 * EXTERNAL PARTICIPANTS:
 * David Brown (david@client.com) - Acme Corp - VP of Marketing
 *   Status: accepted (required)
 *   Source: csv
 * ```
 *
 * @param participants - Array of Participant objects from the app
 * @returns Formatted string for inclusion in agent prompt, or empty string if no participants
 */
export function buildParticipantContext(participants: Participant[]): string {
  if (!participants || participants.length === 0) return '';

  // Separate internal (Momentum) and external participants
  // Internal: matched to Graph API with Momentum email domain, OR has department field
  // External: explicitly marked as external, OR has non-Momentum company name
  const internal = participants.filter(p => {
    if (!p.matched) return false;  // Unmatched participants handled separately
    if (p.isExternal) return false;
    if (p.email && p.email.includes('@momentumww.com')) return true;
    if (p.department && p.department !== 'General') return true;
    if (p.companyName === 'Momentum Worldwide') return true;
    return false;
  });

  const external = participants.filter(p => {
    if (!p.matched) return true;  // Unmatched treated as external
    if (p.isExternal) return true;
    if (p.email && !p.email.includes('@momentumww.com')) return true;
    if (p.companyName && p.companyName !== 'Momentum Worldwide') return true;
    return false;
  });

  let context = 'Participants:\n\n';

  // Format internal participants
  if (internal.length > 0) {
    context += 'INTERNAL PARTICIPANTS (Momentum Worldwide):\n';

    internal.forEach(p => {
      // Determine department: use explicit department if available, otherwise infer from job title
      const dept = p.department || inferDepartmentFromRole(p.jobTitle);
      const name = p.displayName || p.extractedText || 'Unknown';
      const email = p.email || '';
      const title = p.jobTitle || '';

      // Format: [DEPT] Name (email) - Job Title
      context += `[${dept}] ${name}`;
      if (email) context += ` (${email})`;
      if (title) context += ` - ${title}`;
      context += '\n';

      // Add attendance information if available (from CSV import)
      if (p.acceptanceStatus && p.attendanceType) {
        context += `  Status: ${p.acceptanceStatus} (${p.attendanceType})\n`;
      }

      // Add source metadata for agent context
      if (p.source) {
        context += `  Source: ${p.source}\n`;
      }
    });
    context += '\n';
  }

  // Format external participants
  if (external.length > 0) {
    context += 'EXTERNAL PARTICIPANTS:\n';

    external.forEach(p => {
      const name = p.displayName || p.extractedText || 'Unknown';
      const email = p.email || '';
      const company = p.companyName || 'External';
      const title = p.jobTitle || '';

      // Format: Name (email) - Company - Job Title
      context += `${name}`;
      if (email) context += ` (${email})`;
      context += ` - ${company}`;
      if (title) context += ` - ${title}`;
      context += '\n';

      // Add attendance information if available
      if (p.acceptanceStatus && p.attendanceType) {
        context += `  Status: ${p.acceptanceStatus} (${p.attendanceType})\n`;
      }

      // Add source metadata
      if (p.source) {
        context += `  Source: ${p.source}\n`;
      }
    });
  }

  return context;
}

/**
 * Check if participants array includes attendance status data.
 *
 * This determines whether the agent should calculate participation metrics.
 * Attendance data is typically present when participants are imported from CSV
 * (meeting invite exports) rather than extracted from transcripts.
 *
 * @param participants - Array of Participant objects
 * @returns true if any participant has acceptance status, false otherwise
 */
export function hasAttendanceData(participants: Participant[]): boolean {
  return participants.some(p => p.acceptanceStatus !== undefined && p.acceptanceStatus !== null);
}

/**
 * Count participants by source for debugging/logging.
 *
 * @param participants - Array of Participant objects
 * @returns Object with counts by source type
 */
export function getParticipantSourceBreakdown(participants: Participant[]): Record<string, number> {
  const breakdown: Record<string, number> = {
    transcript: 0,
    csv: 0,
    manual: 0,
    emailList: 0,
    unknown: 0
  };

  participants.forEach(p => {
    if (p.source) {
      breakdown[p.source] = (breakdown[p.source] || 0) + 1;
    } else {
      breakdown.unknown += 1;
    }
  });

  return breakdown;
}
