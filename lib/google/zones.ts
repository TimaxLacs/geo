import { ZoneAdapter, ZoneData, ProviderZoneHandle, LatLng } from '@/lib/core/geo-types';

// Helper function to convert our LatLng to Google's format
function toGoogleCoords(coords: LatLng | LatLng[]): google.maps.LatLngLiteral | google.maps.LatLngLiteral[] {
    if (Array.isArray(coords)) {
        return coords.map(c => ({ lat: c.lat, lng: c.lng }));
    }
    return { lat: coords.lat, lng: coords.lng };
}

// Helper function to convert Google's LatLng to our format
function fromGoogleCoords(coords: google.maps.LatLng): LatLng {
    return { lat: coords.lat(), lng: coords.lng() };
}

// Helper function to convert Google's MVCArray of LatLngs to our format
function fromGooglePath(path: google.maps.MVCArray<google.maps.LatLng>): LatLng[] {
    const result: LatLng[] = [];
    path.forEach(latLng => {
        result.push(fromGoogleCoords(latLng));
    });
    return result;
}

export class GoogleZoneAdapter implements ZoneAdapter {
    mount(
        context: { map: google.maps.Map },
        zone: ZoneData,
        onEditEnd: (newGeometry: LatLng | LatLng[], newRadius?: number) => void
    ): ProviderZoneHandle {
        let geoObject: google.maps.Polygon | google.maps.Circle | google.maps.Polyline;
        const map = context.map;

        // --- РЕШЕНИЕ ПРОБЛЕМЫ БЕСКОНЕЧНОГО ЦИКЛА (ВАРИАНТ 6) ---
        let isUpdatingByCode = false;

        const commonOptions = {
            strokeColor: zone.style?.strokeColor || '#FF0000',
            strokeOpacity: zone.style?.opacity ?? 0.8,
            strokeWeight: zone.style?.strokeWidth || 2,
            editable: zone.editable || false,
            map: map,
        };

        const editEndHandler = () => {
            if (isUpdatingByCode) return;

            if (geoObject instanceof google.maps.Circle) {
                const newRadius = geoObject.getRadius();
                const center = geoObject.getCenter();
                if (center) {
                    onEditEnd(fromGoogleCoords(center), newRadius);
                }
            } else if (geoObject instanceof google.maps.Polygon || geoObject instanceof google.maps.Polyline) {
                onEditEnd(fromGooglePath(geoObject.getPath()));
            }
        };

        switch (zone.type) {
            case 'circle':
                geoObject = new google.maps.Circle({
                    ...commonOptions,
                    center: toGoogleCoords(zone.geometry as LatLng) as google.maps.LatLngLiteral,
                    radius: zone.radius || 1000,
                    fillColor: zone.style?.fillColor || '#FF0000',
                    fillOpacity: zone.style?.fillOpacity ?? 0.35,
                });

                google.maps.event.addListener(geoObject, 'radius_changed', editEndHandler);
                google.maps.event.addListener(geoObject, 'center_changed', editEndHandler);
                break;
            
            case 'polygon':
            case 'rectangle':
                 geoObject = new google.maps.Polygon({
                    ...commonOptions,
                    paths: toGoogleCoords(zone.geometry as LatLng[]) as google.maps.LatLngLiteral[],
                    fillColor: zone.style?.fillColor || '#FF0000',
                    fillOpacity: zone.style?.fillOpacity ?? 0.35,
                });
                
                geoObject.getPath().addListener('set_at', editEndHandler);
                geoObject.getPath().addListener('insert_at', editEndHandler);
                break;

            case 'polyline':
                 geoObject = new google.maps.Polyline({
                    ...commonOptions,
                    path: toGoogleCoords(zone.geometry as LatLng[]) as google.maps.LatLngLiteral[],
                });
                
                geoObject.getPath().addListener('set_at', editEndHandler);
                geoObject.getPath().addListener('insert_at', editEndHandler);
                break;
        }

        const handle: ProviderZoneHandle = {
            id: zone.id,
            nativeHandle: geoObject,
            remove: () => this.unmount(handle),
            update: (newZone: ZoneData) => {
                isUpdatingByCode = true;
                this.update(handle, newZone);
                setTimeout(() => {
                    isUpdatingByCode = false;
                }, 50);
            },
            setEditable: (editable: boolean) => this.setEditable(handle, editable),
        };

        return handle;
    }

    unmount(handle: ProviderZoneHandle): void {
        const geoObject = handle.nativeHandle as google.maps.Polygon | google.maps.Circle | google.maps.Polyline;
        geoObject.setMap(null);
        google.maps.event.clearInstanceListeners(geoObject);
    }

    update(handle: ProviderZoneHandle, newZoneData: ZoneData): void {
        const geoObject = handle.nativeHandle;

        const commonOptions = {
            strokeColor: newZoneData.style?.strokeColor || '#FF0000',
            strokeOpacity: newZoneData.style?.opacity ?? 0.8,
            strokeWeight: newZoneData.style?.strokeWidth || 2,
        };

        if (geoObject instanceof google.maps.Circle) {
             geoObject.setCenter(toGoogleCoords(newZoneData.geometry as LatLng) as google.maps.LatLngLiteral);
             geoObject.setRadius(newZoneData.radius || 1000);
             geoObject.setOptions({
                ...commonOptions,
                fillColor: newZoneData.style?.fillColor || '#FF0000',
                fillOpacity: newZoneData.style?.fillOpacity ?? 0.35,
             });
        } else if (geoObject instanceof google.maps.Polygon) {
            geoObject.setPaths(toGoogleCoords(newZoneData.geometry as LatLng[]) as google.maps.LatLngLiteral[]);
            geoObject.setOptions({
                ...commonOptions,
                fillColor: newZoneData.style?.fillColor || '#FF0000',
                fillOpacity: newZoneData.style?.fillOpacity ?? 0.35,
             });
        } else if (geoObject instanceof google.maps.Polyline) {
            geoObject.setPath(toGoogleCoords(newZoneData.geometry as LatLng[]) as google.maps.LatLngLiteral[]);
            geoObject.setOptions(commonOptions);
        }
    }

    setEditable(handle: ProviderZoneHandle, editable: boolean): void {
        const geoObject = handle.nativeHandle as google.maps.Polygon | google.maps.Circle | google.maps.Polyline;
        geoObject.setEditable(editable);
    }
}
