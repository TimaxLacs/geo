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
  children?: React.ReactNode;
  editingZoneId?: string | null;
}

export default function TwoGISMap({ lng, lat, zoom = 13, onPosition, onReady, onMapClick, children, editingZoneId }: TwoGISMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [mapglAPI, setMapglAPI] = useState<any>(null);
  const { ref } = useResizeDetector({
    onResize: () => {
      mapInstance?.container.fitToViewport();
    },
  });
  const apiKey = process.env.NEXT_PUBLIC_2GIS_API_KEY;

  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  useEffect(() => {
    let map: any = null;
    if (mapContainerRef.current) {
      load().then((mapglAPI) => {
        if (mapContainerRef.current && !map) {
          map = new mapglAPI.Map(mapContainerRef.current, {
            center: [lng, lat],
            zoom: zoom,
            key: apiKey || '',
          });

          new mapglAPI.Control(map, 'zoom', { position: 'bottomRight' });
          new mapglAPI.Control(map, 'fullscreen', { position: 'bottomRight' });
          
          setMapglAPI(mapglAPI);
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
  }, []); // Запускаем только один раз при монтировании

  // Эффект для подписки на события после создания карты
  useEffect(() => {
    if (!mapInstance) return;

    const clickHandler = (e: any) => {
      if (onMapClickRef.current) {
        onMapClickRef.current({ lat: e.lngLat[1], lng: e.lngLat[0] });
      }
    };
    mapInstance.on('click', clickHandler);

    if (onPosition) {
      const handleMove = () => {
        if (onPosition) {
          const center = mapInstance.getCenter();
          const currentZoom = mapInstance.getZoom();
          onPosition({ lat: center[1], lng: center[0], zoom: currentZoom });
        }
      };
      mapInstance.on('moveend', handleMove);
      mapInstance.on('zoomend', handleMove);

      return () => {
        mapInstance.off('moveend', handleMove);
        mapInstance.off('zoomend', handleMove);
      };
    }
    
    return () => {
      mapInstance.off('click', clickHandler);
    };
  }, [mapInstance]); // Зависит только от mapInstance

  // Эффекты для обновления центра и зума
  useEffect(() => {
    if (!mapInstance) return;
    mapInstance.setCenter([lng, lat]);
  }, [mapInstance, lng, lat]);

  useEffect(() => {
    if (!mapInstance) return;
    mapInstance.setZoom(zoom);
  }, [mapInstance, zoom]);

  if (!apiKey) {
    return (
      <div className="flex items-center justify-center bg-gray-200 text-red-500">
        2GIS API key is not configured.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }} ref={ref}>
        <div 
          ref={mapContainerRef} 
          style={{ width: '100%', height: '100%', borderRadius: '8px', overflow: 'hidden' }}
        />
        {mapInstance && children}
    </div>
  );
} 