"use client";

import { SidebarLayout } from "hasyx/components/sidebar/layout";
import sidebar from "@/app/sidebar";
import pckg from "@/package.json";
import { useState, useRef } from "react";
import { Geo, GeoImperativeHandle } from "../providers/lib/index";

const MAP_OPTIONS = [
  { label: "Яндекс", value: "yandex" },
  { label: "Гугл", value: "google" },
  { label: "2ГИС", value: "2gis" },
];

function CodeTemplate({ provider, params }: { provider: string; params: any }) {
  if (!provider) return null;
  let componentName = '';
  switch (provider) {
    case 'yandex': componentName = 'YandexMap'; break;
    case 'google': componentName = 'GoogleMap'; break;
    case '2gis': componentName = 'TwoGISMap'; break;
    default: componentName = 'Map';
  }
  const paramStr = Object.entries(params)
    .map(([k, v]) => `${k}={${typeof v === 'string' ? `"${v}"` : v}}`)
    .join(' ');
  return (
    <div className="mt-4 bg-gray-900 text-green-400 p-4 rounded font-mono text-sm overflow-x-auto">
      {`<${componentName} ${paramStr} />`}
    </div>
  );
}

function ProviderSelector({ selected, setSelected }: {
  selected: string;
  setSelected: (v: string) => void;
}) {
  return (
    <div>
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
        Провайдер карт
      </h3>
      <select
        className="w-full p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={selected}
        onChange={e => setSelected(e.target.value)}
      >
        <option value="">Выберите карту</option>
        {MAP_OPTIONS.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}

function SettingMapSelector({ onUpdate }: { onUpdate: (params: { lat: number; lng: number; zoom: number }) => void }){
  const [zoom, setZoom] = useState(13);
  const [lat, setLat] = useState(55.7558);
  const [lng, setLng] = useState(37.6173);
  
  const handleUpdate = () => {
    onUpdate({ lat, lng, zoom });
  };
  
  return(
    <div className="mt-4">
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
        Параметры карты
      </h3>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Широта
          </label>
          <input
            type="number"
            step="0.0001"
            value={lat}
            onChange={(e) => setLat(Number(e.target.value))}
            className="w-full p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="55.7558"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Долгота
          </label>
          <input
            type="number"
            step="0.0001"
            value={lng}
            onChange={(e) => setLng(Number(e.target.value))}
            className="w-full p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="37.6173"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Масштаб
          </label>
          <input
            type="number"
            step="1"
            min="1"
            max="20"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="13"
          />
                  </div>
      </div>
      <button
        onClick={handleUpdate}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
      >
        Обновить карту
      </button>
    </div>
  );
}

export default function Page() {
  const [selected, setSelected] = useState<string>("");
  const geoRef = useRef<GeoImperativeHandle>(null);

  // Параметры карты
  const mapParams = { lng: 37.6173, lat: 55.7558, zoom: 13, width: 800, height: 500 };
  
  // Определяем, нужно ли перемещать панель наверх при большой ширине карты
  const isWideMap = mapParams.width > 1200;
  
  const handleMapUpdate = (params: { lat: number; lng: number; zoom: number }) => {
    if (geoRef.current) {
      geoRef.current.updateMap(params);
    }
  };

  return (
    <SidebarLayout sidebarData={sidebar} breadcrumb={[{ title: pckg.name, link: '/' }]}>
      <div className="p-6">
        {/* Используем гибкую сетку с учетом ширины карты */}
        <div className={`grid gap-6 ${
          isWideMap 
            ? 'grid-cols-1' // При широкой карте - панель сверху
            : 'grid-cols-1 md:grid-cols-[1fr_300px]' // При обычной карте - панель справа
        }`}>
          
          {/* Основной контент с картой - всегда первый в DOM */}
          <div>
            {selected ? (
              <div className="space-y-4">
                <Geo ref={geoRef} provider={selected} {...mapParams} />
                <CodeTemplate provider={selected} params={mapParams} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <h2 className="text-xl font-semibold mb-2">Выберите провайдера карт</h2>
                  <p>Используйте панель {isWideMap ? 'внизу' : 'справа'} для выбора карты</p>
                </div>
              </div>
            )}
          </div>

          {/* Селектор провайдера - справа или снизу в зависимости от ширины */}
          <div className="w-full">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg"> 
              <ProviderSelector selected={selected} setSelected={setSelected} />
              <SettingMapSelector onUpdate={handleMapUpdate}/>
              </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}