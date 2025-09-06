import { createContext } from 'react';
import { ProviderId, LatLng } from '@/lib/core/geo-types';

export interface GeoContextValue {
  providerId: ProviderId | null;
  mapInstance: any | null;
  ymaps?: any;
}

export const GeoContext = createContext<GeoContextValue | null>(null);

