export function normalizePhoneInput(value: string): string {
  return value
    .replace(/[^\d+\s().-]/g, "")
    .replace(/(?!^)\+/g, "");
}

export function toInternationalPhone(value: string): string | null {
  const trimmed = value.trim();
  const normalizedPrefix = trimmed.startsWith("00") ? `+${trimmed.slice(2)}` : trimmed;
  const digits = normalizedPrefix.replace(/\D/g, "");
  if (!normalizedPrefix.startsWith("+") || !/^[1-9]\d{7,14}$/.test(digits)) {
    return null;
  }
  return `+${digits}`;
}

export const internationalPhoneHint = "Utilisez le format international, par exemple +243 857068014.";
