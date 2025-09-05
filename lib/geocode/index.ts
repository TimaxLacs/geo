import { ProviderId, LatLng, GeoObject } from '@/lib/core/geo-types';

async function fetchGeocode(provider: ProviderId, params: URLSearchParams): Promise<GeoObject[]> {
    try {
        // Костыль для 2GIS, который ожидает 'lon' вместо 'lng'
        if (provider === '2gis' && params.has('lng')) {
            params.append('lon', params.get('lng')!);
            params.delete('lng');
        }
        
        const response = await fetch(`/api/geocode?provider=${provider}&${params.toString()}`);
        if (!response.ok) {
            const err = await response.json();
            const errorMessage = err.error || `Ошибка геокодинга для ${provider}`;
            console.error(`Ошибка ответа сервера (${provider}):`, errorMessage);
            throw new Error(errorMessage);
        }
        return await response.json();
    } catch (error) {
        console.error(`Ошибка выполнения запроса геокодинга для ${provider}:`, error);
        // Возвращаем пустой массив, чтобы не ломать приложение
        return [];
    }
}

export async function geocode(provider: ProviderId, address: string): Promise<GeoObject[]> {
    const params = new URLSearchParams({ address });
    return fetchGeocode(provider, params);
}

export async function reverseGeocode(provider: ProviderId, position: LatLng): Promise<GeoObject[]> {
    const params = new URLSearchParams({ 
        lat: position.lat.toString(), 
        lng: position.lng.toString() 
    });
    return fetchGeocode(provider, params);
}

