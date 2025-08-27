export type ProviderId = 'yandex' | 'google' | '2gis';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface MarkerData {
  id: string;
  position: LatLng;
  provider: ProviderId;
  meta?: {
    title?: string;
    description?: string;
    address?: string; // Добавляем поле для адреса
    icon?: {
      url: string;
      width: number;
      height: number;
      anchorX?: number;
      anchorY?: number;
    };
    draggable?: boolean;
    label?: string; // Текст, который будет отображаться на карте
  };
}

export interface ProviderMarkerHandle {
  id: string;
  remove: () => void;
  nativeHandle: any; // Ссылка на нативный объект маркера (например, ymaps.Placemark)
}

/**
 * Универсальная структура для представления гео-объекта,
 * полученного в результате прямого или обратного геокодирования.
 */
export interface GeoObject {
  coords: LatLng;      // Координаты объекта
  name: string;        // Краткое название (улица, дом)
  description: string; // Более подробное описание (город, регион)
  text: string;        // Полный адрес
}

export type ZoneType = 'circle' | 'polygon' | 'polyline' | 'rectangle';

export interface ZoneStyle {
  strokeColor?: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  fillColor?: string;
  fillOpacity?: number;
}

export interface ZoneData {
  id: string;
  provider: ProviderId;
  type: ZoneType;
  geometry: LatLng[] | LatLng; // Массив вершин для полигонов/линий, центр для круга
  radius?: number; // Только для круга (в метрах)
  editable?: boolean;
  meta?: {
    title?: string;
    description?: string;
  };
  style?: ZoneStyle;
}

export interface ProviderZoneHandle {
  id: string;
  remove: () => void;
  update: (zone: ZoneData) => void;
  setEditable: (editable: boolean) => void;
  nativeHandle: any; // Ссылка на нативный объект (ymaps.GeoObject, google.maps.Polygon, etc.)
}
