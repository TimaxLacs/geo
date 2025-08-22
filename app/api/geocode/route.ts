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


async function yandexGeocode(query: string): Promise<GeoObject[]> {
  const apiKey = process.env.YANDEX_MAPS_API_KEY;
  if (!apiKey) throw new Error('Yandex Maps API key is not configured.');
  
  const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${apiKey}&format=json&geocode=${encodeURIComponent(query)}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Yandex Geocode API error');
    }

    const geoObjects = data.response.GeoObjectCollection.featureMember;
    
    return geoObjects.map((item: YandexGeoObject) => {
      const [lng, lat] = item.GeoObject.Point.pos.split(' ').map(Number);
      return {
        coords: { lat, lng },
        name: item.GeoObject.name,
        description: item.GeoObject.description,
        text: item.GeoObject.metaDataProperty.GeocoderMetaData.text,
      };
    });
  } catch (error) {
    console.error('Yandex geocode fetch error:', error);
    return [];
  }
}

async function googleGeocode(address?: string | null, latlng?: string | null): Promise<GeoObject[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) throw new Error('Google Maps API key is not configured.');

  let url = `https://maps.googleapis.com/maps/api/geocode/json?key=${apiKey}`;
  if (address) {
    url += `&address=${encodeURIComponent(address)}`;
  } else if (latlng) {
    url += `&latlng=${latlng}`;
  } else {
    return [];
  }

  try {
    const response = await fetch(url);
    const data: GoogleGeocodeResult = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google Geocode API error: ${data.status}`);
    }

    return data.results.map(item => {
      const nameComponent = item.address_components.find(c => c.types.includes('route') || c.types.includes('premise')) || item.address_components[0];
      const descriptionComponent = item.address_components.find(c => c.types.includes('locality') || c.types.includes('administrative_area_level_1'));
      
      return {
        coords: item.geometry.location,
        name: nameComponent?.long_name || 'Название не найдено',
        description: descriptionComponent?.long_name || 'Описание не найдено',
        text: item.formatted_address,
      };
    });
  } catch (error) {
    console.error('Google geocode fetch error:', error);
    return [];
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const provider = searchParams.get('provider');
  const address = searchParams.get('address');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  try {
    let results: GeoObject[] = [];

    if (provider === 'yandex') {
      if (address) {
        results = await yandexGeocode(address);
      } else if (lat && lng) {
        const query = `${lng},${lat}`;
        results = await yandexGeocode(query);
      }
    } else if (provider === 'google') {
      if (address) {
        results = await googleGeocode(address, null);
      } else if (lat && lng) {
        results = await googleGeocode(null, `${lat},${lng}`);
      }
    } else {
      return NextResponse.json({ error: `Provider "${provider}" is not supported yet.` }, { status: 400 });
    }

    if (!address && !(lat && lng)) {
      return NextResponse.json({ error: 'Either "address" or "lat" and "lng" parameters are required.' }, { status: 400 });
    }
    
    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
