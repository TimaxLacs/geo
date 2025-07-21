import { useEffect, useRef, useState, useContext } from 'react';
import { Map, APIProvider, useMap } from '@vis.gl/react-google-maps';
import { GeoContext } from '../../providers/lib/index';

interface GoogleMapProps {
  lng: number;
  lat: number;
  zoom?: number;
  width?: number | string;
  height?: number | string;
  [key: string]: any;
}

// Внутренний компонент, который использует useMap
function GoogleMapInner({ lng, lat, zoom = 13 }: { lng: number; lat: number; zoom?: number }) {
  const map = useMap();
  const geoProvider = useContext(GeoContext);

  // Передаем экземпляр карты в провайдер при первом рендере
  useEffect(() => {
    if (map && geoProvider && (geoProvider as any).setMapInstance) {
      (geoProvider as any).setMapInstance(map);
    }
  }, [map, geoProvider]);

  // Обновляем центр карты при изменении пропсов
  useEffect(() => {
    if (map) {
      map.setCenter({ lat, lng });
    }
  }, [lat, lng, map]);

  // Обновляем зум карты при изменении пропсов
  useEffect(() => {
    if (map) {
      map.setZoom(zoom);
    }
  }, [zoom, map]);

  return null; // Этот компонент не рендерит ничего, только управляет картой
}

export default function GoogleMap({ lng, lat, zoom = 13, width = 600, height = 400, ...rest }: GoogleMapProps) {
  return (
    <div style={{ width, height, borderRadius: '8px', overflow: 'hidden' }} {...rest}>
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
        <Map
          defaultCenter={{ lat, lng }}
          defaultZoom={zoom}
          mapId="DEMO_MAP_ID"
          style={{ width: '100%', height: '100%' }}
        >
          <GoogleMapInner lng={lng} lat={lat} zoom={zoom} />
        </Map>
      </APIProvider>
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