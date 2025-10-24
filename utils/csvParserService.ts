import { CSVParticipant } from '../types';

/**
 * Parse CSV content from Outlook meeting attendance export
 *
 * Expected format:
 * Name,Attendance,Response
 * Bustos, Luis (WW-MOM) <Luis.Bustos@momentumww.com>,Required,Accepted
 */
export function parseAttendanceCSV(csvContent: string): CSVParticipant[] {
    const lines = csvContent.trim().split('\n');

    if (lines.length < 2) {
        throw new Error('CSV file is empty or invalid');
    }

    // Skip first line (header) and any empty lines or meeting title lines
    const dataLines = lines.slice(1).filter(line => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith('Name,') && trimmed.includes('<') && trimmed.includes('@');
    });

    const participants: CSVParticipant[] = [];

    for (const line of dataLines) {
        try {
            const participant = parseCSVLine(line);
            if (participant) {
                participants.push(participant);
            }
        } catch (error) {
            console.warn('[CSVParser] Failed to parse line:', line, error);
            // Continue parsing other lines
        }
    }

    return participants;
}

/**
 * Parse a single CSV line
 * Handles various formats:
 * - "Bustos, Luis (WW-MOM) <Luis.Bustos@momentumww.com>,Required,Accepted"
 * - "da.patterson@make.com <da.patterson@make.com>,Optional,Accepted"
 * - "Barron, Megan (SFO-JMW) (she/her) <Megan_Barron@jackmorton.com>,Required,Didn't respond"
 * - "Christian Mosley <c.mosley@make.com>,Optional,Didn't respond"
 */
function parseCSVLine(line: string): CSVParticipant | null {
    // Extract email from angle brackets
    const emailMatch = line.match(/<([^>]+)>/);
    if (!emailMatch) {
        return null;
    }
    const email = emailMatch[1].trim();

    // Extract full name part (everything before <email>)
    const namePart = line.substring(0, line.indexOf('<')).trim();

    // Remove pronouns like (she/her), (he/him)
    const nameWithoutPronouns = namePart.replace(/\s*\([^)]*\/[^)]*\)\s*/g, '').trim();

    // Parse attendance type and response
    const parts = line.split(',');
    if (parts.length < 3) {
        return null;
    }

    // Get the last two parts (attendance and response)
    const attendance = parts[parts.length - 2].trim();
    const response = parts[parts.length - 1].trim();

    const attendanceType = attendance.toLowerCase() === 'required' ? 'required' : 'optional';
    const acceptanceStatus = parseResponseStatus(response);

    return {
        name: nameWithoutPronouns,
        email,
        acceptanceStatus,
        attendanceType
    };
}

/**
 * Parse response status from CSV
 */
function parseResponseStatus(response: string): 'accepted' | 'declined' | 'tentative' | 'noResponse' {
    const normalized = response.toLowerCase().trim();

    if (normalized === 'accepted') return 'accepted';
    if (normalized === 'declined') return 'declined';
    if (normalized === 'tentative') return 'tentative';
    if (normalized === "didn't respond" || normalized === 'no response') return 'noResponse';

    // Default to no response
    return 'noResponse';
}

/**
 * Validate CSV format
 */
export function validateCSV(csvContent: string): { valid: boolean; error?: string } {
    const lines = csvContent.trim().split('\n');

    if (lines.length < 2) {
        return { valid: false, error: 'CSV file must contain at least a header row and one data row' };
    }

    // Check if header contains expected columns
    const header = lines[0].toLowerCase();
    if (!header.includes('name') || !header.includes('response')) {
        return { valid: false, error: 'CSV must contain "Name" and "Response" columns' };
    }

    // Try to parse at least one line
    let hasValidLine = false;
    for (let i = 1; i < Math.min(5, lines.length); i++) {
        if (lines[i].includes('<') && lines[i].includes('@')) {
            hasValidLine = true;
            break;
        }
    }

    if (!hasValidLine) {
        return { valid: false, error: 'No valid participant data found in CSV' };
    }

    return { valid: true };
}
