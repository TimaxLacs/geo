/// <reference types="yandex-maps" />
import { YMaps, Map, useYMaps } from '@pbe/react-yandex-maps';
import { useEffect, useRef, useState } from 'react';

interface YandexMapProps {
  lng: number;
  lat: number;
  zoom?: number;
  width?: number | string;
  height?: number | string;
  [key: string]: any;
}

// Внутренний компонент, который использует useYMaps
function YandexMapInner({ lng, lat, zoom = 10, width = 600, height = 400, ...rest }: YandexMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const ymaps = useYMaps(['Map']);

  useEffect(() => {
    // Проверяем, что ymaps загружен, API готов и контейнер существует
    if (ymaps && ymaps.Map && mapContainer.current && !mapInstance) {
      const map = new ymaps.Map(mapContainer.current, {
        center: [lat, lng],
        zoom,
      });
      setMapInstance(map);
    }

    return () => {
      if (mapInstance) {
        mapInstance.destroy();
        setMapInstance(null);
      }
    }
  }, [ymaps]); // Создаем карту только один раз при загрузке API

  // Обновляем центр карты при изменении пропсов
  useEffect(() => {
    if (mapInstance) {
      mapInstance.setCenter([lat, lng]);
    }
  }, [lat, lng, mapInstance]);

  // Обновляем зум карты при изменении пропсов
  useEffect(() => {
    if (mapInstance) {
      mapInstance.setZoom(zoom);
    }
  }, [zoom, mapInstance]);

  return (
    <div 
      ref={mapContainer} 
      style={{ width, height, borderRadius: '8px', overflow: 'hidden' }}
      {...rest}
    />
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
  GeoMap = YandexMap;
}