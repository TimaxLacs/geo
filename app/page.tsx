"use client";

import { useState } from "react";
import { Geo } from "../lib/index";

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
    <div className="mt-8 bg-gray-900 text-green-400 p-4 rounded font-mono text-sm overflow-x-auto">
      {`<${componentName} ${paramStr} />`}
    </div>
  );
}

function Sidebar({ selected, setSelected, isSidebarCollapsed, setIsSidebarCollapsed }: {
  selected: string;
  setSelected: (v: string) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (v: boolean) => void;
}) {
  return (
    <aside className={`bg-gray-900 border-r border-gray-700 transition-all duration-300 ${
      isSidebarCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Заголовок панели */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!isSidebarCollapsed && (
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-lg text-white">Geo</h2>
            </div>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1 rounded hover:bg-gray-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
      {/* Выбор провайдера карт */}
      <div className="p-4">
        {!isSidebarCollapsed && (
          <h3 className="font-semibold text-gray-300 mb-3">
            Провайдер карт
          </h3>
        )}
        <div className="space-y-2">
          <select
            className="w-full p-2 rounded bg-gray-800 text-gray-100 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selected}
            onChange={e => setSelected(e.target.value)}
          >
            <option value="">Выберите карту</option>
            {MAP_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>
    </aside>
  );
}

export default function Page() {
  const [selected, setSelected] = useState<string>("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Все параметры карты в одном объекте
  const mapParams = { lng: 37.6173, lat: 55.7558, zoom: 13, width: 800, height: 500 };

  return (
    <div className="flex h-screen">
      <Sidebar
        selected={selected}
        setSelected={setSelected}
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
      />
      <main className="flex-1 flex items-center justify-center bg-gray-800">
        <div className="w-full max-w-4xl p-8">
          {selected ? (
            <Geo provider={selected} {...mapParams}>
              <CodeTemplate provider={selected} params={mapParams} />
            </Geo>
          ) : (
            <div className="text-center text-gray-400">
              <h2 className="text-2xl font-semibold mb-4">Выберите провайдера карт</h2>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}