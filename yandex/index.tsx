import { useEffect, useRef } from 'react';

export default function YandexMap({ lng, lat }: { lng: number; lat: number }) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=${process.env.NEXT_PUBLIC_YANDEX_MAP_API_KEY!}`;
    script.type = 'text/javascript';
    script.onload = () => {
      // @ts-ignore
      window.ymaps.ready(function () {
        // @ts-ignore
        new window.ymaps.Map(mapRef.current, {
          center: [lat, lng],
          zoom: 13,
        });
      });
    };
    document.body.appendChild(script);
    return () => {
      // Очистка карты при размонтировании
      if (mapRef.current) mapRef.current.innerHTML = '';
    };
  }, []);

  return <div ref={mapRef} style={{ width: 600, height: 400 }} />;
}