import { useEffect, useRef, useState } from 'react';
import { Map, APIProvider } from '@vis.gl/react-google-maps';

interface GoogleMapProps {
  lng: number;
  lat: number;
  zoom?: number;
  width?: number | string;
  height?: number | string;
  [key: string]: any;
}

export default function GoogleMap({ lng, lat, zoom = 13, width = 600, height = 400, ...rest }: GoogleMapProps) {
  const mapCenter = { lat, lng };

  return (
    <div style={{ width, height, borderRadius: '8px', overflow: 'hidden' }} {...rest}>
      <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
        <Map
          zoom={zoom}
          center={mapCenter}
          mapId="DEMO_MAP_ID"
          style={{ width: '100%', height: '100%' }}
        />
      </APIProvider>
    </div>
  );
} 

export class GoogleGeoProvider {
  GeoMap = GoogleMap;
} 