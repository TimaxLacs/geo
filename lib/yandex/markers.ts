import { MarkerAdapter } from '@/lib/markers/engine';
import { LatLng, MarkerData, ProviderMarkerHandle } from '@/lib/core/geo-types';

/**
 * Контекст, необходимый для работы адаптера Яндекс.Карт.
 * Содержит экземпляр карты и API ymaps.
 */
interface YandexAdapterContext {
  map: any;  // ymaps.Map
  ymaps: any; // ymaps API
}

/**
 * Адаптер для работы с маркерами на Яндекс.Картах.
 * Реализует универсальный интерфейс MarkerAdapter.
 */
const YandexMarkerAdapter: MarkerAdapter = {
  /**
   * Монтирует (добавляет) маркер на экземпляр карты Яндекса.
   * @param context - Контекст, содержащий карту и API.
   * @param marker - Данные маркера для добавления.
   * @returns "Ручка" для управления созданным маркером.
   */
  mount({ map, ymaps }: YandexAdapterContext, marker: MarkerData, onDragEnd: (newPosition: LatLng) => void): ProviderMarkerHandle {
    console.log('[YandexAdapter] Mounting marker:', marker.id);
    
    if (!ymaps || !map) {
      throw new Error('[YandexAdapter] Map instance or ymaps API is not available in context.');
    }

    // Данные для хинта, балуна и текста на иконке
    const properties: ymaps.IPlacemarkProperties = {
      hintContent: marker.meta?.title,
      balloonContent: marker.meta?.description,
      // Устанавливаем текст на иконке, только если НЕТ кастомной картинки
      iconContent: marker.meta?.icon?.url ? undefined : marker.meta?.label 
    };

    // Опции для кастомной иконки и перетаскивания
    const options: ymaps.IPlacemarkOptions = {
      draggable: true 
    };

    if (marker.meta?.icon?.url) {
      // Используем кастомную иконку (текст игнорируется)
      options.iconLayout = 'default#image';
      options.iconImageHref = marker.meta.icon.url;
      options.iconImageSize = [marker.meta.icon.width, marker.meta.icon.height];
      options.iconImageOffset = [-(marker.meta.icon.anchorX || 0), -(marker.meta.icon.anchorY || 0)];
    } else {
      // Используем стандартную иконку в стиле Hasyx, которая покажет текст
      options.preset = 'islands#blueStretchyIcon';
    }

    const placemark = new ymaps.Placemark(
      [marker.position.lat, marker.position.lng],
      properties,
      options
    );

    // Подписываемся на событие окончания перетаскивания
    placemark.events.add('dragend', () => {
      const newCoords = placemark.geometry.getCoordinates();
      onDragEnd({ lat: newCoords[0], lng: newCoords[1] });
    });

    map.geoObjects.add(placemark);

    const handle: ProviderMarkerHandle = {
      id: marker.id,
      nativeHandle: placemark, // Сохраняем ссылку на нативный объект
      remove: () => {
        console.log('[YandexAdapter] Removing marker via handle:', marker.id);
        map.geoObjects.remove(placemark);
      },
    };

    return handle;
  },

  /**
   * Демонтирует (удаляет) маркер с карты.
   * @param handle - "Ручка" маркера, которая содержит метод для удаления.
   */
  unmount(handle: ProviderMarkerHandle): void {
    console.log('[YandexAdapter] Unmounting marker:', handle.id);
    handle.remove();
  },

  /**
   * Подписывается на событие клика по карте Яндекса.
   * @param context - Контекст, содержащий карту и API.
   * @param callback - Функция, которая будет вызвана с нормализованными координатами.
   * @returns Функция для отписки от события.
   */
  subscribeMapClick({ map }: YandexAdapterContext, callback: (pos: LatLng) => void): () => void {
    const onClick = (e: any) => {
      const coords = e.get('coords');
      const position: LatLng = {
        lat: coords[0],
        lng: coords[1],
      };
      console.log('[YandexAdapter] Map clicked at:', position);
      callback(position);
    };

    map.events.add('click', onClick);
    console.log('[YandexAdapter] Subscribed to map click event.');

    // Возвращаем функцию для отписки
    return () => {
      map.events.remove('click', onClick);
      console.log('[YandexAdapter] Unsubscribed from map click event.');
    };
  },
};

export default YandexMarkerAdapter;
