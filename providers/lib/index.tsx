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
    if (mapContextState.providerId === 'yandex' && mapContextState.mapInstance && editingZoneId) {
        const map = mapContextState.mapInstance;
        
        if (editingZoneId) {
            const target = zoneRegistry[editingZoneId];
            if (target) {
                // Включаем редактирование для конкретного объекта
                target.nativeObject.editor.start();
                
                // Подписываемся на событие изменения геометрии
                const onGeometryChange = (e: any) => {
                    const changedObject = e.get('target');
                    const newGeometry = changedObject.geometry.getCoordinates();
                    const newRadius = changedObject.geometry.getRadius ? changedObject.geometry.getRadius() : undefined;
                    
                    // Находим обработчик в реестре и вызываем его
                    const registeredZone = Object.entries(zoneRegistry).find(
                        ([_, value]) => value.nativeObject === changedObject
                    );
                    if (registeredZone) {
                        registeredZone[1].handler(newGeometry, newRadius);
                    }
                };
                
                target.nativeObject.events.add('geometrychange', onGeometryChange);

                // Функция очистки для отписки
                return () => {
                    target.nativeObject.events.remove('geometrychange', onGeometryChange);
                    // Важно: не останавливаем редактор, если переключаемся на редактирование другой зоны
                    if (target.nativeObject.editor.state.get('editing')) {
                       target.nativeObject.editor.stop();
                    }
                };
            }
        } else {
            // Если нет editingZoneId, выключаем все редакторы
            Object.values(zoneRegistry).forEach(item => {
                if (item.nativeObject.editor.state.get('editing')) {
                    item.nativeObject.editor.stop();
                }
            });
        }

    }
  }, [editingZoneId, mapContextState.mapInstance, mapContextState.providerId, zoneRegistry]);

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
      />
      {mapContextState.mapInstance && children}
    </GeoContext.Provider>
  );
}

// Удаляем Geo.displayName, т.к. Geo больше не forwardRef-компонент