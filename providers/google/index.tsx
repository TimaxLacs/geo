'use client'

import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { useEffect, useState } from 'react';
import { useResizeDetector } from 'react-resize-detector';

interface GoogleMapProps {
  lng: number;
  lat: number;
  zoom?: number;
  width?: string | number;
  height?: string | number;
  onPosition?: (position: { lat: number; lng: number; zoom: number }) => void;
  onReady?: (mapInstance: any, api: any) => void;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  [key: string]: any;
}

function GoogleMapInner({ lng, lat, zoom = 10, onPosition, onReady, onMapClick }: Omit<GoogleMapProps, 'width' | 'height'>) {
  const map = useMap();

  useEffect(() => {
    if (map) {
      if (onReady) {
        onReady(map, (window as any).google);
      }
      // Включаем стандартные контролы Google
      map.setOptions({
        fullscreenControl: true,
        zoomControl: true,
      });
    }
  }, [map, onReady]);
  
  const handleBoundsChanged = () => {
    if (map && onPosition) {
      const center = map.getCenter();
      const currentZoom = map.getZoom();
      if (center) {
        onPosition({
          lat: center.lat(),
          lng: center.lng(),
          zoom: currentZoom || 10
        });
      }
    }
  };
  
  const handleMapClickEvent = (e: any) => { // Use 'any' or the correct MapMouseEvent type from the library
    if (onMapClick && e.detail.latLng) {
      onMapClick({
        lat: e.detail.latLng.lat,
        lng: e.detail.latLng.lng,
      });
    }
  };

  return (
    <Map
      center={{ lat, lng }}
      zoom={zoom}
      onBoundsChanged={handleBoundsChanged}
      onClick={handleMapClickEvent}
      mapId="a2b4a2b4a2b4a2b4"
      disableDefaultUI={true}
      gestureHandling={'greedy'}
      style={{ width: '100%', height: '100%', borderRadius: '8px' }}
    />
  );
}

export default function GoogleMap({ width = '100%', height = '100%', ...rest }: GoogleMapProps) {
  const { ref } = useResizeDetector();

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div style={{ width, height }} className="flex items-center justify-center bg-gray-200 text-red-500">
        Google Maps API key is not configured.
      </div>
    );
  }

  return (
    <div style={{ width, height, position: 'relative', borderRadius: '8px', overflow: 'hidden' }} ref={ref}>
      <APIProvider apiKey={apiKey}>
        <GoogleMapInner {...rest} />
      </APIProvider>
    </div>
  );
} 