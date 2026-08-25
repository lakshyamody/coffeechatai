export interface City {
  name: string;
  /** UTC offset in hours. */
  offset: number;
  /**
   * Relative member density. Drives the demo pool, and is why nobody in a
   * one-person city is generated as in-person-only.
   */
  weight: number;
}

export const CITIES: City[] = [
  { name: "San Francisco", offset: -8, weight: 16 },
  { name: "New York", offset: -5, weight: 14 },
  { name: "London", offset: 0, weight: 11 },
  { name: "Bangalore", offset: 5.5, weight: 9 },
  { name: "Toronto", offset: -5, weight: 7 },
  { name: "Berlin", offset: 1, weight: 6 },
  { name: "Seattle", offset: -8, weight: 6 },
  { name: "Austin", offset: -6, weight: 5 },
  { name: "Boston", offset: -5, weight: 4 },
  { name: "Singapore", offset: 8, weight: 4 },
  { name: "Amsterdam", offset: 1, weight: 3 },
  { name: "Tel Aviv", offset: 2, weight: 3 },
  { name: "Waterloo", offset: -5, weight: 3 },
  { name: "Tokyo", offset: 9, weight: 3 },
  { name: "Lagos", offset: 1, weight: 2 },
  { name: "Sydney", offset: 11, weight: 2 },
  { name: "São Paulo", offset: -3, weight: 2 },
  { name: "Delhi", offset: 5.5, weight: 4 },
  { name: "Chennai", offset: 5.5, weight: 3 },
  { name: "Hyderabad", offset: 5.5, weight: 3 },
  { name: "Philadelphia", offset: -5, weight: 2 },
  { name: "Pittsburgh", offset: -5, weight: 2 },
  { name: "Los Angeles", offset: -8, weight: 3 },
  { name: "Chicago", offset: -6, weight: 3 },
  { name: "New Haven", offset: -5, weight: 0 },
  { name: "Princeton", offset: -5, weight: 0 },
  { name: "Ithaca", offset: -5, weight: 0 },
  { name: "Providence", offset: -5, weight: 0 },
  { name: "Hanover", offset: -5, weight: 0 },
  { name: "Kanpur", offset: 5.5, weight: 0 },
  { name: "Kolkata", offset: 5.5, weight: 0 },
  { name: "Pilani", offset: 5.5, weight: 0 },
  { name: "Zürich", offset: 1, weight: 0 },
  { name: "Montréal", offset: -5, weight: 0 },
  { name: "Atlanta", offset: -5, weight: 0 },
  { name: "Mumbai", offset: 5.5, weight: 0 },
  { name: "Delft", offset: 1, weight: 0 },
];

export const cityByName = (name: string) => CITIES.find((c) => c.name === name);
