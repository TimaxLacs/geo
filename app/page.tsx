"use client";

import { useState } from "react";
import { SidebarLayout } from "hasyx/components/sidebar/layout";
import sidebar from "@/app/sidebar";
import pckg from "@/package.json";
import YandexMap from "../yandex/index";
import GoogleMap from "../google/index";
import TwoGISMap from "../2gis/index";

const MAP_OPTIONS = [
  { label: "Яндекс", value: "yandex", icon: "��️" },
  { label: "Гугл", value: "google", icon: "��" },
  { label: "2ГИС", value: "2gis", icon: "📍" },
];

export default function Page() {
  const [selected, setSelected] = useState<string>("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen">
      {/* Боковая панель */}
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
            {MAP_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelected(option.value)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  selected === option.value
                    ? 'bg-gray-700 text-white border border-gray-600'
                    : 'hover:bg-gray-800 text-gray-300'
                }`}
              >
                <span className="text-xl"></span>
                {!isSidebarCollapsed && <span>{option.label}</span>}
              </button>
            ))}
          </div>
        </div>
      </aside>


      <main className="flex-1 flex items-center justify-center bg-gray-800">
        <div className="w-full max-w-4xl p-8">
          {selected === "yandex" && <YandexMap lng={37.6173} lat={55.7558} />}
          {selected === "google" && <GoogleMap lng={37.6173} lat={55.7558} />}
          {selected === "2gis" && <TwoGISMap lng={37.6173} lat={55.7558} />}
          
          {!selected && (
            <div className="text-center text-gray-400">
              <h2 className="text-2xl font-semibold mb-4">Выберите провайдер карт</h2>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}