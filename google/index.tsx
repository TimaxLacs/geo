import { useEffect, useRef } from 'react';

interface GoogleMapProps {
  lng: number;
  lat: number;
  zoom?: number;
  width?: number | string;
  height?: number | string;
  [key: string]: any;
}

export default function GoogleMap({ lng, lat, zoom = 13, width = 600, height = 400, ...rest }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Заглушка для Google Maps API
    console.log('Google Maps API would be loaded here');
    console.log('Coordinates:', { lng, lat, zoom });
  }, [lng, lat, zoom]);

  return (
    <div 
      ref={mapRef} 
      style={{ width, height, backgroundColor: '#f0f0f0', border: '2px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', color: '#666' }}
      {...rest}
    >
      Google Map (заглушка)
      <br />
      Координаты: {lat}, {lng}
      <br />
      Зум: {zoom}
    </div>
  );
} 