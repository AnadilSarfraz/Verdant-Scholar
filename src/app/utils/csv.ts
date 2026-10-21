/**
 * Minimal CSV helpers — no external dependencies.
 *
 * Escaping follows RFC 4180: a value is wrapped in double quotes when it contains a
 * comma, a double quote, a carriage return, or a line feed; any embedded double
 * quotes are escaped by doubling them.
 */

/** Escapes a single value for inclusion in a CSV row. */
export function escapeCsvValue(value: unknown): string {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Builds a CSV document from a list of records. The column order is taken from the
 * keys of the first record, so every record must carry the same keys.
 */
export function buildCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return '';

  const headers = Object.keys(rows[0]);
  const lines = [headers.map(escapeCsvValue).join(',')];
  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsvValue(row[header])).join(','));
  }
  // CRLF line endings, as Excel expects.
  return lines.join('\r\n');
}

/**
 * Triggers a browser download of `csv` as `filename`.
 *
 * A UTF-8 byte-order mark is prepended so Microsoft Excel detects the encoding
 * instead of falling back to the local code page.
 */
export function downloadCsv(csv: string, filename = 'students.csv'): void {
  const blob = new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
