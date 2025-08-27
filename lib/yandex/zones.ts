import { LatLng, ProviderId, ZoneData, ProviderZoneHandle, ZoneType } from '@/lib/core/geo-types';
import { ZoneAdapter } from '../zones/engine';

function toYandexCoords(geometry: LatLng | LatLng[]): any {
    if (Array.isArray(geometry)) {
        return geometry.map(p => [p.lat, p.lng]);
    }
    return [geometry.lat, geometry.lng];
}

function fromYandexCoords(yandexCoords: number[] | number[][]): LatLng | LatLng[] {
    if (Array.isArray(yandexCoords[0])) { // Массив массивов
        return (yandexCoords as number[][]).map(p => ({ lat: p[0], lng: p[1] }));
    }
    // Одиночные координаты
    const p = yandexCoords as number[];
    return { lat: p[0], lng: p[1] };
}


export class YandexZoneAdapter implements ZoneAdapter {
    mount(context: { map: any; ymaps: any }, zone: ZoneData, onEditEnd: (newGeometry: LatLng[] | LatLng, newRadius?: number) => void): ProviderZoneHandle {
        let geoObject: any;
        const style = zone.style || {};

        const options = {
            fillColor: style.fillColor || '#0066ff99',
            fillOpacity: style.fillOpacity,
            strokeColor: style.strokeColor || '#0066ff',
            strokeOpacity: (style.strokeOpacity || 1) * 0.8,
            strokeWidth: style.strokeWidth || 3,
        };

        switch (zone.type) {
            case 'circle':
                geoObject = new context.ymaps.Circle([toYandexCoords(zone.geometry), zone.radius || 1000], {}, options);
                break;
            case 'polygon':
            case 'rectangle': // Прямоугольник тоже будет полигоном
                geoObject = new context.ymaps.Polygon([toYandexCoords(zone.geometry)], {}, options);
                break;
            case 'polyline':
                geoObject = new context.ymaps.Polyline(toYandexCoords(zone.geometry), {}, {
                    strokeColor: style.strokeColor || '#0066ff',
                    strokeWidth: style.strokeWidth || 4,
                    strokeOpacity: style.strokeOpacity || 0.8,
                });
                break;
            default:
                throw new Error(`Unsupported zone type: ${zone.type}`);
        }

        context.map.geoObjects.add(geoObject);

        if (zone.editable) {
            geoObject.editor.startEditing();
        }

        // Подписка на окончание редактирования
        geoObject.editor.events.add('geometrychange', (e: any) => {
            const newNativeGeometry = e.get('newCoordinates') || e.get('newGeometry');
            const newRadius = e.get('newRadius');
            if (newNativeGeometry) {
                const newCoords = fromYandexCoords(newNativeGeometry);
                onEditEnd(newCoords, newRadius);
            }
        });

        const handle: ProviderZoneHandle = {
            id: zone.id,
            nativeHandle: geoObject,
            remove: () => {
                context.map.geoObjects.remove(geoObject);
            },
            update: (newZone: ZoneData) => {
                this.update(handle, newZone);
            },
            setEditable: (editable: boolean) => {
                this.setEditable(handle, editable);
            }
        };

        return handle;
    }

    unmount(handle: ProviderZoneHandle): void {
        handle.remove();
    }

    update(handle: ProviderZoneHandle, newZoneData: ZoneData): void {
        const geoObject = handle.nativeHandle;
        const newStyle = newZoneData.style || {};

        if (newZoneData.type === 'circle') {
            geoObject.geometry.setCoordinates(toYandexCoords(newZoneData.geometry));
            geoObject.geometry.setRadius(newZoneData.radius || 1000);
        } else {
            // BUG FIX: Polygon coordinates must be wrapped in an array (for outer contour)
            geoObject.geometry.setCoordinates([toYandexCoords(newZoneData.geometry)]);
        }

        geoObject.options.set({
            fillColor: newStyle.fillColor,
            fillOpacity: newStyle.fillOpacity,
            strokeColor: newStyle.strokeColor,
            strokeOpacity: newStyle.strokeOpacity,
            strokeWidth: newStyle.strokeWidth,
        });
    }

    setEditable(handle: ProviderZoneHandle, editable: boolean): void {
        const geoObject = handle.nativeHandle;
        if (editable) {
            geoObject.editor.startEditing();
        } else {
            geoObject.editor.stopEditing();
        }
    }
}
