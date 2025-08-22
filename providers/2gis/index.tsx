import { useEffect, useRef, useState, useContext } from 'react';
import { load } from '@2gis/mapgl';
import { GeoContext } from '../lib/index';
import { useResizeDetector } from 'react-resize-detector';
import { MarkerData, ProviderMarkerHandle, LatLng } from '@/lib/core/geo-types';
import { markerEngine } from '@/lib/markers/engine';
import TwoGISMarkerAdapter from '@/lib/2gis/markers';
import { GeoObject } from '@/lib/core/geo-types';

// Регистрируем адаптер при загрузке модуля
markerEngine.registerAdapter('2gis', TwoGISMarkerAdapter);

interface TwoGISMapProps {
  lng: number;
  lat: number;
  zoom?: number;
  width?: number | string;
  height?: number | string;
  onPosition?: (position: { lat: number; lng: number; zoom: number }) => void;
  onReady?: () => void; // Добавляем поддержку onReady
  [key: string]: any;
}

export default function TwoGISMap({ lng, lat, zoom = 13, onPosition, onReady, ...rest }: TwoGISMapProps) {
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
          
          // Вызываем onReady, если он передан
          if (onReady) {
            onReady();
          }
          
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
          
          // Передаем экземпляр карты и API в провайдер
          if (geoProvider && (geoProvider as any).setMapContext) {
            (geoProvider as any).setMapContext({ map, mapglAPI });
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
  setMapContext = (context: { map: any, mapglAPI: any }) => {
    this.mapInstance = context.map;
    // Сохраняем и mapglAPI для создания маркеров
    (this as any).mapglAPI = context.mapglAPI;
  };

  // --- МЕТОДЫ ДЛЯ РАБОТЫ С МАРКЕРАМИ ---

  addMarker = (marker: MarkerData, onDragEnd: (newPosition: LatLng) => void): ProviderMarkerHandle => {
    if (!this.mapInstance || !(this as any).mapglAPI) throw new Error("2GIS map context is not available.");
    return markerEngine.mount('2gis', { map: this.mapInstance, mapglAPI: (this as any).mapglAPI }, marker, onDragEnd);
  };

  removeMarker = (handle: ProviderMarkerHandle) => {
    markerEngine.unmount('2gis', handle);
  };

  updateMarker = (handle: ProviderMarkerHandle, marker: MarkerData) => {
    const twoGisMarker = handle.nativeHandle as any;
    if (!twoGisMarker) return;

    // API 2ГИС не предоставляет простых методов для обновления, поэтому пересоздаем
    // Это может быть неоптимально, но гарантирует консистентность
    twoGisMarker.destroy();
    const newHandle = this.addMarker(marker, () => {}); // onDragEnd будет пустым, т.к. он уже назначен
    handle.nativeHandle = newHandle.nativeHandle; // Обновляем ссылку на нативный объект
  };

  updateMarkerPosition = (handle: ProviderMarkerHandle, position: LatLng) => {
    handle.nativeHandle.setCoordinates([position.lng, position.lat]);
  };

  onMapClick = (callback: (coords: LatLng) => void): (() => void) => {
    if (!this.mapInstance) throw new Error("2GIS map instance is not available.");
    return markerEngine.subscribeMapClick('2gis', { map: this.mapInstance }, callback);
  };
  
  // --- МЕТОДЫ ДЛЯ ГЕОКОДИНГА (через наш API) ---

  geocode = async (address: string): Promise<GeoObject[]> => {
    try {
      const response = await fetch(`/api/geocode?provider=2gis&address=${encodeURIComponent(address)}`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Ошибка при поиске адреса в 2ГИС');
      }
      return await response.json();
    } catch (error) {
      console.error("2GIS geocode error:", error);
      return [];
    }
  };

  reverseGeocode = async (position: LatLng): Promise<GeoObject[]> => {
    try {
      const response = await fetch(`/api/geocode?provider=2gis&lat=${position.lat}&lng=${position.lng}`);
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Ошибка при обратном геокодировании в 2ГИС');
      }
      return await response.json();
    } catch (error) {
      console.error("2GIS reverse geocode error:", error);
      return [];
    }
  };
} 