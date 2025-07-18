import { useEffect, useRef, useState } from 'react';
import { Map, APIProvider, useMap } from '@vis.gl/react-google-maps';

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
  GeoMap = GoogleMap;
} 