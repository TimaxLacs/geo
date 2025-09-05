import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { GeoObject, LatLng } from '@/lib/core/geo-types';

// Временный тип, пока не вынесем в отдельный файл
type YandexGeoObject = {
  GeoObject: {
    name: string;
    description: string;
    Point: {
      pos: string; // "37.6173 55.7558"
    };
    metaDataProperty: {
      GeocoderMetaData: {
        text: string;
      };
    };
  };
};

type GoogleGeocodeResult = {
  results: {
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    address_components: {
      long_name: string;
      types: string[];
    }[];
  }[];
  status: string;
};

type TwoGisGeocodeResult = {
  result: {
    items: {
      full_name: string;
      name: string;
      type: string;
      point: {
        lat: number;
        lon: number;
      };
    }[];
  };
  meta: {
    api_version: string;
    code: number;
    error?: {
      message: string;
    };
  };
};

async function yandexGeocode(params: URLSearchParams) {
  const apiKey = process.env.NEXT_PUBLIC_YANDEX_API_KEY;
  if (!apiKey) {
    throw new Error('Yandex Maps API key is not configured.');
  }
  
  const geocode = params.get('address') || params.get('geocode');
  params.set('geocode', geocode!);
  params.delete('address');

  params.append('apikey', apiKey);
  params.append('format', 'json');
  params.append('results', '10');

  const res = await fetch(`https://geocode-maps.yandex.ru/1.x/?${params.toString()}`);
  
  if (!res.ok) {
    const errorBody = await res.text();
    console.error("Yandex API request failed with status:", res.status, "Body:", errorBody);
    throw new Error(`Failed to fetch from Yandex Geocode API: ${res.statusText}`);
  }

  const data = await res.json();

  if (!data.response || !data.response.GeoObjectCollection || !data.response.GeoObjectCollection.featureMember) {
    return [];
  }

  return data.response.GeoObjectCollection.featureMember.map((item: YandexGeoObject) => {
    const [lng, lat] = item.GeoObject.Point.pos.split(' ').map(Number);
    return {
      coords: { lat, lng },
      name: item.GeoObject.name,
      description: item.GeoObject.description,
      text: item.GeoObject.metaDataProperty.GeocoderMetaData.text,
    };
  });
}

async function googleGeocode(params: URLSearchParams) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('Google Maps API key is not configured.');
  }
  
  if (params.has('lat') && params.has('lng')) {
    params.set('latlng', `${params.get('lat')},${params.get('lng')}`);
    params.delete('lat');
    params.delete('lng');
  }

  params.append('key', apiKey);
  
  const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);
  
  if (!res.ok) {
    throw new Error(`Failed to fetch from Google Geocode API: ${res.statusText}`);
  }

  const data = await res.json();

  if (data.status === 'ZERO_RESULTS') {
    return []; // Gracefully handle no results by returning an empty array
  }

  if (data.status !== 'OK') {
    console.error('Google geocode fetch error:', data);
    throw new Error(`Google Geocode API error: ${data.status}`);
  }

  return data.results.map((item: any) => {
    const nameComponent = item.address_components.find(c => c.types.includes('route') || c.types.includes('premise')) || item.address_components[0];
    const descriptionComponent = item.address_components.find(c => c.types.includes('locality') || c.types.includes('administrative_area_level_1'));
    
    return {
      coords: item.geometry.location,
      name: nameComponent?.long_name || 'Название не найдено',
      description: descriptionComponent?.long_name || 'Описание не найдено',
      text: item.formatted_address,
    };
  });
}

async function twoGisGeocode(params: URLSearchParams): Promise<GeoObject[]> {
  const apiKey = process.env.NEXT_PUBLIC_2GIS_API_KEY;
  if (!apiKey) {
    throw new Error('2GIS API key is not configured.');
  }

  // Преобразуем универсальные параметры в формат 2ГИС
  if (params.has('address')) {
    params.set('q', params.get('address')!);
    params.delete('address');
  }

  const url = `https://catalog.api.2gis.com/3.0/items/geocode`;
  params.set('key', apiKey);
  params.set('fields', 'items.point,items.full_name,items.name');

  try {
    const res = await fetch(`${url}?${params.toString()}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error("2GIS Catalog API request failed with status:", res.status, "Body:", errorBody);
      throw new Error(`Failed to fetch from 2GIS API: ${res.statusText}`);
    }

    const data = await res.json();

    if (data.meta.code !== 200) {
      if (data.meta?.error?.message?.toLowerCase()?.includes('not found')) {
        return [];
      }
      console.error('2GIS geocode fetch error:', data);
      throw new Error(`2GIS API error: ${data.meta.error?.message || 'Unknown error'}`);
    }

    if (!data.result || !data.result.items) {
      return [];
    }

    return data.result.items.map((item: any) => ({
      coords: { lat: item.point.lat, lng: item.point.lon },
      name: item.name || 'Название не найдено',
      description: item.full_name || item.name,
      text: item.full_name || 'Адрес не указан',
    }));
  } catch (error: any) {
    console.error('[2GIS Geocode] Critical fetch error:', error.message, error.cause);
    throw new Error(`2GIS geocode fetch failed. See server logs for details.`);
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const provider = searchParams.get('provider');
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    let results: GeoObject[] = [];
    
    // Передаем searchParams напрямую, без создания нового экземпляра
    if (provider === 'yandex') {
        results = await yandexGeocode(searchParams);
    } else if (provider === 'google') {
        results = await googleGeocode(searchParams);
    } else if (provider === '2gis') {
        // Сервер сам разберется с параметрами
        results = await twoGisGeocode(searchParams);
    } else {
      return NextResponse.json({ error: `Provider "${provider}" is not supported yet.` }, { status: 400, headers: corsHeaders });
    }
    
    return NextResponse.json(results, { headers: corsHeaders });

  } catch (error: any) {
    console.error(`Geocode API error for provider ${provider}:`, { message: error.message, stack: error.stack });
    return NextResponse.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
}
