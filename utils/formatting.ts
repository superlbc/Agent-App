/**
 * Converts markdown inline formatting (bold) into styled HTML tags.
 * @param text The plain text line to process.
 * @returns An HTML string with inline formatting applied.
 */
const processInlineMarkdown = (text: string): string => {
  // Chain replacements for different markdown syntaxes.
  // For bold: **text** or __text__
  // The regex uses a backreference (\1) to ensure opening and closing delimiters match.
  return text.replace(/(\*\*|__)(.*?)\1/g, (_match, _delimiter, content) => {
      return `<strong style="font-weight: 600;">${content}</strong>`;
  });
};


/**
 * Converts a markdown string into a styled HTML string, suitable for email clients and PDFs.
 * This implementation uses inline styles for maximum compatibility.
 */
export const markdownToHtml = (markdown: string): string => {
    let html = '';
    const lines = markdown.split('\n');
    let inList = false;
    let inTable = false;
    let tableHeaders: string[] = [];

    const styles = {
        body: `font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #334155; line-height: 1.6; font-size: 14px;`,
        h1: `font-size: 24px; font-weight: 600; color: #1e293b; margin-top: 24px; margin-bottom: 16px;`,
        h2: `font-size: 20px; font-weight: 600; color: #1e293b; margin-top: 32px; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;`,
        h3: `font-size: 16px; font-weight: 600; color: #1e293b; margin-top: 24px; margin-bottom: 12px;`,
        p: `margin: 0 0 16px;`,
        ul: `margin: 0 0 16px; padding-left: 24px;`,
        li: `margin-bottom: 8px;`,
        hr: `border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;`,
        table: `width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 16px; font-size: 12px;`,
        th: `border: 1px solid #e2e8f0; padding: 10px 14px; text-align: left; font-weight: 600; background-color: #f8fafc;`,
        td: `border: 1px solid #e2e8f0; padding: 10px 14px; text-align: left; vertical-align: top;`,
        evenRow: `background-color: #f8fafc;`
    };

    const flushList = () => {
        if (inList) {
            html += `</ul>`;
            inList = false;
        }
    };

    const flushTable = () => {
        if (inTable) {
            html += `</tbody></table>`;
            inTable = false;
            tableHeaders = [];
        }
    };

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();

        // Handle tab-separated tables (TSV format)
        // Tab-separated tables work universally in all email clients
        if (trimmedLine.includes('\t')) {
            flushList();
            const cells = trimmedLine.split('\t');

            // First row with tabs is the header
            if (!inTable) {
                html += `<table style="${styles.table}"><thead><tr>`;
                cells.forEach(header => {
                    html += `<th style="${styles.th}">${processInlineMarkdown(header.trim())}</th>`;
                });
                html += `</tr></thead><tbody>`;
                inTable = true;
            } else {
                // Data rows
                const isEven = (html.match(/<tr/g) || []).length % 2 === 1;
                html += `<tr style="${isEven ? styles.evenRow : ''}">`;
                cells.forEach(cell => {
                    html += `<td style="${styles.td}">${processInlineMarkdown(cell.trim())}</td>`;
                });
                html += `</tr>`;
            }
        } else if (trimmedLine.startsWith('|')) {
            flushList();
            const cells = trimmedLine.split('|').slice(1, -1).map(c => c.trim());
            if (lines[index + 1]?.trim().startsWith('|-')) {
                if (inTable) flushTable();
                html += `<table style="${styles.table}"><thead><tr>`;
                tableHeaders = cells;
                tableHeaders.forEach(header => {
                    html += `<th style="${styles.th}">${processInlineMarkdown(header)}</th>`;
                });
                html += `</tr></thead><tbody>`;
                inTable = true;
            } else if (inTable && !trimmedLine.includes('---')) {
                const isEven = (html.match(/<tr/g) || []).length % 2 === 1;
                html += `<tr style="${isEven ? styles.evenRow : ''}">`;
                cells.forEach(cell => {
                    html += `<td style="${styles.td}">${processInlineMarkdown(cell)}</td>`;
                });
                html += `</tr>`;
            }
        } else {
            flushList();
            flushTable();
            if (trimmedLine.startsWith('# ')) {
                html += `<h1 style="${styles.h1}">${processInlineMarkdown(trimmedLine.substring(2))}</h1>`;
            } else if (trimmedLine.startsWith('## ')) {
                html += `<h2 style="${styles.h2}">${processInlineMarkdown(trimmedLine.substring(3))}</h2>`;
            } else if (trimmedLine.startsWith('### ')) {
                html += `<h3 style="${styles.h3}">${processInlineMarkdown(trimmedLine.substring(4))}</h3>`;
            } else if (trimmedLine.startsWith('- ')) {
                if (!inList) {
                    html += `<ul style="${styles.ul}">`;
                    inList = true;
                }
                html += `<li style="${styles.li}">${processInlineMarkdown(trimmedLine.substring(2))}</li>`;
            } else if (trimmedLine === '---') {
                html += `<hr style="${styles.hr}" />`;
            } else if (trimmedLine.length > 0) {
                html += `<p style="${styles.p}">${processInlineMarkdown(trimmedLine)}</p>`;
            }
        }
    });

    flushList();
    flushTable();

    return `<div style="${styles.body}">${html}</div>`;
};