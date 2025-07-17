import { YMaps, Map } from '@pbe/react-yandex-maps';

interface YandexMapProps {
  lng: number;
  lat: number;
  zoom?: number;
  width?: number | string;
  height?: number | string;
  [key: string]: any;
}

export default function YandexMap({ lng, lat, zoom = 10, width = 600, height = 400, ...rest }: YandexMapProps) {
  return (
    <YMaps>
      <Map
        defaultState={{ center: [lat, lng], zoom }}
        width={width}
        height={height}
        {...rest}
      />
    </YMaps>
  );
}

export class YandexGeoProvider {
  GeoMap = YandexMap;
}