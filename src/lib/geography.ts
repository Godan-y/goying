export interface ActivityCity {
  name: string;
  eligible: boolean;
  subdivisionLabel?: string;
  subdivisions?: readonly string[];
}

export interface ActivityCountry {
  name: string;
  label: string;
  cities: readonly ActivityCity[];
}

export const KINSHASA_COMMUNES = [
  "Bandalungwa", "Barumbu", "Bumbu", "Gombe", "Kalamu", "Kasa-Vubu",
  "Kimbanseke", "Kinshasa", "Kintambo", "Kisenso", "Lemba", "Limete",
  "Lingwala", "Makala", "Maluku", "Masina", "Matete", "Mont-Ngafula",
  "N'Djili", "Ngaba", "Ngaliema", "Ngiri-Ngiri", "N'Sele", "Selembao",
] as const;

export const ACTIVITY_COUNTRIES: readonly ActivityCountry[] = [
  {
    name: "RDC",
    label: "République démocratique du Congo (+243)",
    cities: [
      { name: "Kinshasa", eligible: true, subdivisionLabel: "Commune", subdivisions: KINSHASA_COMMUNES },
      { name: "Lubumbashi", eligible: true, subdivisionLabel: "Commune", subdivisions: ["Annexe", "Kamalondo", "Kampemba", "Katuba", "Kenya", "Lubumbashi", "Rwashi"] },
      { name: "Goma", eligible: true, subdivisionLabel: "Commune", subdivisions: ["Goma", "Karisimbi"] },
      { name: "Kolwezi", eligible: true, subdivisionLabel: "Commune", subdivisions: ["Dilala", "Manika"] },
      { name: "Matadi", eligible: true, subdivisionLabel: "Commune", subdivisions: ["Matadi", "Mvuzi", "Nzanza"] },
      { name: "Bukavu", eligible: true, subdivisionLabel: "Commune", subdivisions: ["Bagira", "Ibanda", "Kadutu"] },
    ],
  },
  { name: "Côte d'Ivoire", label: "Côte d'Ivoire (+225)", cities: [{ name: "Abidjan", eligible: false }] },
  { name: "Sénégal", label: "Sénégal (+221)", cities: [{ name: "Dakar", eligible: false }] },
  { name: "Cameroun", label: "Cameroun (+237)", cities: [{ name: "Douala", eligible: false }] },
  { name: "Zambie", label: "Zambie (+260)", cities: [{ name: "Lusaka", eligible: false }] },
  { name: "France", label: "France (+33)", cities: [{ name: "Paris", eligible: false }] },
  { name: "Canada", label: "Canada (+1)", cities: [{ name: "Montréal", eligible: false }] },
];

export function citiesForCountry(countryName: string): readonly ActivityCity[] {
  return ACTIVITY_COUNTRIES.find((country) => country.name === countryName)?.cities || [];
}

export function cityForArea(countryName: string, cityName: string): ActivityCity | undefined {
  return citiesForCountry(countryName).find((city) => city.name === cityName);
}

export function isEligibleArea(countryName: string, cityName: string): boolean {
  return cityForArea(countryName, cityName)?.eligible === true;
}

export function isKnownSubdivision(countryName: string, cityName: string, subdivision: string): boolean {
  return Boolean(cityForArea(countryName, cityName)?.subdivisions?.includes(subdivision));
}
