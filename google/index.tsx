import { useEffect, useRef } from 'react';

export default function GoogleMap({ lng, lat }: { lng: number; lat: number }) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Заглушка для Google Maps API
    console.log('Google Maps API would be loaded here');
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
      Google Map (заглушка)
      <br />
      Координаты: {lat}, {lng}
    </div>
  );
} 