export function normalizePhoneInput(value: string): string {
  return value
    .replace(/[^\d+\s().-]/g, "")
    .replace(/(?!^)\+/g, "");
}

export function toInternationalPhone(value: string): string | null {
  const compact = value
    .normalize("NFKC")
    .replace(/[\s\u200B\uFEFF().-]/g, "");
  const normalizedPrefix = compact.startsWith("00") ? `+${compact.slice(2)}` : compact;
  const digits = normalizedPrefix.replace(/\D/g, "");
  if (!normalizedPrefix.startsWith("+") || !/^[1-9]\d{7,14}$/.test(digits)) {
    return null;
  }
  return `+${digits}`;
}

export const internationalPhoneHint = "Utilisez le format international, par exemple +243 857068014.";
