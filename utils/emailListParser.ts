/**
 * Utilities for parsing email lists and CSV attendance files
 * Supports multiple formats: Outlook email lists, Teams CSV exports, plain email lists
 */

export interface ParsedContact {
    name?: string;
    email: string;
    attendanceType?: 'required' | 'optional';
    acceptanceStatus?: 'accepted' | 'declined' | 'tentative' | 'noResponse';
}

/**
 * Parse email list formats from Outlook/Teams
 * Handles formats like:
 * - "Name (CODE)" <email@domain.com>; "Name2" <email2@domain.com>
 * - email@domain.com, email2@domain.com
 * - email@domain.com
 *
 * Supports semicolon, comma, and newline separators
 */
export const parseEmailListFormat = (text: string): ParsedContact[] => {
    if (!text || text.trim().length === 0) {
        return [];
    }

    const contacts: ParsedContact[] = [];
    const seen = new Set<string>();

    // Pattern 1: "Name (CODE)" <email@domain.com>
    const outlookPattern = /"([^"]+)"\s*<([^>]+)>/g;
    let match;

    while ((match = outlookPattern.exec(text)) !== null) {
        const name = match[1].trim();
        const email = match[2].trim().toLowerCase();

        if (!seen.has(email) && isValidEmail(email)) {
            seen.add(email);
            contacts.push({ name, email });
        }
    }

    // Pattern 2: Plain email addresses (not already captured)
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    let emailMatch;

    while ((emailMatch = emailPattern.exec(text)) !== null) {
        const email = emailMatch[0].toLowerCase();

        if (!seen.has(email) && isValidEmail(email)) {
            seen.add(email);
            contacts.push({ email });
        }
    }

    return contacts;
};

/**
 * Parse CSV attendance file from Teams meeting export
 * Expected format:
 * Name,Attendance,Response
 * "Bustos, Luis (WW-MOM) <luis@momentum.com>",Required,Accepted
 */
export const parseCSVAttendance = (csvContent: string): ParsedContact[] => {
    if (!csvContent || csvContent.trim().length === 0) {
        return [];
    }

    // Handle both Windows (\r\n) and Unix (\n) line endings
    const lines = csvContent.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const contacts: ParsedContact[] = [];
    const seen = new Set<string>();

    console.log(`[CSV Parser] Found ${lines.length} lines in file`);

    // Find the header row (look for line with Name,Attendance,Response)
    let startIndex = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if (line.includes('name') && line.includes('attendance') && line.includes('response')) {
            startIndex = i + 1; // Start from the row after the header
            console.log(`[CSV Parser] Found header at line ${i}, starting data parse at line ${startIndex}`);
            break;
        }
    }

    // If no header found, try to parse from line 0
    if (startIndex === 0) {
        console.log('[CSV Parser] No header found, parsing from line 0');
    }

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i];

        // Parse CSV line (handle quoted fields)
        const fields = parseCSVLine(line);

        console.log(`[CSV Parser] Line ${i}: ${fields.length} fields -`, fields);

        if (fields.length < 1) {
            console.log(`[CSV Parser] Line ${i}: Skipping - no fields`);
            continue;
        }

        const nameField = fields[0]; // "Name (CODE) <email@domain.com>"
        const attendanceField = fields[1]?.toLowerCase().trim();
        const responseField = fields[2]?.toLowerCase().trim();

        // Extract email from name field
        const emailMatch = nameField.match(/<([^>]+)>/);
        if (!emailMatch) {
            console.log(`[CSV Parser] Line ${i}: Skipping - no email found in "${nameField}"`);
            continue;
        }

        const email = emailMatch[1].trim().toLowerCase();
        if (seen.has(email)) {
            console.log(`[CSV Parser] Skipping duplicate email: ${email}`);
            continue;
        }
        if (!isValidEmail(email)) {
            console.log(`[CSV Parser] Skipping invalid email: ${email}`);
            continue;
        }

        seen.add(email);

        // Extract name (everything before the email part)
        const nameMatch = nameField.match(/^(.+?)\s*</);
        const name = nameMatch ? nameMatch[1].trim().replace(/^["']|["']$/g, '') : undefined;

        // Parse attendance type
        let attendanceType: 'required' | 'optional' | undefined;
        if (attendanceField?.includes('required')) {
            attendanceType = 'required';
        } else if (attendanceField?.includes('optional')) {
            attendanceType = 'optional';
        }

        // Parse acceptance status
        let acceptanceStatus: 'accepted' | 'declined' | 'tentative' | 'noResponse' | undefined;
        if (responseField?.includes('accept')) {
            acceptanceStatus = 'accepted';
        } else if (responseField?.includes('decline')) {
            acceptanceStatus = 'declined';
        } else if (responseField?.includes('tentative')) {
            acceptanceStatus = 'tentative';
        } else if (responseField?.includes('didn\'t respond') || responseField?.includes('no response')) {
            acceptanceStatus = 'noResponse';
        }

        contacts.push({
            name,
            email,
            attendanceType,
            acceptanceStatus
        });
    }

    console.log(`[CSV Parser] Successfully parsed ${contacts.length} contacts from ${lines.length} lines`);
    return contacts;
};

/**
 * Generic email extraction for TXT/DOCX files
 * Extracts all email addresses found in the content
 */
export const extractEmailsFromFile = (content: string): ParsedContact[] => {
    if (!content || content.trim().length === 0) {
        return [];
    }

    const contacts: ParsedContact[] = [];
    const seen = new Set<string>();

    // Extract all email addresses
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    let match;

    while ((match = emailPattern.exec(content)) !== null) {
        const email = match[0].toLowerCase();

        if (!seen.has(email) && isValidEmail(email)) {
            seen.add(email);
            contacts.push({ email });
        }
    }

    return contacts;
};

/**
 * Helper: Parse a single CSV line handling quoted fields
 * Special handling for Teams CSV format where name field contains email in angle brackets
 */
const parseCSVLine = (line: string): string[] => {
    // Teams CSV format: Name with email <...>,Attendance,Response
    // The name field is NOT quoted and may contain commas
    // Strategy: Find the email in angle brackets, everything before the closing > is the name

    const emailEndMatch = line.match(/>(.*)$/);
    if (!emailEndMatch) {
        // Fallback to standard CSV parsing if no email found
        return standardCSVParse(line);
    }

    const afterEmail = emailEndMatch[1]; // Everything after the >
    const nameField = line.substring(0, line.length - afterEmail.length); // Everything before and including >

    // Parse remaining fields (attendance, response)
    const remainingFields = afterEmail.split(',').map(f => f.trim()).filter(Boolean);

    return [nameField, ...remainingFields];
};

/**
 * Standard CSV parser for quoted fields
 */
const standardCSVParse = (line: string): string[] => {
    const fields: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            fields.push(currentField.trim());
            currentField = '';
        } else {
            currentField += char;
        }
    }

    // Add last field
    fields.push(currentField.trim());

    return fields;
};

/**
 * Helper: Validate email address format
 */
const isValidEmail = (email: string): boolean => {
    const emailPattern = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;
    return emailPattern.test(email);
};

/**
 * IPG-owned email domains
 * This list includes all known IPG agencies and subsidiaries
 */
const IPG_DOMAINS = [
    // Core IPG domains
    'interpublic.com',
    'ipgnetwork.com',

    // Major agencies
    'momentumww.com',
    'mccann.com',
    'fcb.com',
    'fcbhealth.com',
    'mrm.com',
    'webershandwick.com',
    'golin.com',
    'octagon.com',
    'ipghealth.com',

    // Specialty agencies
    'jackmorton.com',
    'jackmorton.co.uk',
    'kinesso.com',
    'acxiom.com',
    'martinagency.com',
    'flipsidegroup.com',
    'mbww.com',
    'craftww.com',
    'dnacommunications.com',
    'epandco.com',
    'onevuembww.com',
    'ipglab.com',
    'solved.health',

    // Additional IPG domains
    'rafter.one',
    'pursway.com',

    // Note: rga.com and make.com are external partners, NOT IPG
];

/**
 * Detect if email is external (not from IPG network)
 */
export const isExternalEmail = (email: string): boolean => {
    const lowerEmail = email.toLowerCase();

    // Check if email matches any IPG domain
    for (const domain of IPG_DOMAINS) {
        if (lowerEmail.endsWith(`@${domain}`) || lowerEmail.includes(`@${domain}`)) {
            return false; // Internal
        }
    }

    // Check for generic IPG patterns
    if (lowerEmail.match(/@[a-z]+\.ipg/) || lowerEmail.includes('@ipg')) {
        return false; // Internal
    }

    // Check for Microsoft guest accounts (external users in IPG tenant)
    if (lowerEmail.includes('#ext#@interpublic.onmicrosoft.com')) {
        return true; // External guest
    }

    return true; // External
};

/**
 * Count detected contacts in text (for preview/UI display)
 */
export const countDetectedContacts = (text: string): number => {
    if (!text || text.trim().length === 0) return 0;

    // Try to detect format and count appropriately
    const outlookMatches = text.match(/"[^"]+"\s*<[^>]+>/g);
    if (outlookMatches) return outlookMatches.length;

    const emailMatches = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g);
    if (emailMatches) {
        // Deduplicate
        return new Set(emailMatches.map(e => e.toLowerCase())).size;
    }

    return 0;
};
