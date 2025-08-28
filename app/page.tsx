"use client";

import { SidebarLayout } from "hasyx/components/sidebar/layout";
import sidebar from "@/app/sidebar";
import pckg from "@/package.json";
import { useState, useRef, useEffect } from "react";
import { Geo, GeoImperativeHandle } from "../providers/lib/index";
import { LatLng, ProviderId, MarkerData, ProviderMarkerHandle, ZoneData, ProviderZoneHandle, ZoneType } from "@/lib/core/geo-types";
import { v4 as uuidv4 } from 'uuid';
import { isEqual } from 'lodash';
import { MarkersControlPanel } from "@/components/markers-panel";
// Убираем импорт ZonesPanel

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

// Компонент карточки зоны
function ZoneCard({ zone, setZones }: { zone: ZoneData, setZones: React.Dispatch<React.SetStateAction<ZoneData[]>> }) {
  const handleDelete = () => {
    setZones(prev => prev.filter(z => z.id !== zone.id));
  };

  const toggleEditable = () => {
    setZones(prev => prev.map(z => z.id === zone.id ? { ...z, editable: !z.editable } : z));
  };

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRadius = Number(e.target.value);
    setZones(prev =>
      prev.map(z =>
        z.id === zone.id ? { ...z, radius: newRadius } : z
      )
    );
  };

  return (
    <div className="p-3 bg-sidebar-accent rounded mb-2 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-sidebar-foreground truncate pr-2">
          {zone.meta?.title || `${zone.type} ${zone.id.slice(0, 4)}`}
        </span>
        <div className="flex space-x-1 flex-shrink-0">
          <button
            onClick={toggleEditable}
            className={`p-1.5 text-xs rounded transition-colors ${
              zone.editable 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-sidebar-accent hover:bg-sidebar-accent-foreground/20 text-sidebar-foreground'
            }`}
            title={zone.editable ? "Выключить редактирование" : "Включить редактирование"}
          >
            ✏️
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 text-xs bg-destructive text-destructive-foreground rounded hover:bg-destructive/90"
            title="Удалить зону"
          >
            🗑️
          </button>
        </div>
      </div>
      
      {zone.type === 'circle' && (
        <div className="pt-2 border-t border-sidebar-border">
          <label className="block text-xs font-medium text-sidebar-foreground/70 mb-1">
            Радиус (в метрах)
          </label>
          <input
            type="number"
            step="100"
            value={zone.radius || 0}
            onChange={handleRadiusChange}
            className="w-full p-2 rounded-md bg-sidebar text-sidebar-foreground border border-sidebar-border focus:outline-none focus:ring-2 focus:ring-sidebar-ring text-sm"
            placeholder="1000"
          />
        </div>
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

  // Состояния для зон
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [zoneHandles, setZoneHandles] = useState<Record<string, ProviderZoneHandle>>({});
  const [drawingMode, setDrawingMode] = useState<ZoneType | null>(null);
  const [currentPolygonPoints, setCurrentPolygonPoints] = useState<LatLng[]>([]);

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

  }, [markers, selected, geoRef, readyProvider]);

  // Синхронизация зон на карте с состоянием
  useEffect(() => {
    const isReady = selected === readyProvider;
    if (!geoRef.current || !selected || !isReady) return;
  
    const currentZoneIds = zones.map(z => z.id);
    const handledZoneIds = Object.keys(zoneHandles);
  
    // Удаляем зоны, которых больше нет в состоянии
    handledZoneIds.forEach(id => {
      if (!currentZoneIds.includes(id)) {
        zoneHandles[id].remove();
        setZoneHandles(prev => {
          const newHandles = { ...prev };
          delete newHandles[id];
          return newHandles;
        });
      }
    });
  
    // Добавляем новые или обновляем существующие зоны
    zones.forEach(zone => {
      const existingHandle = zoneHandles[zone.id];
      
      if (existingHandle) {
        // Зона уже есть, обновляем ее
        existingHandle.update(zone);
        if (zone.editable !== undefined) {
          existingHandle.setEditable(zone.editable);
        }
      } else {
        // Новая зона, добавляем ее
        if (zone.provider === selected) {
          const onEditEnd = (newGeometry: LatLng[] | LatLng, newRadius?: number) => {
            setZones(prev => prev.map(z => {
              if (z.id === zone.id) {
                const updatedZone = { ...z, geometry: newGeometry };
                if (newRadius !== undefined && updatedZone.type === 'circle') {
                  updatedZone.radius = newRadius;
                }
                return updatedZone;
              }
              return z;
            }));
          };

          const handle = geoRef.current?.addZone(zone, onEditEnd);
          if (handle) {
            setZoneHandles(prev => ({ ...prev, [zone.id]: handle }));
          }
        }
      }
    });
  
  }, [zones, selected, geoRef, readyProvider]);


  // Обработка кликов на карте для рисования зон
  useEffect(() => {
    if (!drawingMode || !geoRef.current || selected !== readyProvider) return;

    const unsubscribe = geoRef.current.onMapClick((coords) => {
      if (drawingMode === 'circle') {
        const newZone: ZoneData = {
          id: uuidv4(),
          provider: selected as ProviderId,
          type: 'circle',
          geometry: coords,
          radius: 1000, // 1 км по умолчанию
          editable: false, // Изначально редактирование выключено
          meta: { title: `Круг #${zones.length + 1}` },
          style: { fillColor: '#ff000033', strokeColor: '#ff0000', strokeWidth: 2 },
        };
        setZones(prev => [...prev, newZone]);
        setDrawingMode(null); // Выключаем режим рисования после создания
      } else if (drawingMode === 'polygon' || drawingMode === 'polyline') {
        const updatedPoints = [...currentPolygonPoints, coords];
        setCurrentPolygonPoints(updatedPoints);
        // Для завершения полигона/линии используется кнопка в UI
      } else if (drawingMode === 'rectangle') {
        if (currentPolygonPoints.length === 0) {
          // Первый клик - задаем начальную точку
          setCurrentPolygonPoints([coords]);
        } else {
          // Второй клик - завершаем прямоугольник
          const p1 = currentPolygonPoints[0];
          const p2 = coords;
          
          // Формируем геометрию прямоугольника из двух диагональных точек
          const rectangleGeometry: LatLng[] = [
            p1,
            { lat: p1.lat, lng: p2.lng },
            p2,
            { lat: p2.lat, lng: p1.lng }
          ];

          const newZone: ZoneData = {
            id: uuidv4(),
            provider: selected as ProviderId,
            type: 'polygon', // Прямоугольник представляется как полигон
            geometry: rectangleGeometry,
            editable: false, // Изначально редактирование выключено
            meta: { title: `Прямоугольник #${zones.length + 1}` },
            style: { fillColor: '#ff8c0033', strokeColor: '#ff8c00', strokeWidth: 2 },
          };
          setZones(prev => [...prev, newZone]);
          setCurrentPolygonPoints([]);
          setDrawingMode(null);
        }
      }
    });

    return () => unsubscribe();
  }, [drawingMode, geoRef, selected, readyProvider, currentPolygonPoints, zones.length]);


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

  const handleSearchResultClick = (obj: any) => {
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
              {/* Передаем inputPosition в панель (показываем актуальные координаты от карты) */}
              <SettingMapSelector onUpdate={handleMapUpdate} position={inputPosition}/>
              
              {/* Панель управления зонами */}
              <div className="mt-4 pt-4 border-t border-sidebar-border">
                <h3 className="font-semibold text-sidebar-foreground mb-3">
                  Гео-зоны
                </h3>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    onClick={() => setDrawingMode('circle')}
                    className={`p-2 text-sm rounded transition-colors ${drawingMode === 'circle' ? 'bg-primary text-primary-foreground' : 'bg-sidebar-accent hover:bg-sidebar-accent-foreground/20 text-sidebar-foreground'}`}
                  >
                    + Круг
                  </button>
                  <button
                    onClick={() => {
                      setDrawingMode('polygon');
                      setCurrentPolygonPoints([]);
                    }}
                    className={`p-2 text-sm rounded transition-colors ${drawingMode === 'polygon' ? 'bg-primary text-primary-foreground' : 'bg-sidebar-accent hover:bg-sidebar-accent-foreground/20 text-sidebar-foreground'}`}
                  >
                    + Полигон
                  </button>
                  <button
                    onClick={() => {
                      setDrawingMode('polyline');
                      setCurrentPolygonPoints([]);
                    }}
                    className={`p-2 text-sm rounded transition-colors ${drawingMode === 'polyline' ? 'bg-primary text-primary-foreground' : 'bg-sidebar-accent hover:bg-sidebar-accent-foreground/20 text-sidebar-foreground'}`}
                  >
                    + Линия
                  </button>
                  <button
                    onClick={() => {
                      setDrawingMode('rectangle');
                      setCurrentPolygonPoints([]);
                    }}
                    className={`p-2 text-sm rounded transition-colors ${drawingMode === 'rectangle' ? 'bg-primary text-primary-foreground' : 'bg-sidebar-accent hover:bg-sidebar-accent-foreground/20 text-sidebar-foreground'}`}
                  >
                    + Прямоугольник
                  </button>
                </div>
                
                { (drawingMode === 'polygon' || drawingMode === 'polyline') && currentPolygonPoints.length > 0 && (
                  <div className="p-2 bg-sidebar-accent rounded mb-3 text-center">
                      <p className="text-xs text-sidebar-foreground mb-2">
                          Кликайте по карте, чтобы добавить точки. <br/>
                          Точек: {currentPolygonPoints.length}
                      </p>
                      <button
                          onClick={() => {
                            if (currentPolygonPoints.length < (drawingMode === 'polygon' ? 3 : 2) || !selected) return;

                            const newZone: ZoneData = {
                              id: uuidv4(),
                              provider: selected as ProviderId,
                              type: drawingMode as 'polygon' | 'polyline',
                              geometry: currentPolygonPoints,
                              editable: false,
                              meta: { title: `${drawingMode === 'polygon' ? 'Полигон' : 'Линия'} #${zones.length + 1}` },
                              style: { 
                                fillColor: drawingMode === 'polygon' ? '#00ff0033' : undefined,
                                strokeColor: '#00ff00', 
                                strokeWidth: 3 
                              },
                            };
                            setZones(prev => [...prev, newZone]);
                            setCurrentPolygonPoints([]);
                            setDrawingMode(null);
                          }}
                          disabled={currentPolygonPoints.length < (drawingMode === 'polygon' ? 3 : 2)}
                          className="w-full p-2 text-sm rounded bg-green-600 text-white disabled:bg-gray-500"
                      >
                          Завершить
                      </button>
                  </div>
                )}

                { drawingMode === 'rectangle' && (
                  <div className="p-2 bg-sidebar-accent rounded mb-3 text-center">
                      <p className="text-xs text-sidebar-foreground">
                          Кликните по карте, чтобы задать {currentPolygonPoints.length === 0 ? 'начальный' : 'конечный'} угол.
                      </p>
                  </div>
                )}

                <div className="space-y-2">
                  {zones.map(zone => (
                    <ZoneCard key={zone.id} zone={zone} setZones={setZones} />
                  ))}
                </div>
              </div>

              {/* Интерфейс управления маркерами и геокодингом */}
              <MarkersControlPanel
                markers={markers}
                setMarkers={setMarkers}
                currentLat={inputPosition.lat}
                currentLng={inputPosition.lng}
                provider={selected as ProviderId}
                geoHandle={geoRef}
                isMapReady={selected === readyProvider}
                onSearchResultClick={handleSearchResultClick}
              />
              </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}