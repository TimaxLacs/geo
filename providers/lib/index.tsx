import React, { createContext, useContext, useMemo, useImperativeHandle, forwardRef } from 'react';
import { YandexGeoProvider } from '../yandex/index';
import { GoogleGeoProvider } from '../google/index';
import { TwoGISGeoProvider } from '../2gis/index';
import { MarkerData, ProviderMarkerHandle, GeoObject, LatLng } from '@/lib/core/geo-types';

export interface GeoMapProps {
    lat: number;
    lng: number;
    zoom?: number;
    width?: number | string;
    height?: number | string;
    onPosition?: (position: { lat: number; lng: number; zoom: number }) => void;
    onReady?: () => void;
}

export interface GeoProvider {
    GeoMap: React.ComponentType<GeoMapProps>;
    // Императивные методы для обновления карты
    setCenter?: (lat: number, lng: number) => void;
    setZoom?: (zoom: number) => void;
    updateMap?: (params: Partial<GeoMapProps>) => void;
    
    // Методы для работы с маркерами
    addMarker?: (marker: MarkerData, onDragEnd: (newPosition: { lat: number, lng: number }) => void) => ProviderMarkerHandle;
    removeMarker?: (handle: ProviderMarkerHandle) => void;
    updateMarker?: (handle: ProviderMarkerHandle, marker: MarkerData) => void;
    updateMarkerPosition?: (handle: ProviderMarkerHandle, position: { lat: number, lng: number }) => void;
    onMapClick?: (callback: (coords: { lat: number, lng: number }) => void) => () => void;
    
    // Методы для геокодинга
    geocode?: (address: string) => Promise<GeoObject[]>;
    reverseGeocode?: (position: LatLng) => Promise<GeoObject[]>;
}

// Интерфейс для императивного API
export interface GeoImperativeHandle {
    setCenter: (lat: number, lng: number) => void;
    setZoom: (zoom: number) => void;
    updateMap: (params: Partial<GeoMapProps>) => void;
    
    // Методы для работы с маркерами, которые будут доступны через ref
    addMarker: (marker: MarkerData, onDragEnd: (newPosition: { lat: number, lng: number }) => void) => ProviderMarkerHandle;
    removeMarker: (handle: ProviderMarkerHandle) => void;
    updateMarker: (handle: ProviderMarkerHandle, marker: MarkerData) => void;
    updateMarkerPosition: (handle: ProviderMarkerHandle, position: { lat: number, lng: number }) => void;
    onMapClick: (callback: (coords: { lat: number, lng: number }) => void) => () => void;
    
    // Методы для геокодинга
    geocode: (address: string) => Promise<GeoObject[]>;
    reverseGeocode: (position: LatLng) => Promise<GeoObject[]>;
}

export const GeoContext = createContext<GeoProvider | undefined>(undefined);
export const useGeo = () => useContext(GeoContext);

const classes: Record<string, any> = {
    yandex: YandexGeoProvider,
    google: GoogleGeoProvider,
    '2gis': TwoGISGeoProvider,
};

export interface GeoProps extends GeoMapProps {
    provider: string;
    children?: React.ReactNode;
}

export const Geo = forwardRef<GeoImperativeHandle, GeoProps>((props, ref) => {
    const { provider, children, ..._props } = props;
    const _provider = useMemo(() => new classes[provider](), [provider]);
    const GeoMap = _provider.GeoMap;
    
    // Экспортируем императивные методы через ref
    useImperativeHandle(ref, () => ({
        setCenter: (lat: number, lng: number) => {
            if (_provider.setCenter) {
                _provider.setCenter(lat, lng);
            }
        },
        setZoom: (zoom: number) => {
            if (_provider.setZoom) {
                _provider.setZoom(zoom);
            }
        },
        updateMap: (params: Partial<GeoMapProps>) => {
            if (_provider.updateMap) {
                _provider.updateMap(params);
            }
        },
        addMarker: (marker: MarkerData, onDragEnd: (newPosition: { lat: number, lng: number }) => void) => {
            if (_provider.addMarker) {
                return _provider.addMarker(marker, onDragEnd);
            }
            throw new Error(`Provider ${provider} does not support addMarker.`);
        },
        removeMarker: (handle: ProviderMarkerHandle) => {
            if (_provider.removeMarker) {
                _provider.removeMarker(handle);
            } else {
              throw new Error(`Provider ${provider} does not support removeMarker.`);
            }
        },
        updateMarker: (handle: ProviderMarkerHandle, marker: MarkerData) => {
          if (_provider.updateMarker) {
            _provider.updateMarker(handle, marker);
          } else {
            throw new Error(`Provider ${provider} does not support updateMarker.`);
          }
        },
        updateMarkerPosition: (handle: ProviderMarkerHandle, position: { lat: number, lng: number }) => {
            if (_provider.updateMarkerPosition) {
                _provider.updateMarkerPosition(handle, position);
            } else {
                throw new Error(`Provider ${provider} does not support updateMarkerPosition.`);
            }
        },
        onMapClick: (callback: (coords: { lat: number, lng: number }) => void) => {
            if (_provider.onMapClick) {
                return _provider.onMapClick(callback);
            }
            // Возвращаем пустую функцию отписки, если метод не поддерживается
            return () => {};
        },
        geocode: async (address: string) => {
            if (_provider.geocode) {
                return _provider.geocode(address);
            }
            throw new Error(`Provider ${provider} does not support geocode.`);
        },
        reverseGeocode: async (position: LatLng) => {
            if (_provider.reverseGeocode) {
                return _provider.reverseGeocode(position);
            }
            throw new Error(`Provider ${provider} does not support reverseGeocode.`);
        }
    }), [_provider, provider]);
    
    return (
        <GeoContext.Provider value={_provider}>
            <GeoMap {..._props} />
            {children}
        </GeoContext.Provider>
    );
});

Geo.displayName = 'Geo';