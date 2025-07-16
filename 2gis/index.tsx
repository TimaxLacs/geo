import { useEffect, useRef } from 'react';

export default function TwoGISMap({ lng, lat }: { lng: number; lat: number }) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Заглушка для 2GIS API
    console.log('2GIS API would be loaded here');
    console.log('Coordinates:', { lng, lat });
  }, [lng, lat]);

  return (
    <div 
      ref={mapRef} 
      style={{ 
        width: 600, 
        height: 400,
        backgroundColor: '#f0f0f0',
        border: '2px solid #ccc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        color: '#666'
      }}
    >
      2ГИС Map (заглушка)
      <br />
      Координаты: {lat}, {lng}
    </div>
  );
} 