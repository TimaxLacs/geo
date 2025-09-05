import { createContext } from 'react';
import { ProviderId, LatLng } from '@/lib/core/geo-types';

// Тип для обработчика событий редактирования зоны
export type ZoneEditHandler = (newGeometry: LatLng[] | LatLng, newRadius?: number) => void;

export interface GeoContextValue {
  providerId: ProviderId | null;
  mapInstance: any | null;
  ymaps?: any;
  // Реестр для связи нативных объектов с их onChange колбэками (для Яндекса)
  registerZone: (id: string, nativeObject: any, handler: ZoneEditHandler) => void;
  unregisterZone: (id: string) => void;
}

export const GeoContext = createContext<GeoContextValue | null>(null);

