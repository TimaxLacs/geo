import { useEffect, useRef, useState, useContext } from 'react';
import { Map, APIProvider, useMap } from '@vis.gl/react-google-maps';
import { GeoContext } from '../../providers/lib/index';
import { useResizeDetector } from 'react-resize-detector';

interface GoogleMapProps {
  lng: number;
  lat: number;
  zoom?: number;
  width?: number | string;
  height?: number | string;
  [key: string]: any;
}


// Внутренний компонент, который использует useMap
function GoogleMapInner({ lng, lat, zoom = 13, onPosition }: { 
  lng: number; 
  lat: number; 
  zoom?: number; 
  onPosition?: (position: { lat: number; lng: number; zoom: number }) => void;
}) {
  const map = useMap();
  const geoProvider = useContext(GeoContext);

  // Передаем экземпляр карты в провайдер при первом рендере
  useEffect(() => {
    if (map && geoProvider && (geoProvider as any).setMapInstance) {
      (geoProvider as any).setMapInstance(map);
    }
  }, [map, geoProvider]);

  // Простой обработчик изменения позиции - только для обновления инпутов
  useEffect(() => {
    if (map && onPosition) {
      const handlePositionChange = () => {
        const center = map.getCenter();
        const currentZoom = map.getZoom();
        if (center) {
          onPosition({
            lat: center.lat(),
            lng: center.lng(),
            zoom: currentZoom || zoom
          });
        }
      };

      const listeners = [
        map.addListener('dragend', handlePositionChange),
        map.addListener('zoom_changed', handlePositionChange)
      ];

      return () => {
        listeners.forEach(listener => {
          if (listener && listener.remove) {
            listener.remove();
          }
        });
      };
    }
  }, [map, onPosition, zoom]);

  // Обновляем центр карты при изменении пропсов (теперь всегда можно обновлять)
  useEffect(() => {
    if (map) {
      console.log('Google: Обновляем центр карты', { lat, lng });
      map.setCenter({ lat, lng });
    }
  }, [lat, lng, map]);

  // Обновляем зум карты при изменении пропсов (теперь всегда можно обновлять)
  useEffect(() => {
    if (map) {
      console.log('Google: Обновляем зум карты', zoom);
      map.setZoom(zoom);
    }
  }, [zoom, map]);

  return null; // Этот компонент не рендерит ничего, только управляет картой
}

export default function GoogleMap({ lng, lat, zoom = 13, onPosition, ...rest }: GoogleMapProps) {
  const { width, height, ref } = useResizeDetector();

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }} ref={ref} {...rest}>
      <div style={{ position: 'absolute', width: '100%', height: '100%' }}>
        <div style={{ width: '100%', height: '100%', borderRadius: '8px', overflow: 'hidden' }}>
          <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
            <Map
              defaultCenter={{ lat, lng }}
              defaultZoom={zoom}
              mapId="DEMO_MAP_ID"
              style={{ width: '100%', height: '100%' }}
            >
              <GoogleMapInner lng={lng} lat={lat} zoom={zoom} onPosition={onPosition} />
            </Map>
          </APIProvider>
        </div>
      </div>
    </div>
  );
} 

export class GoogleGeoProvider {
  private mapInstance: any = null;
  
  GeoMap = GoogleMap;
  
  // Императивные методы для обновления карты
  setCenter = (lat: number, lng: number) => {
    if (this.mapInstance) {
      this.mapInstance.setCenter({ lat, lng });
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
        this.mapInstance.setCenter({ lat: params.lat, lng: params.lng });
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