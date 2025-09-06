import React, { useContext, useEffect, useMemo, useState, useCallback } from 'react';
import YandexMap from '../yandex/index';
import GoogleMap from '../google/index';
import TwoGISMap from '../2gis/index';
import { MarkerData, ProviderMarkerHandle, GeoObject, LatLng, ZoneData, ProviderZoneHandle, ProviderId } from '@/lib/core/geo-types';
import { GeoContext, GeoContextValue, ZoneEditHandler } from './context';

export interface GeoMapProps {
    lat: number;
    lng: number;
    zoom?: number;
    width?: number | string;
    height?: number | string;
    onPosition?: (position: { lat: number; lng: number; zoom: number }) => void;
    // onReady теперь принимает более полную информацию
    onReady?: (mapInstance: any, api: any) => void;
    onMapClick?: (coords: { lat: number; lng: number }) => void;
}

// Этот интерфейс больше не используется для ref, но сохраним для описания провайдера
export interface GeoProvider {
    GeoMap: React.ComponentType<GeoMapProps>;
}

// Удаляем GeoImperativeHandle

// Старый GeoContext удаляем, так как он импортируется из ./context
// export const GeoContext = createContext<GeoProvider | undefined>(undefined);
export const useGeo = () => {
    const context = useContext(GeoContext);
    if (!context) {
        throw new Error('useGeo must be used within a Geo provider');
    }
    return context;
};

const classes: Record<string, any> = {
    yandex: YandexMap,
    google: GoogleMap,
    '2gis': TwoGISMap,
}; 

export interface GeoProps extends GeoMapProps {
    provider: ProviderId;
    children?: React.ReactNode;
    editingZoneId?: string | null; // Проп для управления редактированием зон Яндекса
}

export function Geo({ provider, children, onPosition, onReady, onMapClick, editingZoneId, ...mapProps }: GeoProps) {
  const [mapContextState, setMapContextState] = useState<{
    providerId: ProviderId | null;
    mapInstance: any | null;
    ymaps: any | null;
  }>({
    providerId: null,
    mapInstance: null,
    ymaps: null
  });

  const [zoneRegistry, setZoneRegistry] = useState<Record<string, { nativeObject: any, handler: ZoneEditHandler }>>({});

  const registerZone = useCallback((id: string, nativeObject: any, handler: ZoneEditHandler) => {
    setZoneRegistry(prev => ({ ...prev, [id]: { nativeObject, handler } }));
  }, []);

  const unregisterZone = useCallback((id: string) => {
    setZoneRegistry(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  useEffect(() => {
    // Централизованное управление редактором Яндекс.Карт
    if (mapContextState.providerId !== 'yandex' || !mapContextState.mapInstance) {
        return;
    }

    // Сначала останавливаем редактирование для всех зон, кроме текущей
    Object.entries(zoneRegistry).forEach(([id, { nativeObject }]) => {
        if (id !== editingZoneId && nativeObject.editor.state.get('editing')) {
            nativeObject.editor.stop();
        }
    });

    // Теперь активируем редактор для нужной зоны
    const target = editingZoneId ? zoneRegistry[editingZoneId] : null;
    if (target) {
        if (!target.nativeObject.editor.state.get('editing')) {
            target.nativeObject.editor.start();
        }

        const onGeometryChange = (e: any) => {
            const changedObject = e.get('target');
            // Убедимся, что событие пришло от нашего целевого объекта
            if (changedObject === target.nativeObject) {
                const newNativeGeometry = changedObject.geometry.getCoordinates();
                const newRadius = changedObject.geometry.getRadius ? changedObject.geometry.getRadius() : undefined;
                
                // Используем fromYandexCoords для конвертации
                const fromYandexCoords = (yandexCoords: number[] | number[][]): LatLng | LatLng[] => {
                    if (Array.isArray(yandexCoords[0])) { // Массив массивов
                        return (yandexCoords as number[][]).map(p => ({ lat: p[0], lng: p[1] }));
                    }
                    const p = yandexCoords as number[];
                    return { lat: p[0], lng: p[1] };
                };
                
                if (newNativeGeometry) {
                    const newCoords = fromYandexCoords(newNativeGeometry);
                    target.handler(newCoords, newRadius);
                }
            }
        };

        // Используем editor.events, а не events самого объекта
        target.nativeObject.editor.events.add('geometrychange', onGeometryChange);

        return () => {
            target.nativeObject.editor.events.remove('geometrychange', onGeometryChange);
            // Останавливаем редактор только если компонент размонтируется или ID изменится
            // и он все еще активен
            if (target.nativeObject.editor.state.get('editing')) {
                target.nativeObject.editor.stop();
            }
        };
    }
  }, [editingZoneId, mapContextState.providerId, zoneRegistry]);

  const contextValue = useMemo<GeoContextValue>(() => ({
    ...mapContextState,
    registerZone,
    unregisterZone,
  }), [mapContextState, registerZone, unregisterZone]);

  const handleMapReady = useCallback((mapInstance: any, api: any) => {
    setMapContextState({
        providerId: provider,
        mapInstance: mapInstance,
        ymaps: api,
    });
    if (onReady) {
        onReady(mapInstance, api);
    }
  }, [provider, onReady]);

  const GeoMap = useMemo(() => {
    if (provider === 'yandex') return YandexMap;
    if (provider === 'google') return GoogleMap;
    if (provider === '2gis') return TwoGISMap;
    return () => <div className="flex items-center justify-center h-full bg-gray-100">Выберите провайдера</div>;
  }, [provider]);

  return (
    <GeoContext.Provider value={contextValue}>
      <GeoMap
        {...mapProps}
        onReady={handleMapReady}
        onPosition={onPosition}
        onMapClick={onMapClick}
      >
        {mapContextState.mapInstance && mapContextState.ymaps && children}
      </GeoMap>
    </GeoContext.Provider>
  );
}

// Удаляем Geo.displayName, т.к. Geo больше не forwardRef-компонент