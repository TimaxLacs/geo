'use client'

import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { useEffect, useState, useRef } from 'react';
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
  children?: React.ReactNode;
}

function GoogleMapInner({ onReady, onPosition, onMapClick, children, lat, lng, zoom }: GoogleMapProps) {
  const map = useMap();
  
  useEffect(() => {
    if (!map) return;
    if (onReady) {
      onReady(map, (window as any).google);
    }
    // Включаем стандартные контролы Google
    map.setOptions({ fullscreenControl: true, zoomControl: true });
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

  const handleMapClickEvent = (e: any) => {
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
    >
      {children}
    </Map>
  );
}

export default function GoogleMap({ lat, lng, zoom = 10, ...props }: GoogleMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const { ref } = useResizeDetector();

  if (!apiKey) {
    return <div className="flex items-center justify-center bg-gray-200 text-red-500">Google Maps API key is not configured.</div>;
  }
  
  return (
    <div ref={ref} style={{ width: '100%', height: '100%' }}>
      <APIProvider apiKey={apiKey}>
        <GoogleMapInner lat={lat} lng={lng} zoom={zoom} {...props} />
      </APIProvider>
    </div>
  );
} 