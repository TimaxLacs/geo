"use client";

import { SidebarLayout } from "hasyx/components/sidebar/layout";
import sidebar from "@/app/sidebar";
import pckg from "@/package.json";
import { useState, useRef, useEffect } from "react";
import { Geo, GeoImperativeHandle } from "../providers/lib/index";
import { MarkerData, ProviderId, ProviderMarkerHandle, LatLng, GeoObject } from "@/lib/core/geo-types";
import { v4 as uuidv4 } from 'uuid';
import { isEqual } from 'lodash';
import { Pencil, Move, Trash2 } from 'lucide-react';

const MAP_OPTIONS: { label: string; value: ProviderId }[] = [
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
  selected: ProviderId | "";
  setSelected: (v: ProviderId | "") => void;
}) {
  return (
    <div>
      <h3 className="font-semibold text-sidebar-foreground mb-3">
        Провайдер карт
      </h3>
      <select
        className="w-full p-2 rounded-md bg-sidebar-accent text-sidebar-foreground border border-sidebar-border focus:outline-none focus:ring-2 focus:ring-sidebar-ring"
        value={selected}
        onChange={e => setSelected(e.target.value as ProviderId | "")}
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
      <h3 className="font-semibold text-sidebar-foreground mb-3">
        Параметры карты
      </h3>
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-sidebar-foreground/70 mb-1">
            Широта
          </label>
          <input
            type="number"
            step="0.0001"
            value={lat}
            onChange={(e) => setLat(Number(e.target.value))}
            className="w-full p-2 rounded-md bg-sidebar-accent text-sidebar-foreground border border-sidebar-border focus:outline-none focus:ring-2 focus:ring-sidebar-ring text-sm"
            placeholder="55.7558"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-sidebar-foreground/70 mb-1">
            Долгота
          </label>
          <input
            type="number"
            step="0.0001"
            value={lng}
            onChange={(e) => setLng(Number(e.target.value))}
            className="w-full p-2 rounded-md bg-sidebar-accent text-sidebar-foreground border border-sidebar-border focus:outline-none focus:ring-2 focus:ring-sidebar-ring text-sm"
            placeholder="37.6173"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-sidebar-foreground/70 mb-1">
            Масштаб
          </label>
          <input
            type="number"
            step="1"
            min="1"
            max="20"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full p-2 rounded-md bg-sidebar-accent text-sidebar-foreground border border-sidebar-border focus:outline-none focus:ring-2 focus:ring-sidebar-ring text-sm"
            placeholder="13"
          />
        </div>
      </div>
      
      <h3 className="font-semibold text-sidebar-foreground mb-3 mt-4">
        Размеры карты
      </h3>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-sidebar-foreground/70 mb-1">
            Ширина (px)
          </label>
          <input
            type="number"
            step="50"
            min="200"
            max="2000"
            value={width}
            onChange={(e) => setWidth(Number(e.target.value))}
            className="w-full p-2 rounded-md bg-sidebar-accent text-sidebar-foreground border border-sidebar-border focus:outline-none focus:ring-2 focus:ring-sidebar-ring text-sm"
            placeholder="800"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-sidebar-foreground/70 mb-1">
            Высота (px)
          </label>
          <input
            type="number"
            step="50"
            min="200"
            max="1500"
            value={height}
            onChange={(e) => setHeight(Number(e.target.value))}
            className="w-full p-2 rounded-md bg-sidebar-accent text-sidebar-foreground border border-sidebar-border focus:outline-none focus:ring-2 focus:ring-sidebar-ring text-sm"
            placeholder="500"
          />
        </div>
      </div>
      
            <button
        onClick={handleUpdate}
        className="w-full bg-primary hover:bg-opacity-90 text-primary-foreground font-medium py-2 px-4 rounded-md transition-colors"
      >
        Обновить карту
      </button>
    </div>
  );
}

function MarkersPanel({
  markers,
  setMarkers,
  currentLat,
  currentLng,
  provider,
  geoHandle,
  isMapReady,
}: {
  markers: MarkerData[];
  setMarkers: (updater: (prev: MarkerData[]) => MarkerData[] | MarkerData[]) => void;
  currentLat: number;
  currentLng: number;
  provider: ProviderId;
  geoHandle: React.RefObject<GeoImperativeHandle | null>;
  isMapReady: boolean; // Оставляем для общего понимания, но логика будет строже
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedLat, setEditedLat] = useState<number>(0);
  const [editedLng, setEditedLng] = useState<number>(0);
  const [repositionId, setRepositionId] = useState<string | null>(null);
  
  // Добавляем маркер по клику
  useEffect(() => {
    // Ждем, пока карта будет не просто готова, а готова для ТЕКУЩЕГО провайдера
    if (!geoHandle.current || !provider || !isMapReady) return;
    
    const unsubscribe = geoHandle.current.onMapClick(async (coords) => {
      
      // Сначала получаем адрес
      let address = 'Адрес не определен';
      try {
        const results = await geoHandle.current?.reverseGeocode(coords);
        if (results && results.length > 0) {
          address = results[0].text;
        }
      } catch (error) {
        console.error("Ошибка обратного геокодирования при клике:", error);
      }

      // Логика создания или репозиции маркера
      if (repositionId) {
        setMarkers(prev => 
          prev.map(m => m.id === repositionId ? { ...m, position: coords, meta: { ...m.meta, address } } : m)
        );
        setRepositionId(null); // Выключаем режим репозиции
      } else {
        const newMarker: MarkerData = {
          id: uuidv4(),
          provider,
          position: coords,
          meta: {
            title: `Маркер ${markers.length + 1}`,
            address: address, // Сразу добавляем адрес
          }
        };
        setMarkers(prev => [...prev, newMarker]);
      }
    });
    
    return () => unsubscribe(); // Отписываемся при размонтировании
  }, [geoHandle, provider, markers, repositionId, setMarkers, isMapReady]);

  const addMarker = async () => {
    if (!provider || !geoHandle.current) {
      alert("Сначала выберите провайдера карты");
      return;
    }
    
    const coords = { lat: currentLat, lng: currentLng };
    let address = 'Адрес не определен';
    try {
      const results = await geoHandle.current.reverseGeocode(coords);
      if (results && results.length > 0) {
        address = results[0].text;
      }
    } catch (error) {
      console.error("Ошибка обратного геокодирования при добавлении маркера:", error);
    }

    const id = uuidv4();
    setMarkers((prev) => [
      ...prev,
      {
        id,
        provider,
        meta: {
          title: `Маркер ${prev.length + 1}`,
          address: address,
        },
        position: coords,
      },
    ]);
  };

  const startEdit = (m: MarkerData) => {
    setEditingId(m.id);
    setEditedLat(m.position.lat);
    setEditedLng(m.position.lng);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (id: string) => {
    setMarkers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, position: { lat: editedLat, lng: editedLng } } : m))
    );
    setEditingId(null);
  };

  const removeMarker = (id: string) => {
    setMarkers((prev) => prev.filter((m) => m.id !== id));
    if (repositionId === id) setRepositionId(null);
  };

  const toggleReposition = (id: string) => {
    setRepositionId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="mt-4">
      <h3 className="font-semibold text-sidebar-foreground mb-3">Маркеры</h3>
      <button
        onClick={addMarker}
        className="w-full bg-primary hover:bg-opacity-90 text-primary-foreground font-medium py-2 px-4 rounded-md transition-colors mb-3"
      >
        + Добавить маркер
      </button>
      {repositionId && (
        <div className="mb-3 text-xs text-amber-600 dark:text-amber-400">
          Режим репозиции включён для маркера: {repositionId}. В текущей версии это только UI.
        </div>
      )}
      <div className="space-y-3">
        {markers.length === 0 && (
          <div className="text-sm text-sidebar-foreground/70">
            Маркеров пока нет. Нажмите «Добавить маркер».
          </div>
        )}
        {markers.map((m, index) => (
          <div key={m.id} className="p-3 rounded-lg bg-sidebar-accent border border-sidebar-border/50">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                {editingId === m.id ? (
                  // РЕЖИМ РЕДАКТИРОВАНИЯ
                  <div className="space-y-2">
                    {/* Редактирование Title */}
                    <div>
                      <label className="text-xs text-sidebar-foreground/70">Заголовок</label>
                      <input
                        type="text"
                        defaultValue={m.meta?.title || ''}
                        onChange={(e) => {
                          const newTitle = e.target.value;
                          setMarkers(prev => prev.map(marker => marker.id === m.id ? { ...marker, meta: { ...marker.meta, title: newTitle } } : marker));
                        }}
                        className="w-full p-1 rounded-md bg-background/50 text-sidebar-foreground border border-sidebar-border focus:outline-none focus:ring-1 focus:ring-sidebar-ring text-sm"
                      />
                    </div>

                    {/* Редактирование адреса */}
                    <div>
                      <label className="text-xs text-sidebar-foreground/70">Адрес</label>
                      <input
                        type="text"
                        defaultValue={m.meta?.address || ''}
                        onChange={(e) => {
                          const newAddress = e.target.value;
                          setMarkers(prev => prev.map(marker => marker.id === m.id ? { ...marker, meta: { ...marker.meta, address: newAddress } } : marker));
                        }}
                        className="w-full p-1 rounded-md bg-background/50 text-sidebar-foreground border border-sidebar-border focus:outline-none focus:ring-1 focus:ring-sidebar-ring text-sm"
                      />
                    </div>

                    {/* Редактирование координат */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-sidebar-foreground/70">Широта</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={editedLat}
                          onChange={(e) => setEditedLat(Number(e.target.value))}
                          className="w-full p-1 rounded-md bg-background/50 text-sidebar-foreground border border-sidebar-border focus:outline-none focus:ring-1 focus:ring-sidebar-ring text-sm"
                          placeholder="Широта"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-sidebar-foreground/70">Долгота</label>
                        <input
                          type="number"
                          step="0.0001"
                          value={editedLng}
                          onChange={(e) => setEditedLng(Number(e.target.value))}
                          className="w-full p-1 rounded-md bg-background/50 text-sidebar-foreground border border-sidebar-border focus:outline-none focus:ring-1 focus:ring-sidebar-ring text-sm"
                          placeholder="Долгота"
                        />
                      </div>
                    </div>

                    {/* Редактирование иконки */}
                    <div>
                      <label className="text-xs text-sidebar-foreground/70">URL иконки</label>
                      <input
                        type="text"
                        defaultValue={m.meta?.icon?.url || ''}
                        onChange={(e) => {
                          const newUrl = e.target.value;
                          setMarkers(prev => prev.map(marker => marker.id === m.id ? { ...marker, meta: { ...marker.meta, icon: { ...marker.meta?.icon, url: newUrl, width: 32, height: 32 } } } : marker));
                        }}
                        className="w-full p-1 rounded-md bg-background/50 text-sidebar-foreground border border-sidebar-border focus:outline-none focus:ring-1 focus:ring-sidebar-ring text-sm"
                        placeholder="https://..."
                      />
                    </div>
                    {/* Редактирование Label */}
                    <div>
                      <label className="text-xs text-sidebar-foreground/70">Текст на маркере</label>
                      <input
                        type="text"
                        defaultValue={m.meta?.label || ''}
                        onChange={(e) => {
                          const newLabel = e.target.value;
                          setMarkers(prev => prev.map(marker => marker.id === m.id ? { ...marker, meta: { ...marker.meta, label: newLabel } } : marker));
                        }}
                        className="w-full p-1 rounded-md bg-background/50 text-sidebar-foreground border border-sidebar-border focus:outline-none focus:ring-1 focus:ring-sidebar-ring text-sm"
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-2 mt-2">
                      <button onClick={cancelEdit} className="px-2 py-1 bg-background/50 hover:bg-sidebar-border rounded-md text-xs">Отмена</button>
                      <button onClick={() => saveEdit(m.id)} className="px-2 py-1 bg-primary hover:bg-opacity-90 text-primary-foreground rounded-md text-xs">Сохранить</button>
                    </div>
                  </div>
                ) : (
                  // РЕЖИМ ПРОСМОТРА
                  <div>
                    <p className="font-bold text-sm text-sidebar-foreground">{m.meta?.title || `Маркер #${index + 1}`}</p>
                    <p className="text-xs text-sidebar-foreground/70">
                      ID: {m.id.substring(0, 6)}...
                    </p>
                    <p className="text-xs text-sidebar-foreground/70">
                      {m.position.lat.toFixed(4)}, {m.position.lng.toFixed(4)}
                    </p>
                    {m.meta?.address && (
                      <p className="text-xs text-sidebar-foreground/70 mt-1 italic">
                        {m.meta.address}
                      </p>
                    )}
                    {m.meta?.icon?.url && (
                      <div className="mt-1">
                         <img src={m.meta.icon.url} alt="icon" className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Кнопки управления */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {editingId === m.id ? (
                  <>
                    {/* Эти кнопки удалены, т.к. дублируются внутри формы */}
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEdit(m)}
                      className="p-2 rounded-md bg-sidebar-accent hover:bg-sidebar-border text-sidebar-accent-foreground"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => toggleReposition(m.id)}
                      className={`p-2 rounded-md transition-colors ${
                        repositionId === m.id
                          ? 'bg-amber-500 text-white'
                          : 'bg-sidebar-accent hover:bg-sidebar-border text-sidebar-accent-foreground'
                      }`}
                    >
                      <Move size={14} />
                    </button>
                    <button
                      onClick={() => removeMarker(m.id)}
                      className="p-2 rounded-md bg-destructive/80 hover:bg-destructive text-destructive-foreground"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GeocodePanel({ onResultClick, provider }: { 
  onResultClick: (obj: GeoObject) => void;
  provider: ProviderId | "";
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoObject[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    const handler = setTimeout(() => {
      const fetchGeocode = async () => {
        if (!provider) {
          setError('Провайдер не выбран');
          return;
        }
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/geocode?provider=${provider}&address=${encodeURIComponent(query)}`);
          if (!response.ok) {
            throw new Error('Ошибка при поиске адреса');
          }
          const data = await response.json();
          setResults(data);
        } catch (err: any) {
          setError(err.message);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      };

      fetchGeocode();
    }, 500); // Debounce 500ms

    return () => {
      clearTimeout(handler);
    };
  }, [query, provider]);

  const handleItemClick = (result: GeoObject) => {
    setQuery(result.name); // Обновляем инпут, чтобы было видно, что выбрали
    setResults([]);       // Скрываем результаты
    onResultClick(result);
  };

  return (
    <div className="mt-4">
      <h3 className="font-semibold text-sidebar-foreground mb-3">Поиск по адресу</h3>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Введите адрес..."
        className="w-full p-2 rounded-md bg-sidebar-accent text-sidebar-foreground border border-sidebar-border focus:outline-none focus:ring-2 focus:ring-sidebar-ring"
      />
      {isLoading && <div className="text-xs mt-2 text-sidebar-foreground/70">Поиск...</div>}
      {error && <div className="text-xs mt-2 text-red-500">{error}</div>}
      {results.length > 0 && (
        <ul className="mt-2 space-y-1 bg-background/50 border border-sidebar-border rounded-md p-1 max-h-48 overflow-y-auto">
          {results.map((result, index) => (
            <li 
              key={`${result.coords.lat}-${result.coords.lng}-${index}`}
              onClick={() => handleItemClick(result)}
              className="p-2 text-sm rounded-md hover:bg-sidebar-accent cursor-pointer text-sidebar-foreground"
            >
              <p className="font-semibold">{result.name}</p>
              <p className="text-xs text-sidebar-foreground/70">{result.description}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Page() {
  const [selected, setSelected] = useState<ProviderId | "">("yandex");
  const geoRef = useRef<GeoImperativeHandle>(null);
  const [mapSize, setMapSize] = useState({ width: 800, height: 500 });
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [markerHandles, setMarkerHandles] = useState<Record<string, { handle: ProviderMarkerHandle, marker: MarkerData }>>({});
  const [readyProvider, setReadyProvider] = useState<ProviderId | "">("");

  // Синхронизация маркеров на карте с состоянием
  useEffect(() => {
    const isReady = selected === readyProvider;
    if (!geoRef.current || !selected || !isReady) return;

    const currentMarkerIds = markers.map(m => m.id);
    const handledMarkerIds = Object.keys(markerHandles);

    // Удаляем маркеры, которых больше нет в состоянии
    handledMarkerIds.forEach(id => {
      if (!currentMarkerIds.includes(id)) {
        geoRef.current?.removeMarker(markerHandles[id].handle);
        setMarkerHandles(prev => {
          const newHandles = { ...prev };
          delete newHandles[id];
          return newHandles;
        });
      }
    });

    // Добавляем новые или обновляем существующие маркеры
    markers.forEach(marker => {
      const existing = markerHandles[marker.id];
      
      if (existing) {
        // Маркер уже есть, проверяем, не изменились ли данные
        // Сравниваем позицию и метаданные
        if (
          existing.marker.position.lat !== marker.position.lat || 
          existing.marker.position.lng !== marker.position.lng
        ) {
          geoRef.current?.updateMarkerPosition(existing.handle, marker.position);
        }
        
        // Для метаданных используем lodash.isEqual для глубокого сравнения
        if (!isEqual(existing.marker.meta, marker.meta)) {
          geoRef.current?.updateMarker(existing.handle, marker);
        }

        // Обновляем данные в нашем кэше в любом случае, если что-то могло измениться
        if (existing.marker !== marker) {
          setMarkerHandles(prev => ({
            ...prev,
            [marker.id]: { ...existing, marker: marker }
          }));
        }

      } else {
        // Новый маркер, добавляем его
        if (marker.provider === selected) {
          
          const handleDragEnd = async (newPosition: LatLng) => {
            // Сначала получаем адрес для новой позиции
            let newAddress = 'Не удалось обновить адрес';
            try {
              const results = await geoRef.current?.reverseGeocode(newPosition);
              if (results && results.length > 0) {
                newAddress = results[0].text;
              }
            } catch (error) {
              console.error("Ошибка обратного геокодирования при перетаскивании:", error);
            }
            
            setMarkers(prev => 
              prev.map(m => m.id === marker.id ? { ...m, position: newPosition, meta: { ...m.meta, address: newAddress } } : m)
            );
          };

          const handle = geoRef.current?.addMarker(marker, handleDragEnd);

          if (handle) {
            setMarkerHandles(prev => ({ ...prev, [marker.id]: { handle, marker: marker } }));
          }
        }
      }
    });

  }, [markers, selected, geoRef, readyProvider]); // Исправлена зависимость
  
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

  const handleSearchResultClick = (obj: GeoObject) => {
    if (!selected) return;

    // 1. Центрируем карту на выбранном результате
    const newPosition = { lat: obj.coords.lat, lng: obj.coords.lng, zoom: 17 }; // Приближаем для детализации
    setMapPosition(newPosition);
    setInputPosition(newPosition); // Синхронизируем инпуты

    // 2. Создаем новый маркер
    const newMarker: MarkerData = {
      id: uuidv4(),
      provider: selected,
      position: obj.coords,
      meta: {
        title: obj.name,
        description: obj.text,
        address: obj.text, // Сразу добавляем адрес
      }
    };
    setMarkers(prev => [...prev, newMarker]);
  };

  return (
    <SidebarLayout sidebarData={sidebar} breadcrumb={[{ title: pckg.name, link: '/' }]}>
      <div className="p-6">
        {/* Используем гибкую сетку с учетом ширины карты */}
        <div className={`grid gap-6 ${
          isWideMap 
            ? 'grid-cols-1' // При широкой карте - панель сверху
            : 'grid-cols-[1fr_300px]' // При обычной карте - панель справа
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
                    onReady={() => setReadyProvider(selected as ProviderId)}
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
          <div className="w-full min-h-0">
            <div className="p-4 bg-sidebar border border-sidebar-border rounded-lg h-full overflow-y-scroll"> 
              <ProviderSelector selected={selected} setSelected={setSelected} />
              <GeocodePanel onResultClick={handleSearchResultClick} provider={selected} />
              {/* Передаем inputPosition в панель (показываем актуальные координаты от карты) */}
              <SettingMapSelector onUpdate={handleMapUpdate} position={inputPosition}/>
              {/* Интерфейс управления маркерами (только UI) */}
              <MarkersPanel
                markers={markers}
                setMarkers={setMarkers}
                currentLat={inputPosition.lat}
                currentLng={inputPosition.lng}
                provider={selected as ProviderId}
                geoHandle={geoRef}
                isMapReady={selected === readyProvider}
              />
              </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}