import { useEffect, useRef, useState, useContext } from 'react';
import { load } from '@2gis/mapgl';
import { GeoContext } from '../../providers/lib/index';

interface TwoGISMapProps {
  lng: number;
  lat: number;
  zoom?: number;
  width?: number | string;
  height?: number | string;
  [key: string]: any;
}

export default function TwoGISMap({ lng, lat, zoom = 13, width = 600, height = 400, ...rest }: TwoGISMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const geoProvider = useContext(GeoContext);

  useEffect(() => {
    let map: any = null;

    // Асинхронная загрузка API 2ГИС
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
        
        // Передаем экземпляр карты в провайдер
        if (geoProvider && (geoProvider as any).setMapInstance) {
          (geoProvider as any).setMapInstance(map);
        }
      }
    });

    // Очистка при размонтировании компонента
    return () => {
      if (mapInstance) {
        mapInstance.destroy();
        setMapInstance(null);
      }
    };
  }, [geoProvider]); // Создаем карту только один раз при монтировании

  // Обновляем центр карты при изменении пропсов
  useEffect(() => {
    if (mapInstance) {
      mapInstance.setCenter([lng, lat]);
    }
  }, [lng, lat, mapInstance]);

  // Обновляем зум карты при изменении пропсов
  useEffect(() => {
    if (mapInstance) {
      mapInstance.setZoom(zoom);
    }
  }, [zoom, mapInstance]);

  return (
    <div 
      ref={mapContainerRef} 
      style={{ width, height, borderRadius: '8px', overflow: 'hidden' }}
      {...rest}
    />
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