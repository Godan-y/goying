export const KINSHASA_COMMUNES = [
  "Bandalungwa",
  "Barumbu",
  "Bumbu",
  "Gombe",
  "Kalamu",
  "Kasa-Vubu",
  "Kimbanseke",
  "Kinshasa",
  "Kintambo",
  "Kisenso",
  "Lemba",
  "Limete",
  "Lingwala",
  "Makala",
  "Maluku",
  "Masina",
  "Matete",
  "Mont-Ngafula",
  "N'Djili",
  "Ngaba",
  "Ngaliema",
  "Ngiri-Ngiri",
  "N'Sele",
  "Selembao",
] as const;

export function isKinshasaCommune(value: string): boolean {
  return KINSHASA_COMMUNES.includes(value as typeof KINSHASA_COMMUNES[number]);
}
