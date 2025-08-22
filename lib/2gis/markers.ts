import { MarkerAdapter } from '@/lib/markers/engine';
import { LatLng, MarkerData, ProviderMarkerHandle } from '@/lib/core/geo-types';

/**
 * Контекст, необходимый для работы адаптера 2ГИС.
 * Содержит экземпляр карты и API mapgl.
 */
interface TwoGISAdapterContext {
  map: any;
  mapglAPI: any;
}

const TwoGISMarkerAdapter: MarkerAdapter = {
  /**
   * Монтирует (добавляет) маркер на экземпляр карты 2ГИС.
   */
  mount({ map, mapglAPI }: TwoGISAdapterContext, marker: MarkerData, onDragEnd: (newPosition: LatLng) => void): ProviderMarkerHandle {
    console.log('[2GISAdapter] Mounting marker:', marker.id);

    if (!mapglAPI || !map) {
      throw new Error('[2GISAdapter] Map instance or mapglAPI is not available in context.');
    }

    const markerInstance = new mapglAPI.Marker(map, {
      coordinates: [marker.position.lng, marker.position.lat], // Важно: 2ГИС использует [lng, lat]
      icon: marker.meta?.icon?.url,
      label: {
        text: marker.meta?.label,
        // Другие опции для label можно добавить здесь
      },
      draggable: true,
    });

    markerInstance.on('dragend', () => {
      const newCoords = markerInstance.getCoordinates();
      onDragEnd({ lat: newCoords[1], lng: newCoords[0] }); // Нормализуем обратно в [lat, lng]
    });

    const handle: ProviderMarkerHandle = {
      id: marker.id,
      nativeHandle: markerInstance,
      remove: () => {
        console.log('[2GISAdapter] Removing marker via handle:', marker.id);
        markerInstance.destroy();
      },
    };

    return handle;
  },

  /**
   * Демонтирует (удаляет) маркер с карты.
   */
  unmount(handle: ProviderMarkerHandle): void {
    console.log('[2GISAdapter] Unmounting marker:', handle.id);
    handle.remove();
  },

  /**
   * Подписывается на событие клика по карте 2ГИС.
   */
  subscribeMapClick({ map }: TwoGISAdapterContext, callback: (pos: LatLng) => void): () => void {
    const onClick = (e: any) => {
      // API 2ГИС возвращает lngLat в событии
      const position: LatLng = {
        lat: e.lngLat[1],
        lng: e.lngLat[0],
      };
      console.log('[2GISAdapter] Map clicked at:', position);
      callback(position);
    };

    map.on('click', onClick);
    console.log('[2GISAdapter] Subscribed to map click event.');

    return () => {
      map.off('click', onClick);
      console.log('[2GISAdapter] Unsubscribed from map click event.');
    };
  },
};

export default TwoGISMarkerAdapter;
