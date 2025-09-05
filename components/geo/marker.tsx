import { useContext, useEffect, useRef } from 'react';
import { GeoContext } from '@/providers/lib/context';
import { MarkerData, LatLng } from '@/lib/core/geo-types';

export interface GeoMarkerProps {
  marker: MarkerData;
  isEditing: boolean;
  onChange: (updatedMarker: MarkerData) => void;
  onRemove: () => void;
}

export function GeoMarker({ marker, isEditing, onChange, onRemove }: GeoMarkerProps) {
  const geoContext = useContext(GeoContext);
  const placemarkRef = useRef<any>(null);

  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

  const markerRef = useRef(marker);
  useEffect(() => { markerRef.current = marker; }, [marker]);
  
  const create2GisMarker = (mapInstance: any) => {
    const currentMarker = markerRef.current;
    const mapglAPI = (geoContext as any)?.ymaps || (window as any).mapgl;
    if (!mapglAPI) return null;

    const markerOptions: any = {
      coordinates: [currentMarker.position.lng, currentMarker.position.lat],
      draggable: isEditing,
      zIndex: 10000,
    };
    if (currentMarker.meta?.icon?.url) {
      markerOptions.icon = {
        url: currentMarker.meta.icon.url,
        size: [currentMarker.meta.icon.width || 32, currentMarker.meta.icon.height || 32],
      };
    }
    if (currentMarker.meta?.label) {
      markerOptions.label = { text: currentMarker.meta.label, fontSize: 14, haloRadius: 1, haloColor: '#fff' };
    }
    return new mapglAPI.Marker(mapInstance, markerOptions);
  };

  // Эффект для создания/удаления маркера
  useEffect(() => {
    if (!geoContext || !geoContext.mapInstance) return;

    const { mapInstance, ymaps, providerId } = geoContext;
    let nativeMarker: any = null;

    // --- Яндекс.Карты ---
    if (providerId === 'yandex' && ymaps?.Placemark) {
      const properties = {
        balloonContent: marker.meta?.title || 'Маркер',
        hintContent: marker.meta?.address || 'Адрес не указан',
        ...(marker.meta?.label && { iconContent: marker.meta.label })
      };
      const options: any = {
        preset: 'islands#blueIcon'
      };
      if (marker.meta?.icon?.url) {
        options.iconLayout = 'default#image';
        options.iconImageHref = marker.meta.icon.url;
        const width = marker.meta.icon.width || 32;
        const height = marker.meta.icon.height || 32;
        options.iconImageSize = [width, height];
        options.iconImageOffset = [-width / 2, -height];
        delete options.preset;
      } else if (marker.meta?.label) {
        options.preset = 'islands#blueStretchyIcon';
      }
      
      nativeMarker = new ymaps.Placemark([marker.position.lat, marker.position.lng], properties, options);
      mapInstance.geoObjects.add(nativeMarker);
    }

    // --- Google Maps ---
    else if (providerId === 'google') {
      nativeMarker = new google.maps.Marker({
        position: marker.position,
        map: mapInstance,
        title: marker.meta?.title,
      });
    }
    
    // --- 2GIS ---
    else if (providerId === '2gis' && ((geoContext as any)?.ymaps || (window as any).mapgl)) {
      nativeMarker = create2GisMarker(mapInstance);
    }

    placemarkRef.current = nativeMarker;
    
    return () => {
      // ВАЖНО: удаляем именно актуальный маркер, если он был пересоздан
      const markerToDestroy = placemarkRef.current || nativeMarker;
      if (markerToDestroy) {
        if (providerId === 'yandex') {
          try { mapInstance.geoObjects.remove(markerToDestroy); } catch {}
        } else if (providerId === 'google') {
          try { markerToDestroy.setMap(null); } catch {}
        } else if (providerId === '2gis') {
          try { markerToDestroy.destroy(); } catch {}
        }
      }
      placemarkRef.current = null;
    };
  }, [geoContext?.mapInstance, geoContext?.ymaps]);
  
  // Эффект для обновления позиции
  useEffect(() => {
    const placemark = placemarkRef.current;
    if (!placemark) return;
    const { providerId } = geoContext!;

    if (providerId === 'yandex') {
      placemark.geometry.setCoordinates([marker.position.lat, marker.position.lng]);
    } else if (providerId === 'google') {
      placemark.setPosition(marker.position);
    } else if (providerId === '2gis') {
        placemark.setCoordinates([marker.position.lng, marker.position.lat]);
    }
  }, [marker.position]);
  
  // Эффект для обновления метаданных (включая иконку и текст)
  useEffect(() => {
    const placemark = placemarkRef.current;
    if (!placemark) return;
    const { providerId, mapInstance } = geoContext!;
    const { meta } = marker;

    if (providerId === 'yandex') {
      placemark.properties.set({
        balloonContent: meta?.title || 'Маркер',
        hintContent: meta?.address || 'Адрес не указан',
        iconContent: meta?.label || ''
      });
      const options: any = {};
      if (meta?.icon?.url) {
        options.iconLayout = 'default#image';
        options.iconImageHref = meta.icon.url;
        const width = meta.icon.width || 32;
        const height = meta.icon.height || 32;
        options.iconImageSize = [width, height];
        options.iconImageOffset = [-width / 2, -height];
        options.preset = undefined;
      } else if (meta?.label) {
        options.preset = 'islands#blueStretchyIcon';
        options.iconLayout = undefined;
        options.iconImageHref = undefined;
      } else {
        options.preset = 'islands#blueIcon';
        options.iconLayout = undefined;
        options.iconImageHref = undefined;
      }
      placemark.options.set(options);

    } else if (providerId === 'google') {
      placemark.setTitle(meta?.title || 'Маркер');
      placemark.setLabel(meta?.label || null);
      if (meta?.icon?.url) {
        placemark.setIcon({
            url: meta.icon.url,
            scaledSize: new google.maps.Size(meta.icon.width || 32, meta.icon.height || 32)
        });
      }
    } else if (providerId === '2gis') {
      // Для 2GIS нужно пересоздавать маркер при любом изменении meta
      placemark.destroy();
      const newMarker = create2GisMarker(mapInstance);
      placemarkRef.current = newMarker;
    }
  }, [marker.meta]);

  // Эффект для режима редактирования
  useEffect(() => {
    const placemark = placemarkRef.current;
    if (!placemark) return;
    const { providerId, mapInstance } = geoContext!;

    if (providerId === 'yandex') {
      placemark.options.set('draggable', isEditing);
      if (isEditing) {
        const handleDragEnd = (e: any) => {
          const coords = e.get('target').geometry.getCoordinates();
          const newPosition: LatLng = { lat: coords[0], lng: coords[1] };
          onChangeRef.current({ ...markerRef.current, position: newPosition });
        };
        placemark.events.add('dragend', handleDragEnd);
        return () => placemark.events.remove('dragend', handleDragEnd);
      }
    } else if (providerId === 'google') {
      placemark.setDraggable(isEditing);
      if (isEditing) {
        const listener = placemark.addListener('dragend', () => {
          const newPosition = placemark.getPosition();
          if (newPosition) {
            onChangeRef.current({ ...markerRef.current, position: { lat: newPosition.lat(), lng: newPosition.lng() } });
          }
        });
        return () => listener.remove();
      }
    } else if (providerId === '2gis') {
      // Для 2GIS нужно пересоздавать маркер, чтобы изменить draggability
      placemark.destroy();
      const newMarker = create2GisMarker(mapInstance);
      if (!newMarker) return;
      placemarkRef.current = newMarker;

      if (isEditing) {
        const handleDrag = () => {
          const coords = newMarker.getCoordinates();
          if (!coords) return;
          const newPosition = { lat: coords[1], lng: coords[0] };
          onChangeRef.current({ ...markerRef.current, position: newPosition });
        };
        const handleDragEnd = () => {
          const coords = newMarker.getCoordinates();
          if (!coords) return;
          const newPosition = { lat: coords[1], lng: coords[0] };
          onChangeRef.current({ ...markerRef.current, position: newPosition });
        };
        newMarker.on('drag', handleDrag);
        newMarker.on('dragend', handleDragEnd);
        return () => {
          try { newMarker.off('drag', handleDrag); } catch {}
          try { newMarker.off('dragend', handleDragEnd); } catch {}
        };
      }
    }
  }, [isEditing, geoContext?.mapInstance]);
  
  return null;
}
