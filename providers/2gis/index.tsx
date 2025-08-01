import { useEffect, useRef, useState, useContext } from 'react';
import { load } from '@2gis/mapgl';
import { GeoContext } from '../lib/index';
import { useResizeDetector } from 'react-resize-detector';

interface TwoGISMapProps {
  lng: number;
  lat: number;
  zoom?: number;
  width?: number | string;
  height?: number | string;
  [key: string]: any;
}

export default function TwoGISMap({ lng, lat, zoom = 13, onPosition, ...rest }: TwoGISMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const geoProvider = useContext(GeoContext);
  const { width, height, ref } = useResizeDetector();

  useEffect(() => {
    let map: any = null;

    // Асинхронная загрузка API 2ГИС
    if (width && height) {
      load().then((mapglAPI) => {
        // Проверяем, что контейнер существует и карта еще не создана
        if (mapContainerRef.current && !map) {
          // Создаем карту с заданными параметрами
          map = new mapglAPI.Map(mapContainerRef.current, {
            center: [lng, lat],
            zoom: zoom,
            key: process.env.NEXT_PUBLIC_2GIS_API_KEY || '',
          });

          // Сохраняем экземпляр карты в состоянии
          setMapInstance(map);
          
          // Простой обработчик изменения позиции - только для обновления инпутов
          if (onPosition) {
            map.on('moveend', () => {
              const center = map.getCenter();
              const currentZoom = map.getZoom();
              onPosition({
                lat: center[1],
                lng: center[0],
                zoom: currentZoom
              });
            });
            
            map.on('zoomend', () => {
              const center = map.getCenter();
              const currentZoom = map.getZoom();
              onPosition({
                lat: center[1],
                lng: center[0],
                zoom: currentZoom
              });
            });
          }
          
          // Передаем экземпляр карты в провайдер
          if (geoProvider && (geoProvider as any).setMapInstance) {
            (geoProvider as any).setMapInstance(map);
          }
        }
      });
    }

    // Очистка при размонтировании компонента
    return () => {
      if (mapInstance) {
        mapInstance.destroy();
        setMapInstance(null);
      }
    };
  }, [width, height]); // Создаем карту при изменении размеров

  // Обновляем центр карты при изменении пропсов (теперь всегда можно обновлять)
  useEffect(() => {
    if (mapInstance) {
      console.log('2GIS: Обновляем центр карты', { lat, lng });
      mapInstance.setCenter([lng, lat]);
    }
  }, [lng, lat, mapInstance]);

  // Обновляем зум карты при изменении пропсов (теперь всегда можно обновлять)
  useEffect(() => {
    if (mapInstance) {
      console.log('2GIS: Обновляем зум карты', zoom);
      mapInstance.setZoom(zoom);
    }
  }, [zoom, mapInstance]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }} ref={ref} {...rest}>
      <div style={{ position: 'absolute', width: '100%', height: '100%' }}>
        <div 
          ref={mapContainerRef} 
          style={{ width: '100%', height: '100%', borderRadius: '8px', overflow: 'hidden' }}
        />
      </div>
    </div>
  );
}

export class TwoGISGeoProvider {
  private mapInstance: any = null;
  
  GeoMap = TwoGISMap;
  
  // Императивные методы для обновления карты
  setCenter = (lat: number, lng: number) => {
    if (this.mapInstance) {
      this.mapInstance.setCenter([lng, lat]);
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
        this.mapInstance.setCenter([params.lng, params.lat]);
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