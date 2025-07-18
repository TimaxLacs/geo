import React, { createContext, useContext, useMemo } from 'react';
import { YandexGeoProvider } from '../yandex/index';
import { GoogleGeoProvider } from '../google/index';
import { TwoGISGeoProvider } from '../2gis/index';

export interface GeoMapProps {
    lat: number;
    lng: number;
    zoom?: number;
    width?: number | string;
    height?: number | string;
}

export interface GeoProvider {
    GeoMap: React.ComponentType<GeoMapProps>;
    // Здесь можно добавить другие методы (addMarker, setCenter и т.д.)
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

export function Geo(props: GeoProps) {
    const { provider, children, ..._props } = props;
    const _provider = useMemo(() => new classes[provider](), [provider]);
    const GeoMap = _provider.GeoMap;
    return (
        <GeoContext.Provider value={_provider}>
            <GeoMap {..._props} />
            {children}
        </GeoContext.Provider>
    );
}