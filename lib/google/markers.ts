import { MarkerAdapter } from '@/lib/markers/engine';
import { LatLng, MarkerData, ProviderMarkerHandle } from '@/lib/core/geo-types';

declare const google: any; // Используем any, т.к. google types могут быть не установлены глобально

interface GoogleAdapterContext {
  map: any; // google.maps.Map
}

const GoogleMarkerAdapter: MarkerAdapter = {
  mount({ map }: GoogleAdapterContext, markerData: MarkerData, onDragEnd: (newPosition: LatLng) => void): ProviderMarkerHandle {
    if (!map) {
      throw new Error('[GoogleAdapter] Map instance is not available in context.');
    }

    const markerOptions: any = {
      map,
      position: markerData.position,
      title: markerData.meta?.title,
      label: markerData.meta?.icon?.url ? undefined : markerData.meta?.label, // Лейбл показываем только если нет иконки
      draggable: true,
    };

    if (markerData.meta?.icon?.url) {
      markerOptions.icon = {
        url: markerData.meta.icon.url,
        scaledSize: new google.maps.Size(markerData.meta.icon.width, markerData.meta.icon.height),
        anchor: new google.maps.Point(markerData.meta.icon.anchorX || 0, markerData.meta.icon.anchorY || 0),
      };
    }

    const marker = new google.maps.Marker(markerOptions);

    // Подписываемся на событие окончания перетаскивания
    marker.addListener('dragend', (e: any) => {
      onDragEnd({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    });

    const handle: ProviderMarkerHandle = {
      id: markerData.id,
      nativeHandle: marker,
      remove: () => {
        marker.setMap(null);
      },
    };

    return handle;
  },

  unmount(handle: ProviderMarkerHandle): void {
    handle.remove();
  },

  subscribeMapClick({ map }: GoogleAdapterContext, callback: (pos: LatLng) => void): () => void {
    const listener = map.addListener('click', (e: any) => {
      callback({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    });
    
    return () => {
      google.maps.event.removeListener(listener);
    };
  },
};

export default GoogleMarkerAdapter;
