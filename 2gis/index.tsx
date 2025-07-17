import { useEffect, useRef } from 'react';

interface TwoGISMapProps {
  lng: number;
  lat: number;
  zoom?: number;
  width?: number | string;
  height?: number | string;
  [key: string]: any;
}

export default function TwoGISMap({ lng, lat, zoom = 13, width = 600, height = 400, ...rest }: TwoGISMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Заглушка для 2GIS API
    console.log('2GIS API would be loaded here');
    console.log('Coordinates:', { lng, lat, zoom });
  }, [lng, lat, zoom]);

  return (
    <div 
      ref={mapRef} 
      style={{ width, height, backgroundColor: '#e8f4f8', border: '2px solid #4a90e2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#4a90e2' }}
      {...rest}
    >
      2ГИС Map (заглушка)
      <br />
      Координаты: {lat}, {lng}
      <br />
      Зум: {zoom}
    </div>
  );
} 