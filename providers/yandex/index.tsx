/// <reference types="yandex-maps" />
import { YMaps, Map, useYMaps } from '@pbe/react-yandex-maps';
import { useEffect, useRef, useState, useContext } from 'react';
import { GeoContext } from '../lib/index';
import { useResizeDetector } from 'react-resize-detector';
import { markerEngine } from '@/lib/markers/engine';
import YandexMarkerAdapter from '@/lib/yandex/markers';
import { MarkerData, ProviderMarkerHandle, GeoObject, LatLng } from '@/lib/core/geo-types';

// Регистрируем адаптер при загруз-ке модуля
markerEngine.registerAdapter('yandex', YandexMarkerAdapter);

interface YandexMapProps {
  lng: number;
  lat: number;
  zoom?: number;
  width?: number | string;
  height?: number | string;
  onPosition?: (position: { lat: number; lng: number; zoom: number }) => void;
  onReady?: () => void; // Новый проп для обратного вызова
  [key: string]: any;
}

// Внутренний компонент, который использует useYMaps
function YandexMapInner({ lng, lat, zoom = 10, onPosition, onReady, ...rest }: Omit<YandexMapProps, 'width' | 'height'>) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const ymaps = useYMaps(['Map', 'Placemark']); // <-- УБИРАЕМ ЗАПРОС МОДУЛЯ GEOCODE
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
      
      // Вызываем onReady, если он передан
      if (onReady) {
        onReady();
      }
      
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
      
      // Передаем контекст карты в провайдер
      if (geoProvider && (geoProvider as any).setMapContext) {
        (geoProvider as any).setMapContext({ map, ymaps });
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
  private mapContext: { map: any, ymaps: any } | null = null;
  
  GeoMap = YandexMap;
  
  // Получение экземпляра карты
  getMapInstance = () => this.mapContext?.map;

  // Императивные методы для обновления карты
  setCenter = (lat: number, lng: number) => {
    if (this.mapContext?.map) {
      this.mapContext.map.setCenter([lat, lng]);
    }
  };
  
  setZoom = (zoom: number) => {
    if (this.mapContext?.map) {
      this.mapContext.map.setZoom(zoom);
    }
  };
  
  updateMap = (params: any) => {
    if (this.mapContext?.map) {
      if (params.lat !== undefined && params.lng !== undefined) {
        this.mapContext.map.setCenter([params.lat, params.lng]);
      }
      if (params.zoom !== undefined) {
        this.mapContext.map.setZoom(params.zoom);
      }
    }
  };
  
  // Метод для установки экземпляра карты
  setMapContext = (context: { map: any, ymaps: any }) => {
    this.mapContext = context;
  };

  // --- МЕТОДЫ ДЛЯ РАБОТЫ С МАРКЕРАМИ ---

  addMarker = (marker: MarkerData, onDragEnd: (newPosition: { lat: number, lng: number }) => void): ProviderMarkerHandle => {
    if (!this.mapContext) throw new Error("Yandex map context is not available.");
    return markerEngine.mount('yandex', this.mapContext, marker, onDragEnd);
  };

  removeMarker = (handle: ProviderMarkerHandle) => {
    if (!this.mapContext) throw new Error("Yandex map context is not available.");
    markerEngine.unmount('yandex', handle);
  };

  updateMarker = (handle: ProviderMarkerHandle, marker: MarkerData) => {
    if (!this.mapContext) throw new Error("Yandex map context is not available.");
    
    const placemark = handle.nativeHandle;

    // Обновляем текст (хинт, балун, контент)
    placemark.properties.set({
      hintContent: marker.meta?.title,
      balloonContent: marker.meta?.description,
      iconContent: marker.meta?.icon?.url ? undefined : marker.meta?.label,
    });

    // Обновляем иконку
    if (marker.meta?.icon?.url) {
      placemark.options.set({
        // Используем кастомную иконку (текст игнорируется)
        iconLayout: 'default#image',
        iconImageHref: marker.meta.icon.url,
        iconImageSize: [marker.meta.icon.width, marker.meta.icon.height],
        iconImageOffset: [-(marker.meta.icon.anchorX || 0), -(marker.meta.icon.anchorY || 0)],
        preset: undefined // Сбрасываем пресет, если есть кастомная иконка
      });
    } else {
      placemark.options.set({
        // Используем стандартную иконку, которая покажет текст
        iconLayout: undefined,
        iconImageHref: undefined,
        iconImageSize: undefined,
        iconImageOffset: undefined,
        preset: 'islands#blueStretchyIcon'
      });
    }
  };

  updateMarkerPosition = (handle: ProviderMarkerHandle, position: { lat: number, lng: number }) => {
    if (!this.mapContext) throw new Error("Yandex map context is not available.");
    // Обращаемся напрямую к нативному объекту, чтобы изменить его геометрию
    handle.nativeHandle.geometry.setCoordinates([position.lat, position.lng]);
  };

  onMapClick = (callback: (coords: { lat: number, lng: number }) => void): (() => void) => {
    if (!this.mapContext) throw new Error("Yandex map context is not available.");
    return markerEngine.subscribeMapClick('yandex', this.mapContext, callback);
  };
  
  // --- МЕТОДЫ ДЛЯ ГЕОКОДИНГА (теперь через наш API) ---

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