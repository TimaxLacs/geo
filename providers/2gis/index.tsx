'use client';
import { useEffect, useRef, useState } from 'react';
import { load } from '@2gis/mapgl';
import { useResizeDetector } from 'react-resize-detector';

interface TwoGISMapProps {
  lng: number;
  lat: number;
  zoom?: number;
  onPosition?: (position: { lat: number; lng: number; zoom: number }) => void;
  onReady?: (mapInstance: any, api: any) => void;
  onMapClick?: (coords: { lat: number; lng: number }) => void;
  [key: string]: any;
}

export default function TwoGISMap({ 
    lng, 
    lat, 
    zoom = 13, 
    onReady, 
    onPosition,
    onMapClick,
    ...rest
}: TwoGISMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const { width, height, ref } = useResizeDetector();
  const apiKey = process.env.NEXT_PUBLIC_2GIS_API_KEY;

  useEffect(() => {
    let map: any = null;

    if (mapContainerRef.current && !mapInstance && apiKey) {
      load().then((mapglAPI) => {
        if (mapContainerRef.current) {
          map = new mapglAPI.Map(mapContainerRef.current, {
            center: [lng, lat],
            zoom: zoom,
            key: apiKey,
          });
          
          new mapglAPI.Control(map, 'zoom', { position: 'bottomRight' });
          new mapglAPI.Control(map, 'fullscreen', { position: 'bottomRight' });

          setMapInstance(map);
          if (onReady) {
            onReady(map, mapglAPI);
          }
        }
      });
    }

    return () => {
      if (mapInstance) {
        mapInstance.destroy();
        setMapInstance(null);
      }
    };
  }, []); // Run only once on mount

  useEffect(() => {
    if (mapInstance) {
        const handlePosition = () => {
            if(onPosition) {
                const center = mapInstance.getCenter();
                const currentZoom = mapInstance.getZoom();
                onPosition({ lat: center[1], lng: center[0], zoom: currentZoom });
            }
        };
        const handleMapClick = (e: any) => {
            if(onMapClick && e.lngLat) {
                onMapClick({ lat: e.lngLat[1], lng: e.lngLat[0] });
            }
        };

        mapInstance.on('moveend', handlePosition);
        mapInstance.on('zoomend', handlePosition);
        mapInstance.on('click', handleMapClick);

        return () => {
            mapInstance.off('moveend', handlePosition);
            mapInstance.off('zoomend', handlePosition);
            mapInstance.off('click', handleMapClick);
        };
    }
  }, [mapInstance, onPosition, onMapClick]);

  if (!apiKey) {
    return (
      <div {...rest} className="flex items-center justify-center bg-gray-200 text-red-500">
        2GIS API key is not configured.
      </div>
    );
  }

  return (
    <div {...rest} ref={mapContainerRef} style={{ width: '100%', height: '100%', borderRadius: '8px' }}/>
  );
} 