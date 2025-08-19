import { useEffect, useContext } from 'react';
import { Map, APIProvider, useMap } from '@vis.gl/react-google-maps';
import { GeoContext } from '../lib/index';
import { useResizeDetector } from 'react-resize-detector';
import { MarkerData, ProviderMarkerHandle } from '@/lib/core/geo-types';
import { markerEngine } from '@/lib/markers/engine';
import GoogleMarkerAdapter from '@/lib/google/markers';

// Регистрируем адаптер при загрузке модуля
markerEngine.registerAdapter('google', GoogleMarkerAdapter);

interface GoogleMapProps {
  lng: number;
  lat: number;
  zoom?: number;
  width?: number | string;
  height?: number | string;
  onPosition?: (position: { lat: number; lng: number; zoom: number }) => void;
  onReady?: () => void;
  [key: string]: any;
}

// Внутренний компонент, который использует useMap
function GoogleMapInner({ lng, lat, zoom = 13, onPosition, onReady }: { 
  lng: number; 
  lat: number; 
  zoom?: number; 
  onPosition?: (position: { lat: number; lng: number; zoom: number }) => void;
  onReady?: () => void;
}) {
  const map = useMap();
  const geoProvider = useContext(GeoContext);

  // Передаем экземпляр карты в провайдер и сообщаем о готовности
  useEffect(() => {
    if (map && geoProvider) {
      if ((geoProvider as any).setMapInstance) {
        (geoProvider as any).setMapInstance(map);
      }
      if (onReady) {
        onReady();
      }
    }
  }, [map, geoProvider, onReady]);

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
          // У Google Maps нет метода remove у листенера, используем google.maps.event
          if (listener) {
             // @ts-ignore
            google.maps.event.removeListener(listener);
          }
        });
      };
    }
  }, [map, onPosition, zoom]);

  // Обновляем центр карты при изменении пропсов (теперь всегда можно обновлять)
  useEffect(() => {
    if (map) {
      map.setCenter({ lat, lng });
    }
  }, [lat, lng, map]);

  // Обновляем зум карты при изменении пропсов (теперь всегда можно обновлять)
  useEffect(() => {
    if (map) {
      map.setZoom(zoom);
    }
  }, [zoom, map]);

  return null; // Этот компонент не рендерит ничего, только управляет картой
}

export default function GoogleMap({ lng, lat, zoom = 13, onPosition, onReady, ...rest }: GoogleMapProps) {
  const { ref } = useResizeDetector();

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
              gestureHandling={'greedy'} // Позволяет скроллить карту без зажатия Ctrl
            >
              <GoogleMapInner lng={lng} lat={lat} zoom={zoom} onPosition={onPosition} onReady={onReady} />
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
  
  // --- МЕТОДЫ ДЛЯ РАБОТЫ С МАРКЕРАМИ ---
  addMarker = (marker: MarkerData, onDragEnd: (newPosition: { lat: number, lng: number }) => void): ProviderMarkerHandle => {
    if (!this.mapInstance) throw new Error("Google map instance is not available.");
    return markerEngine.mount('google', { map: this.mapInstance }, marker, onDragEnd);
  };

  removeMarker = (handle: ProviderMarkerHandle) => {
    markerEngine.unmount('google', handle);
  };

  updateMarker = (handle: ProviderMarkerHandle, marker: MarkerData) => {
    const googleMarker = handle.nativeHandle as any;
    if (!googleMarker) return;
    
    // Обновляем title и label
    googleMarker.setTitle(marker.meta?.title || null);
    googleMarker.setLabel(marker.meta?.icon?.url ? null : marker.meta?.label || null);
    
    // Обновляем иконку
    if (marker.meta?.icon?.url) {
      googleMarker.setIcon({
        url: marker.meta.icon.url,
        scaledSize: new google.maps.Size(marker.meta.icon.width, marker.meta.icon.height),
        anchor: new google.maps.Point(marker.meta.icon.anchorX || 0, marker.meta.icon.anchorY || 0),
      });
    } else {
      googleMarker.setIcon(null); // Возвращаем стандартную иконку
    }
  };

  updateMarkerPosition = (handle: ProviderMarkerHandle, position: { lat: number, lng: number }) => {
    handle.nativeHandle.setPosition(position);
  };

  onMapClick = (callback: (coords: { lat: number, lng: number }) => void): (() => void) => {
    if (!this.mapInstance) throw new Error("Google map instance is not available.");
    return markerEngine.subscribeMapClick('google', { map: this.mapInstance }, callback);
  };
} 