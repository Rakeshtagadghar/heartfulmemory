const MONTH_INDEX: Record<string, string> = {
  january: "01",
  jan: "01",
  february: "02",
  feb: "02",
  march: "03",
  mar: "03",
  april: "04",
  apr: "04",
  may: "05",
  june: "06",
  jun: "06",
  july: "07",
  jul: "07",
  august: "08",
  aug: "08",
  september: "09",
  sept: "09",
  sep: "09",
  october: "10",
  oct: "10",
  november: "11",
  nov: "11",
  december: "12",
  dec: "12"
};

function padMonth(value: string) {
  const month = Number(value);
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  return String(month).padStart(2, "0");
}

export function normalizeEntityDateValue(rawValue: string): string | null {
  const value = rawValue.trim();
  if (!value) return null;

  const yearOnly = value.match(/\b((?:18|19|20)\d{2})\b/);
  if (yearOnly && yearOnly[0] === value) return yearOnly[1];

  const yearMonthNumeric = value.match(/^((?:18|19|20)\d{2})[-/](\d{1,2})$/);
  if (yearMonthNumeric) {
    const month = padMonth(yearMonthNumeric[2]);
    return month ? `${yearMonthNumeric[1]}-${month}` : null;
  }

  const monthYearText = value.match(/^([A-Za-z]+)\s+((?:18|19|20)\d{2})$/);
  if (monthYearText) {
    const month = MONTH_INDEX[monthYearText[1].toLowerCase()];
    return month ? `${monthYearText[2]}-${month}` : null;
  }

  const dayMonthYearText = value.match(/^\d{1,2}\s+([A-Za-z]+)\s+((?:18|19|20)\d{2})$/);
  if (dayMonthYearText) {
    const month = MONTH_INDEX[dayMonthYearText[1].toLowerCase()];
    return month ? `${dayMonthYearText[2]}-${month}` : null;
  }

  return null;
}
