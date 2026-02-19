export interface DentalService {
  id: string;
  name: string;
  cost: number;
  durationMinutes: number | null;
  description: string | null;
  isActive: boolean;
  claveProdServ: string | null;
  claveUnidad: string | null;
}
