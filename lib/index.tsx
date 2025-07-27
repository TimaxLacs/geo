import React, { createContext, useContext, useMemo, useImperativeHandle, forwardRef } from 'react';
import { YandexGeoProvider } from '../providers/yandex/index';
import { GoogleGeoProvider } from '../providers/google/index';
import { TwoGISGeoProvider } from '../providers/2gis/index';

export interface GeoMapProps {
    lat: number;
    lng: number;
    zoom?: number;
    width?: number | string;
    height?: number | string;
    onPosition?: (position: { lat: number; lng: number; zoom: number }) => void;
}

export interface GeoProvider {
    GeoMap: React.ComponentType<GeoMapProps>;
    // Императивные методы для обновления карты
    setCenter?: (lat: number, lng: number) => void;
    setZoom?: (zoom: number) => void;
    updateMap?: (params: Partial<GeoMapProps>) => void;
}

// Интерфейс для императивного API
export interface GeoImperativeHandle {
    setCenter: (lat: number, lng: number) => void;
    setZoom: (zoom: number) => void;
    updateMap: (params: Partial<GeoMapProps>) => void;
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
        }
    }), [_provider]);
    
    return (
        <GeoContext.Provider value={_provider}>
            <GeoMap {..._props} />
            {children}
        </GeoContext.Provider>
    );
});

Geo.displayName = 'Geo';