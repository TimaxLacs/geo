import { ZoneAdapter, ZoneData, ProviderZoneHandle, LatLng } from '@/lib/core/geo-types';

declare const mapgl: any;

// Helper to convert our LatLng[] to 2GIS's [lng, lat][] format
function to2GisCoords(coords: LatLng[]): number[][] {
    return coords.map(c => [c.lng, c.lat]);
}

// Helper to convert 2GIS's [lng, lat] to our LatLng format
function from2GisCoord(coord: number[]): LatLng {
    return { lat: coord[1], lng: coord[0] };
}

// Helper to convert 2GIS's [lng, lat][] to our LatLng[] format
function from2GisCoords(coords: number[][]): LatLng[] {
    return coords.map(c => ({ lat: c[1], lng: c[0] }));
}


export class TwoGisZoneAdapter implements ZoneAdapter {
    private map: any; // Храним экземпляр карты здесь

    mount(
        context: { map: any }, // mapgl.Map instance
        zone: ZoneData,
        onEditEnd: (newGeometry: LatLng | LatLng[], newRadius?: number) => void
    ): ProviderZoneHandle {
        // Сохраняем экземпляр карты при первом вызове
        if (!this.map) {
            this.map = context.map;
        }

        let geoObject: any; // mapgl.Polygon, mapgl.Circle, etc.
        const map = this.map; // Используем сохраненный экземпляр
        
        // Placeholder for the logic
        console.warn(`[2GIS Zone Adapter] Mount for zone type "${zone.type}" is not yet implemented.`);

        // 2GIS mapgl typically uses style objects.
        const style = {
            color: zone.style?.fillColor || '#ff000033',
            strokeColor: zone.style?.strokeColor || '#ff0000',
            strokeWidth: zone.style?.strokeWidth || 2,
        };

        switch (zone.type) {
            case 'circle':
                // Note: 2GIS MapGL might not have a native Circle with radius in meters.
                // This might need to be drawn as a polygon approximation.
                // For now, let's assume a simple circle object exists.
                geoObject = new mapgl.Circle(map, {
                    coordinates: [(zone.geometry as LatLng).lng, (zone.geometry as LatLng).lat],
                    radius: zone.radius || 1000, // This radius might be in pixels, not meters. Needs verification.
                    ...style,
                });
                break;
            case 'polygon':
            case 'rectangle':
                 geoObject = new mapgl.Polygon(map, {
                    coordinates: [to2GisCoords(zone.geometry as LatLng[])],
                    ...style
                });
                break;
            case 'polyline':
                 geoObject = new mapgl.Polyline(map, {
                    coordinates: to2GisCoords(zone.geometry as LatLng[]),
                    ...style
                });
                break;
        }

        const handle: ProviderZoneHandle = {
            id: zone.id,
            nativeHandle: geoObject,
            remove: () => this.unmount(handle),
            update: (newZone: ZoneData) => this.update(handle, newZone),
            setEditable: (editable: boolean) => this.setEditable(handle, editable),
        };

        return handle;
    }

    unmount(handle: ProviderZoneHandle): void {
        if (handle.nativeHandle) {
            handle.nativeHandle.destroy();
        }
    }

    update(handle: ProviderZoneHandle, newZoneData: ZoneData): void {
        const oldGeoObject = handle.nativeHandle;
        if (!oldGeoObject) return;

        // Используем сохраненный экземпляр карты
        const map = this.map; 
        if (!map) {
            console.error('[2GIS Zone Adapter] Cannot update: map instance is not available in adapter.');
            return;
        }

        // 1. Уничтожаем старый объект
        oldGeoObject.destroy();

        // 2. Создаем новый объект с обновленными данными
        let newGeoObject: any;
        const style = {
            color: newZoneData.style?.fillColor || '#ff000033',
            strokeColor: newZoneData.style?.strokeColor || '#ff0000',
            strokeWidth: newZoneData.style?.strokeWidth || 2,
        };

        switch (newZoneData.type) {
            case 'circle':
                newGeoObject = new mapgl.Circle(map, {
                    coordinates: [(newZoneData.geometry as LatLng).lng, (newZoneData.geometry as LatLng).lat],
                    radius: newZoneData.radius || 1000,
                    ...style,
                });
                break;
            case 'polygon':
            case 'rectangle':
                newGeoObject = new mapgl.Polygon(map, {
                    coordinates: [to2GisCoords(newZoneData.geometry as LatLng[])],
                    ...style,
                });
                break;
            case 'polyline':
                newGeoObject = new mapgl.Polyline(map, {
                    coordinates: to2GisCoords(newZoneData.geometry as LatLng[]),
                    ...style,
                });
                break;
        }

        // 3. Заменяем старый нативный объект в handle на новый
        handle.nativeHandle = newGeoObject;
    }

    setEditable(handle: ProviderZoneHandle, editable: boolean): void {
        console.warn(`[2GIS Zone Adapter] setEditable is not yet implemented. This will require custom logic.`);
        // 2GIS MapGL does not have a built-in editor.
        // This would be the most complex part, requiring custom drag handlers for vertices.
    }
}
