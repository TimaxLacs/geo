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
