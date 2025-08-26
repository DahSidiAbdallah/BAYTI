export interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  type: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  rating: number;
  image: string;
  latitude?: number;
  longitude?: number;
}