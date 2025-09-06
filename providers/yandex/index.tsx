/// <reference types="yandex-maps" />
import { YMaps, Map, useYMaps } from '@pbe/react-yandex-maps';
import { useEffect, useRef, useState, useContext } from 'react';
import { useResizeDetector } from 'react-resize-detector';
import { markerEngine } from '@/lib/markers/engine';
import YandexMarkerAdapter from '@/lib/yandex/markers';
import { GeoObject, LatLng } from '@/lib/core/geo-types';
import { zoneEngine } from '@/lib/zones/engine';
import { YandexZoneAdapter } from '@/lib/yandex/zones';
import { GeoContext } from '@/providers/lib/context';

// Регистрируем адаптеры при загрузке модуля
markerEngine.registerAdapter('yandex', YandexMarkerAdapter);
zoneEngine.registerAdapter('yandex', new YandexZoneAdapter());

interface YandexMapProps {
  lng: number;
  lat: number;
  zoom?: number;
  width?: number | string;
  height?: number | string;
  onPosition?: (position: { lat: number; lng: number; zoom: number }) => void;
  onReady?: (mapInstance: any, api: any) => void;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  children?: React.ReactNode;
}

// Внутренний компонент, который использует useYMaps
function YandexMapInner({ lng, lat, zoom = 10, onPosition, onReady, onMapClick, children }: YandexMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const ymaps = useYMaps(['Map', 'Placemark', 'Circle', 'Polygon', 'Polyline', 'geoObject.addon.editor']);
  const { width, height, ref } = useResizeDetector();

  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  useEffect(() => {
    // Проверяем, что ymaps загружен, API готов и контейнер существует
    if (ymaps && ymaps.Map && mapContainer.current && !mapInstance && width && height) {
      const map = new ymaps.Map(mapContainer.current, {
        center: [lat, lng],
        zoom,
      });
      setMapInstance(map);
      
      // Простой обработчик изменения позиции - только для обновления инпутов
      if (onPosition) {
        map.events.add(['boundschange'], () => {
          const center = map.getCenter();
          const currentZoom = map.getZoom();
          onPosition({
            lat: center[0],
            lng: center[1],
            zoom: currentZoom
          });
        });
      }
      
      // Добавляем обработчик клика по карте
      map.events.add('click', (e: any) => {
        if (onMapClickRef.current) {
          const coords = e.get('coords');
          onMapClickRef.current({ lat: coords[0], lng: coords[1] });
        }
      });

      // Вызываем onReady с экземплярами карты и API
      if (onReady) {
        onReady(map, ymaps);
      }
    }

    return () => {
      if (mapInstance) {
        mapInstance.destroy();
        setMapInstance(null);
      }
    }
  }, [ymaps, width, height]); // Создаем карту только один раз при загрузке API

  // Обновляем центр карты при изменении пропсов (теперь всегда можно обновлять)
  useEffect(() => {
    if (mapInstance) {
      console.log('Yandex: Обновляем центр карты', { lat, lng });
      mapInstance.setCenter([lat, lng]);
    }
  }, [lat, lng, mapInstance]);

  // Обновляем зум карты при изменении пропсов (теперь всегда можно обновлять)
  useEffect(() => {
    if (mapInstance) {
      console.log('Yandex: Обновляем зум карты', zoom);
      mapInstance.setZoom(zoom);
    }
  }, [zoom, mapInstance]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }} ref={ref}>
        <div 
          ref={mapContainer} 
          style={{ width: '100%', height: '100%', borderRadius: '8px', overflow: 'hidden' }}
        />
        {children}
    </div>
  );
}

// Внешний компонент с провайдером YMaps
export default function YandexMap(props: YandexMapProps) {
  return (
    <YMaps
      query={{
        apikey: process.env.NEXT_PUBLIC_YANDEX_API_KEY || '',
        lang: 'ru_RU',
      }}
    >
      <YandexMapInner {...props} />
    </YMaps>
  );
}

export class YandexGeoProvider {
  private mapInstance: any = null;
  
  GeoMap = YandexMap;
  
  // Императивные методы для обновления карты
  setCenter = (lat: number, lng: number) => {
    if (this.mapInstance) {
      this.mapInstance.setCenter([lat, lng]);
    }
  };
  
  setZoom = (zoom: number) => {
    if (this.mapInstance) {
      this.mapInstance.setZoom(zoom);
    }
  };
  
  updateMap = (params: any) => {
    if (this.mapInstance) {
      if (params.lat !== undefined && params.lng !== undefined) {
        this.mapInstance.setCenter([params.lat, params.lng]);
      }
      if (params.zoom !== undefined) {
        this.mapInstance.setZoom(params.zoom);
      }
    }
  };
  
  // Метод для установки экземпляра карты
  setMapInstance = (instance: any) => {
    this.mapInstance = instance;
  };
  
  // Методы геокодинга оставляем, так как они используются в /lib/geocode/index.ts
  geocode = async (address: string): Promise<GeoObject[]> => {
    try {
      const response = await fetch(`/api/geocode?provider=yandex&address=${encodeURIComponent(address)}`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Ошибка при поиске адреса');
      }
      return await response.json();
    } catch (error) {
      console.error("Yandex geocode error:", error);
      return [];
    }
  };

  reverseGeocode = async (position: LatLng): Promise<GeoObject[]> => {
    try {
      const response = await fetch(`/api/geocode?provider=yandex&lat=${position.lat}&lng=${position.lng}`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Ошибка при обратном геокодировании');
      }
      return await response.json();
    } catch (error) {
      console.error("Yandex reverse geocode error:", error);
      return [];
    }
  };
}