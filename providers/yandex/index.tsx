/// <reference types="yandex-maps" />
import { YMaps, Map, useYMaps } from '@pbe/react-yandex-maps';
import { useEffect, useRef, useState, useContext } from 'react';
import { GeoContext } from '../../providers/lib/index';
import { useResizeDetector } from 'react-resize-detector';

interface YandexMapProps {
  lng: number;
  lat: number;
  zoom?: number;
  width?: number | string;
  height?: number | string;
  [key: string]: any;
}

// Внутренний компонент, который использует useYMaps
function YandexMapInner({ lng, lat, zoom = 10, onPosition, ...rest }: Omit<YandexMapProps, 'width' | 'height'>) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const ymaps = useYMaps(['Map']);
  const geoProvider = useContext(GeoContext);
  const { width, height, ref } = useResizeDetector();

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
      
      // Передаем экземпляр карты в провайдер
      if (geoProvider && (geoProvider as any).setMapInstance) {
        (geoProvider as any).setMapInstance(map);
      }
    }

    return () => {
      if (mapInstance) {
        mapInstance.destroy();
        setMapInstance(null);
      }
    }
  }, [ymaps, geoProvider, width, height]); // Создаем карту только один раз при загрузке API

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
    <div style={{ width: '100%', height: '100%', position: 'relative' }} ref={ref} {...rest}>
      <div style={{ position: 'absolute', width: '100%', height: '100%' }}>
        <div 
          ref={mapContainer} 
          style={{ width: '100%', height: '100%', borderRadius: '8px', overflow: 'hidden' }}
        />
      </div>
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
}