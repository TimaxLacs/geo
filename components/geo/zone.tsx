import { useContext, useEffect, useRef } from 'react';
import { GeoContext } from '@/providers/lib/context';
import { ZoneData, LatLng } from '@/lib/core/geo-types';

export interface GeoZoneProps {
  zone: ZoneData;
  isEditing: boolean;
  onChange: (updatedZone: ZoneData) => void;
  onRemove: () => void;
}

export function GeoZone({ zone, isEditing, onChange, onRemove }: GeoZoneProps) {
  const geoContext = useContext(GeoContext);
  const nativeObjectRef = useRef<any>(null);

  // Эффект для создания/удаления зоны
  useEffect(() => {
    if (!geoContext || !geoContext.mapInstance || !geoContext.ymaps) return;
    
    // Проверяем доступность необходимых модулов
    const { ymaps } = geoContext;
    if (!ymaps.Circle || !ymaps.Polygon || !ymaps.Polyline) return;

    const { mapInstance, providerId } = geoContext;
    let nativeObject: any;

    // Создаем нативный объект в зависимости от типа зоны
    if (zone.type === 'circle') {
      nativeObject = new ymaps.Circle(
        [zone.geometry as LatLng, zone.radius || 1000],
        {
          balloonContent: zone.meta?.title || 'Зона'
        },
        {
          fillColor: zone.style?.fillColor || '#ff000033',
          strokeColor: zone.style?.strokeColor || '#ff0000',
          strokeWidth: zone.style?.strokeWidth || 2
        }
      );
    } else if (zone.type === 'polygon') {
      nativeObject = new ymaps.Polygon(
        [zone.geometry as LatLng[]],
        {
          balloonContent: zone.meta?.title || 'Полигон'
        },
        {
          fillColor: zone.style?.fillColor || '#00ff0033',
          strokeColor: zone.style?.strokeColor || '#00ff00',
          strokeWidth: zone.style?.strokeWidth || 2
        }
      );
    } else if (zone.type === 'polyline') {
      nativeObject = new ymaps.Polyline(
        zone.geometry as LatLng[],
        {
          balloonContent: zone.meta?.title || 'Линия'
        },
        {
          strokeColor: zone.style?.strokeColor || '#0000ff',
          strokeWidth: zone.style?.strokeWidth || 3
        }
      );
    }

    if (nativeObject) {
      nativeObjectRef.current = nativeObject;
      mapInstance.geoObjects.add(nativeObject);

      // Для Яндекса регистрируем зону в контексте для централизованного редактирования
      if (providerId === 'yandex' && geoContext.registerZone) {
        const handleEditEnd = (newGeometry: LatLng[] | LatLng, newRadius?: number) => {
          const updatedZone = { ...zone, geometry: newGeometry };
          if (newRadius !== undefined) {
            updatedZone.radius = newRadius;
          }
          onChange(updatedZone);
        };
        
        geoContext.registerZone(zone.id, nativeObject, handleEditEnd);
      }
    }

    return () => {
      if (nativeObjectRef.current) {
        // Для Яндекса отменяем регистрацию
        if (providerId === 'yandex' && geoContext.unregisterZone) {
          geoContext.unregisterZone(zone.id);
        }
        
        mapInstance.geoObjects.remove(nativeObjectRef.current);
        nativeObjectRef.current = null;
      }
    };
  }, [geoContext?.mapInstance, geoContext?.ymaps]); // Создаем только один раз

  // Эффект для обновления геометрии зоны
  useEffect(() => {
    if (!nativeObjectRef.current) return;

    if (zone.type === 'circle') {
      nativeObjectRef.current.geometry.setCoordinates([zone.geometry as LatLng, zone.radius || 1000]);
    } else if (zone.type === 'polygon') {
      nativeObjectRef.current.geometry.setCoordinates([zone.geometry as LatLng[]]);
    } else if (zone.type === 'polyline') {
      nativeObjectRef.current.geometry.setCoordinates(zone.geometry as LatLng[]);
    }
  }, [zone.geometry, zone.radius]);

  // Эффект для обновления стилей зоны
  useEffect(() => {
    if (!nativeObjectRef.current) return;
    
    const options: any = {};
    if (zone.style?.fillColor) options.fillColor = zone.style.fillColor;
    if (zone.style?.strokeColor) options.strokeColor = zone.style.strokeColor;
    if (zone.style?.strokeWidth) options.strokeWidth = zone.style.strokeWidth;
    
    nativeObjectRef.current.options.set(options);
  }, [zone.style]);

  // Эффект для режима редактирования (для Google и 2GIS)
  // Для Яндекса редактирование управляется централизованно в компоненте Geo
  useEffect(() => {
    if (!nativeObjectRef.current || !geoContext || geoContext.providerId === 'yandex') return;
    
    // Для Google Maps и 2GIS устанавливаем editable напрямую
    if (nativeObjectRef.current.setEditable) {
      nativeObjectRef.current.setEditable(isEditing);
      
      if (isEditing && nativeObjectRef.current.events) {
        // Подписываемся на события редактирования для Google/2GIS
        const handleEdit = () => {
          // Получаем новую геометрию и обновляем состояние
          // Реализация зависит от конкретного провайдера
        };
        
        // Здесь нужна специфическая логика для каждого провайдера
        // Пока оставляем заглушку
      }
    }
  }, [isEditing, geoContext?.providerId]);
  
  return null; // Компонент не рендерит DOM
}
