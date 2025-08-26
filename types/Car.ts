export interface Car {
  id: string;
  name: string;
  brand: string;
  year: number;
  pricePerDay: number;
  seats: number;
  fuelType: string;
  rating: number;
  image: string;
  available: boolean;
  latitude?: number;
  longitude?: number;
}