/** Minimal CSV parser (quotes, commas, semicolons, tabs). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const delim = /[,;\t]/;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (delim.test(c)) {
      row.push(cell.trim());
      cell = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

export interface CsvLeadRow {
  name: string;
  phone: string;
  email?: string;
  duration?: number;
}

/** Maps a CSV (with or without header) into name/phone/email/duration rows. */
export function csvToLeadRows(text: string): CsvLeadRow[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.toLowerCase());
  const hasHeader = header.some((h) =>
    /name|phone|mobile|whatsapp|email|duration|minutes/.test(h)
  );
  const find = (re: RegExp) => header.findIndex((h) => re.test(h));
  const iName = hasHeader ? find(/name/) : 0;
  const iPhone = hasHeader ? find(/phone|mobile|whatsapp|msisdn/) : 1;
  const iEmail = hasHeader ? find(/email/) : 2;
  const iDur = hasHeader ? find(/duration|minutes|time/) : -1;
  return (hasHeader ? rows.slice(1) : rows)
    .map((r) => ({
      name: (iName >= 0 ? r[iName] : "") || "Lead",
      phone: (iPhone >= 0 ? r[iPhone] : r[0]) || "",
      email: iEmail >= 0 ? r[iEmail] : undefined,
      duration:
        iDur >= 0 && r[iDur] ? Number(r[iDur].replace(/\D/g, "")) || undefined : undefined,
    }))
    .filter((r) => r.phone);
}

