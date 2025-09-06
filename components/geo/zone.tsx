import { useContext, useEffect, useRef } from 'react';
import { GeoContext } from '@/providers/lib/context';
import { ZoneData, LatLng } from '@/lib/core/geo-types';

export interface GeoZoneProps {
  zone: ZoneData;
  isEditing: boolean;
  onChange: (updatedZone: ZoneData) => void;
  onRemove: () => void;
}

// --- НОВЫЙ БЛОК: ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
function toYandexCoords(geometry: LatLng | LatLng[]): any {
    if (Array.isArray(geometry)) {
        return geometry.map(p => [p.lat, p.lng]);
    }
    return [geometry.lat, geometry.lng];
}
// --- КОНЕЦ НОВОГО БЛОКА ---

function hexToRgbaString(hex?: string, defaultOpacity = 0.3): string {
  if (!hex) return `rgba(255, 0, 0, ${defaultOpacity})`;
  let c = hex.startsWith('#') ? hex.substring(1) : hex;
  if (c.length === 8) { // RRGGBBAA
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const a = (parseInt(c.substring(6, 8), 16) / 255);
    return `rgba(${r}, ${g}, ${b}, ${a.toPrecision(2)})`;
  }
  if (c.length === 6) { // RRGGBB
     const r = parseInt(c.substring(0, 2), 16);
     const g = parseInt(c.substring(2, 4), 16);
     const b = parseInt(c.substring(4, 6), 16);
     return `rgba(${r}, ${g}, ${b}, ${defaultOpacity})`;
  }
  return `rgba(255, 0, 0, ${defaultOpacity})`;
}

function to2GisCoords(coords: LatLng[]): number[][] {
  return coords.map(c => [c.lng, c.lat]);
}

function circleToPolygon(center: LatLng, radiusMeters: number, segments = 64): LatLng[] {
  const result: LatLng[] = [];
  const earthRadius = 6378137; // meters
  const latRad = (center.lat * Math.PI) / 180;
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * 2 * Math.PI;
    const dx = (radiusMeters * Math.cos(angle)) / (earthRadius * Math.cos(latRad));
    const dy = radiusMeters * Math.sin(angle) / earthRadius;
    const dLng = (dx * 180) / Math.PI;
    const dLat = (dy * 180) / Math.PI;
    result.push({ lat: center.lat + dLat, lng: center.lng + dLng });
  }
  return result;
}

export function GeoZone({ zone, isEditing, onChange, onRemove }: GeoZoneProps) {
  const geoContext = useContext(GeoContext);
  const nativeObjectRef = useRef<any>(null);

  // Эффект для создания/удаления зоны
  useEffect(() => {
    if (!geoContext || !geoContext.mapInstance) return;

    const { mapInstance, providerId, ymaps } = geoContext;
    let nativeObject: any;

    if (providerId === 'yandex' && ymaps) {
      // Проверяем доступность необходимых модулей
      if (!ymaps.Circle || !ymaps.Polygon || !ymaps.Polyline) return;

      const yandexGeometry = toYandexCoords(zone.geometry);

      if (zone.type === 'circle') {
        nativeObject = new ymaps.Circle(
          [yandexGeometry, zone.radius || 1000],
          { balloonContent: zone.meta?.title || 'Зона' },
          {
            fillColor: zone.style?.fillColor || '#ff000033',
            strokeColor: zone.style?.strokeColor || '#ff0000',
            strokeWidth: zone.style?.strokeWidth || 2,
          }
        );
      } else if (zone.type === 'polygon') {
        nativeObject = new ymaps.Polygon(
          [yandexGeometry],
          { balloonContent: zone.meta?.title || 'Полигон' },
          {
            fillColor: zone.style?.fillColor || '#00ff0033',
            strokeColor: zone.style?.strokeColor || '#00ff00',
            strokeWidth: zone.style?.strokeWidth || 2,
          }
        );
      } else if (zone.type === 'polyline') {
        nativeObject = new ymaps.Polyline(
          yandexGeometry,
          { balloonContent: zone.meta?.title || 'Линия' },
          {
            strokeColor: zone.style?.strokeColor || '#0000ff',
            strokeWidth: zone.style?.strokeWidth || 3,
          }
        );
      }

      if (nativeObject) {
        nativeObjectRef.current = nativeObject;
        mapInstance.geoObjects.add(nativeObject);
      }
    } else if (providerId === 'google') {
      const google = ymaps as any;
      if (!google || !google.maps) return;

      if (zone.type === 'circle') {
        const { color: fillColor, opacity: fillOpacity } = hexToRgbaString(zone.style?.fillColor);
        nativeObject = new google.maps.Circle({
          map: mapInstance,
          center: zone.geometry as LatLng,
          radius: zone.radius || 1000,
          strokeColor: zone.style?.strokeColor,
          strokeWeight: zone.style?.strokeWidth || 2,
          fillColor,
          fillOpacity: fillOpacity ?? 0.2,
          clickable: true,
          editable: false,
        });
      } else if (zone.type === 'polygon') {
        const { color: fillColor, opacity: fillOpacity } = hexToRgbaString(zone.style?.fillColor);
        nativeObject = new google.maps.Polygon({
          map: mapInstance,
          paths: zone.geometry as LatLng[],
          strokeColor: zone.style?.strokeColor,
          strokeWeight: zone.style?.strokeWidth || 2,
          fillColor,
          fillOpacity: fillOpacity ?? 0.2,
          editable: false,
        });
      } else if (zone.type === 'polyline') {
        nativeObject = new google.maps.Polyline({
          map: mapInstance,
          path: zone.geometry as LatLng[],
          strokeColor: zone.style?.strokeColor || '#0000ff',
          strokeWeight: zone.style?.strokeWidth || 3,
          editable: false,
        });
      }

      nativeObjectRef.current = nativeObject;
    } else if (providerId === '2gis' && ymaps) {
      const mapglAPI = ymaps as any;
      if (zone.type === 'circle' || zone.type === 'polygon') {
        const style = {
          color: hexToRgbaString(zone.style?.fillColor, 0.3),
          strokeColor: zone.style?.strokeColor || '#ff0000',
          strokeWidth: zone.style?.strokeWidth || 2,
        };
        const coords = zone.type === 'circle'
          ? [to2GisCoords(circleToPolygon(zone.geometry as LatLng, zone.radius || 1000))]
          : [to2GisCoords(zone.geometry as LatLng[])];
        nativeObject = new mapglAPI.Polygon(mapInstance, { coordinates: coords, ...style });
      } else if (zone.type === 'polyline') {
        const style = {
          color: zone.style?.strokeColor || '#0000ff',
          width: zone.style?.strokeWidth || 3,
        };
        nativeObject = new mapglAPI.Polyline(mapInstance, {
          coordinates: to2GisCoords(zone.geometry as LatLng[]),
          ...style,
        });
      }
      nativeObjectRef.current = nativeObject;
    }

    return () => {
      if (!nativeObjectRef.current) return;
      if (geoContext?.providerId === 'yandex') {
        geoContext.mapInstance.geoObjects.remove(nativeObjectRef.current);
      } else if (geoContext?.providerId === 'google') {
        nativeObjectRef.current.setMap(null);
      } else if (geoContext?.providerId === '2gis') {
        nativeObjectRef.current.destroy();
      }
      nativeObjectRef.current = null;
    };
  }, [geoContext?.mapInstance, geoContext?.ymaps]);

  // Обновление геометрии/радиуса с защитой
  useEffect(() => {
    isUpdatingByCode.current = true;
    const obj = nativeObjectRef.current;
    if (!obj || !geoContext) return;

    const { providerId, ymaps, mapInstance } = geoContext;

    if (providerId === 'yandex') {
      const yandexGeometry = toYandexCoords(zone.geometry);
      if (zone.type === 'circle') {
        // Для круга обновляем координаты и радиус отдельно
        obj.geometry.setCoordinates(yandexGeometry);
        obj.geometry.setRadius(zone.radius || 1000);
      } else if (zone.type === 'polygon') {
        obj.geometry.setCoordinates([yandexGeometry]);
      } else if (zone.type === 'polyline') {
        obj.geometry.setCoordinates(yandexGeometry);
      }
    } else if (providerId === 'google') {
      const google = ymaps as any;
      if (zone.type === 'circle') {
        obj.setCenter(zone.geometry as LatLng);
        if (zone.radius) obj.setRadius(zone.radius);
      } else if (zone.type === 'polygon') {
        obj.setPaths(zone.geometry as LatLng[]);
      } else if (zone.type === 'polyline') {
        obj.setPath(zone.geometry as LatLng[]);
      }
    } else if (providerId === '2gis' && ymaps) {
      try { obj.destroy(); } catch {}
      const mapglAPI = ymaps as any;
      let newObj: any;
      if (zone.type === 'circle' || zone.type === 'polygon') {
        const style = {
          color: hexToRgbaString(zone.style?.fillColor, 0.3),
          strokeColor: zone.style?.strokeColor || '#ff0000',
          strokeWidth: zone.style?.strokeWidth || 2,
        };
        const coords = zone.type === 'circle'
          ? [to2GisCoords(circleToPolygon(zone.geometry as LatLng, zone.radius || 1000))]
          : [to2GisCoords(zone.geometry as LatLng[])];
        newObj = new mapglAPI.Polygon(mapInstance, { coordinates: coords, ...style });
      } else if (zone.type === 'polyline') {
        const style = {
          color: zone.style?.strokeColor || '#0000ff',
          width: zone.style?.strokeWidth || 3,
        };
        newObj = new mapglAPI.Polyline(mapInstance, {
          coordinates: to2GisCoords(zone.geometry as LatLng[]),
          ...style,
        });
      }
      nativeObjectRef.current = newObj;
    }
    setTimeout(() => { isUpdatingByCode.current = false; }, 50);
  }, [zone.geometry, zone.radius]);

  // Обновление стилей
  useEffect(() => {
    const obj = nativeObjectRef.current;
    if (!obj || !geoContext) return;

    const { providerId, ymaps, mapInstance } = geoContext;

    if (providerId === 'yandex') {
      const options: any = {};
      if (zone.style?.fillColor) options.fillColor = zone.style.fillColor;
      if (zone.style?.strokeColor) options.strokeColor = zone.style.strokeColor;
      if (zone.style?.strokeWidth) options.strokeWidth = zone.style.strokeWidth;
      obj.options.set(options);
    } else if (providerId === 'google') {
      const { color: fillColor, opacity: fillOpacity } = hexToRgbaString(zone.style?.fillColor);
      const options: any = {
        strokeColor: zone.style?.strokeColor,
        strokeWeight: zone.style?.strokeWidth || (zone.type === 'polyline' ? 3 : 2),
      };
      if (zone.type !== 'polyline') {
        options.fillColor = fillColor;
        options.fillOpacity = fillOpacity ?? 0.2;
      }
      obj.setOptions(options);
    } else if (providerId === '2gis' && ymaps) {
      try { obj.destroy(); } catch {}
      const mapglAPI = ymaps as any;
      let newObj: any;
      if (zone.type === 'circle' || zone.type === 'polygon') {
        const style = {
          color: hexToRgbaString(zone.style?.fillColor, 0.3),
          strokeColor: zone.style?.strokeColor || '#ff0000',
          strokeWidth: zone.style?.strokeWidth || 2,
        };
        const coords = zone.type === 'circle'
          ? [to2GisCoords(circleToPolygon(zone.geometry as LatLng, zone.radius || 1000))]
          : [to2GisCoords(zone.geometry as LatLng[])];
        newObj = new mapglAPI.Polygon(mapInstance, { coordinates: coords, ...style });
      } else if (zone.type === 'polyline') {
        const style = {
          color: zone.style?.strokeColor || '#0000ff',
          width: zone.style?.strokeWidth || 3,
        };
        newObj = new mapglAPI.Polyline(mapInstance, {
          coordinates: to2GisCoords(zone.geometry as LatLng[]),
          ...style,
        });
      }
      nativeObjectRef.current = newObj;
    }
  }, [zone.style]);
  
  // Защита от бесконечного цикла обновлений
  const isUpdatingByCode = useRef(false);
  
  // Режим редактирования
  useEffect(() => {
    const obj = nativeObjectRef.current;
    if (!obj || !geoContext) return;

    const { providerId, ymaps } = geoContext;
    
    // Используем ref, чтобы в замыкании всегда была актуальная версия
    const onChangeRef = { current: onChange };

    if (providerId === 'yandex') {
      if (isEditing) {
        // Редактор доступен только для Circle и Polygon
        if (obj.editor && (zone.type === 'circle' || zone.type === 'polygon')) {
          obj.editor.startEditing();
          const geometryChangeHandler = () => {
            const newNativeGeometry = obj.geometry.getCoordinates();
            const newRadius = obj.geometry.getRadius ? obj.geometry.getRadius() : undefined;
            const newCoords = fromYandexCoords(newNativeGeometry);
            
            const updatedZone = { ...zone, geometry: newCoords };
            if (updatedZone.type === 'circle' && newRadius !== undefined) {
              updatedZone.radius = newRadius;
            }
            onChangeRef.current(updatedZone);
          };
          obj.editor.events.add('geometrychange', geometryChangeHandler);
          return () => {
            obj.editor.events.remove('geometrychange', geometryChangeHandler);
            if (obj.editor && obj.editor.state.get('editing')) {
              obj.editor.stopEditing();
            }
          };
        }
      } else if (obj.editor && obj.editor.state.get('editing')) {
        obj.editor.stopEditing();
      }
    } else if (providerId === 'google') {
      obj.setEditable(isEditing);
      const google = ymaps as any;
      const listeners: any[] = [];

      if (isEditing) {
        if (zone.type === 'circle') {
            const emit = () => {
              if (isUpdatingByCode.current) return;
              const center = obj.getCenter();
              const radius = obj.getRadius();
              onChangeRef.current({ ...zone, geometry: { lat: center.lat(), lng: center.lng() }, radius });
            };
            listeners.push(obj.addListener('center_changed', emit));
            listeners.push(obj.addListener('radius_changed', emit));
        } else if (zone.type === 'polygon' || zone.type === 'polyline') {
            const path = obj.getPath();
            const sync = () => {
              if (isUpdatingByCode.current) return;
              const pts: LatLng[] = [];
              for (let i = 0; i < path.getLength(); i++) {
                const p = path.getAt(i);
                pts.push({ lat: p.lat(), lng: p.lng() });
              }
              onChangeRef.current({ ...zone, geometry: pts });
            };
            listeners.push(path.addListener('insert_at', sync));
            listeners.push(path.addListener('set_at', sync));
            listeners.push(path.addListener('remove_at', sync));
        }
      }

      return () => {
        listeners.forEach(l => l && l.remove && l.remove());
      };
    }
    // Для 2ГИС редактирование не поддерживается
  }, [isEditing, nativeObjectRef.current, zone]); // Добавляем zone в зависимости
  
  return null; // Компонент не рендерит DOM
}
function fromYandexCoords(yandexCoords: number[] | number[][]): LatLng | LatLng[] {
    if (Array.isArray(yandexCoords[0])) {
        return (yandexCoords as number[][]).map(p => ({ lat: p[0], lng: p[1] }));
    }
    const p = yandexCoords as number[];
    return { lat: p[0], lng: p[1] };
}
