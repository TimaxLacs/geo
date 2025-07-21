"use client";

import { SidebarLayout } from "hasyx/components/sidebar/layout";
import sidebar from "@/app/sidebar";
import pckg from "@/package.json";
import { useState, useRef, useEffect } from "react";
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

function SettingMapSelector({ onUpdate, position }: { 
  onUpdate: (params: { lat: number; lng: number; zoom: number; width: number; height: number }) => void;
  position: { lat: number; lng: number; zoom: number };
}){
  const [zoom, setZoom] = useState(13);
  const [lat, setLat] = useState(55.7558);
  const [lng, setLng] = useState(37.6173);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(500);
  
  // Синхронизируем инпуты с позицией карты
  useEffect(() => {
    setLat(position.lat);
    setLng(position.lng);
    setZoom(position.zoom);
  }, [position]);
  
  const handleUpdate = () => {
    onUpdate({ lat, lng, zoom, width, height });
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
      
      <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 mt-4">
        Размеры карты
      </h3>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Ширина (px)
          </label>
          <input
            type="number"
            step="50"
            min="200"
            max="2000"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            className="w-full p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="800"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Высота (px)
          </label>
          <input
            type="number"
            step="50"
            min="200"
            max="1500"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            className="w-full p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            placeholder="500"
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
  const [mapSize, setMapSize] = useState({ width: 800, height: 500 });
  
  // Два отдельных состояния для разделения источников
  const [inputPosition, setInputPosition] = useState({ lat: 55.7558, lng: 37.6173, zoom: 13 }); // Обновляется от карты
  const [mapPosition, setMapPosition] = useState({ lat: 55.7558, lng: 37.6173, zoom: 13 }); // Обновляется от инпутов
  
  const [mapKey, setMapKey] = useState(0);

  // Параметры карты берутся из mapPosition (не из inputPosition!)
  const mapParams = { lng: mapPosition.lng, lat: mapPosition.lat, zoom: mapPosition.zoom, width: mapSize.width, height: mapSize.height };
  
  // Определяем, нужно ли перемещать панель наверх при большой ширине карты
  const isWideMap = mapParams.width > 1200;
  
  const handleMapUpdate = (params: { lat: number; lng: number; zoom: number; width: number; height: number }) => {
    console.log('handleMapUpdate called (от инпутов):', params);
    
    // Проверяем, изменились ли размеры
    const sizeChanged = mapSize.width !== params.width || mapSize.height !== params.height;
    
    // Обновляем размеры карты
    setMapSize({ width: params.width, height: params.height });
    
    // Обновляем позицию карты (карта получит новые пропсы)
    setMapPosition({ lat: params.lat, lng: params.lng, zoom: params.zoom });
    
    // Синхронизируем инпуты
    setInputPosition({ lat: params.lat, lng: params.lng, zoom: params.zoom });
    
    // Если размеры изменились, принудительно перерендерим карту
    if (sizeChanged) {
      setMapKey(prev => prev + 1);
    }
  };
  
  const handlePositionChange = (position: { lat: number; lng: number; zoom: number }) => {
    console.log('handlePositionChange called (от драга карты):', position);
    
    // От драга карты - обновляем ТОЛЬКО инпуты, карту НЕ трогаем!
    setInputPosition(position);
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
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            {selected ? (
              <div className="space-y-4">
                <div 
                  style={{ width: mapSize.width + 'px', height: mapSize.height + 'px', border: '2px solid #e5e7eb', borderRadius: '8px' }}
                >
                  <Geo 
                    key={`${selected}-${mapKey}`}
                    ref={geoRef} 
                    provider={selected} 
                    onPosition={handlePositionChange}
                    {...mapParams} 
                  />
                </div>
                <CodeTemplate provider={selected} params={mapParams} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg" style={{ width: '100%', height: '100%' }}>
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
              {/* Передаем inputPosition в панель (показываем актуальные координаты от карты) */}
              <SettingMapSelector onUpdate={handleMapUpdate} position={inputPosition}/>
              </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}