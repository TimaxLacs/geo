"use client";

import { SidebarLayout } from "hasyx/components/sidebar/layout";
import sidebar from "@/app/sidebar";
import pckg from "@/package.json";
import { useState, useRef, useEffect } from "react";
import { Geo } from "../providers/lib/index"; // Обновленный импорт Geo
import { LatLng, ProviderId, MarkerData, ZoneData, ZoneType, GeoObject } from "@/lib/core/geo-types"; // Убираем ProviderMarkerHandle и ProviderZoneHandle
import { v4 as uuidv4 } from 'uuid';
import { isEqual } from 'lodash';
import { MarkersControlPanel } from "@/components/markers-panel";
import { GeoMarker } from '@/components/geo/marker'; // Импорт нового компонента
import { GeoZone } from '@/components/geo/zone';   // Импорт нового компонента

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
function ZoneCard({ zone, setZones, editingZoneId, setEditingZoneId }: { 
  zone: ZoneData, 
  setZones: React.Dispatch<React.SetStateAction<ZoneData[]>>,
  editingZoneId: string | null,
  setEditingZoneId: (id: string | null) => void,
}) {
  const handleDelete = () => {
    setZones(prev => prev.filter(z => z.id !== zone.id));
  };

  const toggleEditable = () => {
    setEditingZoneId(editingZoneId === zone.id ? null : zone.id);
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
              editingZoneId === zone.id
                ? 'bg-primary text-primary-foreground' 
                : 'bg-sidebar-accent hover:bg-sidebar-accent-foreground/20 text-sidebar-foreground'
            }`}
            title={editingZoneId === zone.id ? "Выключить редактирование" : "Включить редактирование"}
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
  // Удаляем geoRef, markerHandles, zoneHandles
  const [mapSize, setMapSize] = useState({ width: 800, height: 500 });
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  
  // Состояния для зон
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [drawingMode, setDrawingMode] = useState<ZoneType | null>(null);
  const [currentPolygonPoints, setCurrentPolygonPoints] = useState<LatLng[]>([]);

  // Новые состояния для управления индивидуальным редактированием
  const [editingMarkerId, setEditingMarkerId] = useState<string | null>(null);
  const [panelEditingMarkerId, setPanelEditingMarkerId] = useState<string | null>(null);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);

  // Удаляем useEffect для синхронизации маркеров и зон - теперь это делается декларативно

  // Обработка кликов на карте для рисования зон
  // Для этого нам все еще нужен доступ к API карты. 
  // Мы можем получить его через Context, но это усложнит компонент.
  // Пока оставим эту логику здесь, но в будущем ее можно вынести в отдельный хук.
  // Для этого нужно будет добавить onMapClick в GeoContext.
  
  // TODO: Вынести логику рисования в кастомный хук useMapDrawer(onDrawEnd)
  
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
    // При перетаскивании карты теперь обновляем ОБА состояния.
    // Это необходимо для корректной работы контролируемых компонентов, как Google Maps.
    setInputPosition(position);
    setMapPosition(position);
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
        title: `Маркер ${markers.length + 1}`, // Стандартное название
        description: obj.text,
        address: obj.text, // Сразу добавляем адрес
      }
    };
    setMarkers(prev => [...prev, newMarker]);
  };

  // Обработчик клика по карте для добавления маркеров
  const handleMapClick = async (coords: { lat: number; lng: number }) => {
    if (!selected) return;

    // --- НАЧАЛО: Логика для рисования зон ---
    if (drawingMode) {
      if (drawingMode === 'circle') {
        const newZone: ZoneData = {
          id: uuidv4(),
          provider: selected as ProviderId,
          type: 'circle',
          geometry: coords,
          radius: 1000, // 1 км по умолчанию
          meta: { title: `Круг #${zones.length + 1}` },
          style: { fillColor: '#ff000033', strokeColor: '#ff0000', strokeWidth: 2 },
        };
        setZones(prev => [...prev, newZone]);
        setDrawingMode(null); // Выключаем режим рисования после создания
      } else if (drawingMode === 'polygon' || drawingMode === 'polyline') {
        setCurrentPolygonPoints(prevPoints => [...prevPoints, coords]);
        // Завершение полигона/линии происходит по кнопке в UI, здесь только добавляем точки
      } else if (drawingMode === 'rectangle') {
        if (currentPolygonPoints.length === 0) {
          // Первый клик - задаем начальную точку
          setCurrentPolygonPoints([coords]);
        } else {
          // Второй клик - завершаем прямоугольник
          const p1 = currentPolygonPoints[0];
          const p2 = coords;
          
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
            meta: { title: `Прямоугольник #${zones.length + 1}` },
            style: { fillColor: '#ff8c0033', strokeColor: '#ff8c00', strokeWidth: 2 },
          };
          setZones(prev => [...prev, newZone]);
          setCurrentPolygonPoints([]);
          setDrawingMode(null);
        }
      }
      return; // Прерываем выполнение, чтобы не создавать маркер
    }
    // --- КОНЕЦ: Логика для рисования зон ---

    // Пытаемся загрузить адрес для координат
    let address = 'Адрес не определен';
    try {
      const { reverseGeocode } = await import('@/lib/geocode');
      const results = await reverseGeocode(selected, coords);
      if (results && results.length > 0) {
        address = results[0].text;
      }
    } catch (error) {
      console.error("Ошибка обратного геокодирования при клике на карту:", error);
    }

    setMarkers(prevMarkers => {
      // Создаем новый маркер внутри функции обновления, используя `prevMarkers`
      const newMarker: MarkerData = {
        id: uuidv4(),
        provider: selected,
        position: coords,
        meta: {
          title: `Маркер ${prevMarkers.length + 1}`,
          description: 'Добавлен кликом по карте',
          address: address,
        }
      };
      return [...prevMarkers, newMarker];
    });
  };

  const handleDrawingModeChange = (mode: ZoneType) => {
    setDrawingMode(prev => {
      if (prev === mode) {
        // Если кликаем по той же кнопке, отменяем режим
        setCurrentPolygonPoints([]);
        return null;
      }
      // Иначе, включаем новый режим
      setCurrentPolygonPoints([]);
      return mode;
    });
  };

  return (
    <SidebarLayout sidebarData={sidebar} breadcrumb={[{ title: pckg.name, link: '/' }]} h-full>
      <main className="flex flex-col h-full overflow-hidden">
        <div className="p-6" >
          {/* Используем гибкую сетку с учетом ширины карты */}
          <div
            className="grid grid-cols-[1fr_380px] w-full"
            style={{ height: mapSize.height + 'px' }}
          >
            {/* Основной контент с картой - всегда первый в DOM */}
            <div style={{ width: '100%', height: '100%', position: 'relative' }}>
              {selected ? (
                <div className="space-y-4">
                  <div 
                    style={{ width: mapSize.width + 'px', height: mapSize.height + 'px', border: '2px solid #e5e7eb', borderRadius: '8px' }}
                  >
                    <Geo 
                      key={`${selected}-${mapKey}`}
                      provider={selected} 
                      editingZoneId={editingZoneId}
                      onPosition={handlePositionChange}
                      onMapClick={handleMapClick}
                      {...mapParams} 
                    >
                      {/* Декларативный рендеринг маркеров и зон */}
                      {markers.map(marker => (
                        <GeoMarker
                          key={marker.id}
                          marker={marker}
                          isEditing={editingMarkerId === marker.id}
                          onChange={async (updatedMarker) => {
                            // Если изменилась позиция, загружаем новый адрес
                            if (updatedMarker.position.lat !== marker.position.lat || 
                                updatedMarker.position.lng !== marker.position.lng) {
                              try {
                                const { reverseGeocode } = await import('@/lib/geocode');
                                const results = await reverseGeocode(selected as ProviderId, updatedMarker.position);
                                if (results && results.length > 0) {
                                  updatedMarker = {
                                    ...updatedMarker,
                                    meta: {
                                      ...updatedMarker.meta,
                                      address: results[0].text
                                    }
                                  };
                                }
                              } catch (error) {
                                console.error("Ошибка обратного геокодирования при перетаскивании:", error);
                              }
                            }
                            setMarkers(prev => prev.map(m => m.id === updatedMarker.id ? updatedMarker : m));
                          }}
                          onRemove={() => {
                            setMarkers(prev => prev.filter(m => m.id !== marker.id));
                          }}
                        />
                      ))}
                      {zones.map(zone => (
                        <GeoZone
                          key={zone.id}
                          zone={zone}
                          isEditing={editingZoneId === zone.id}
                          onChange={(updatedZone) => {
                            setZones(prev => prev.map(z => z.id === updatedZone.id ? updatedZone : z));
                          }}
                          onRemove={() => {
                            setZones(prev => prev.filter(z => z.id !== zone.id));
                          }}
                        />
                      ))}
                    </Geo>
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
            {/* Левая панель управления */}
            <div className="bg-sidebar text-sidebar-foreground p-4 h-full overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-sidebar-foreground">
                  Управление картами
                </h2>
                <ProviderSelector selected={selected} setSelected={setSelected} />
              </div>
              {/* Передаем inputPosition в панель (показываем актуальные координаты от карты) */}
              <SettingMapSelector onUpdate={handleMapUpdate} position={inputPosition}/>
              
              {/* Панель управления зонами */}
              <div className="mt-4 pt-4 border-t border-sidebar-border">
                <h3 className="font-semibold text-sidebar-foreground mb-3">
                  Гео-зоны
                </h3>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    onClick={() => handleDrawingModeChange('circle')}
                    className={`p-2 text-sm rounded transition-colors ${drawingMode === 'circle' ? 'bg-primary text-primary-foreground' : 'bg-sidebar-accent hover:bg-sidebar-accent-foreground/20 text-sidebar-foreground'}`}
                  >
                    + Круг
                  </button>
                  <button
                    onClick={() => handleDrawingModeChange('polygon')}
                    className={`p-2 text-sm rounded transition-colors ${drawingMode === 'polygon' ? 'bg-primary text-primary-foreground' : 'bg-sidebar-accent hover:bg-sidebar-accent-foreground/20 text-sidebar-foreground'}`}
                  >
                    + Полигон
                  </button>
                  <button
                    onClick={() => handleDrawingModeChange('polyline')}
                    className={`p-2 text-sm rounded transition-colors ${drawingMode === 'polyline' ? 'bg-primary text-primary-foreground' : 'bg-sidebar-accent hover:bg-sidebar-accent-foreground/20 text-sidebar-foreground'}`}
                  >
                    + Линия
                  </button>
                  <button
                    onClick={() => handleDrawingModeChange('rectangle')}
                    className={`p-2 text-sm rounded transition-colors ${drawingMode === 'rectangle' ? 'bg-primary text-primary-foreground' : 'bg-sidebar-accent hover:bg-sidebar-accent-foreground/20 text-sidebar-foreground'}`}
                  >
                    + Прямоугольник
                  </button>
                </div>
                
                { (drawingMode === 'polygon' || drawingMode === 'polyline') && (
                  <div className="p-2 bg-sidebar-accent rounded mb-3 text-center">
                      <p className="text-xs text-sidebar-foreground mb-2">
                          Кликайте по карте, чтобы добавить точки. <br/>
                          Точек: {currentPolygonPoints.length}
                      </p>
                      {currentPolygonPoints.length > 0 && (
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
                      )}
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
                    <ZoneCard 
                      key={zone.id} 
                      zone={zone} 
                      setZones={setZones} 
                      editingZoneId={editingZoneId} 
                      setEditingZoneId={setEditingZoneId} 
                    />
                  ))}
                </div>
              </div>

              {/* Интерфейс управления маркерами и геокодингом */}
              <MarkersControlPanel
                markers={markers}
                setMarkers={setMarkers}
                editingMarkerId={editingMarkerId}
                setEditingMarkerId={setEditingMarkerId}
                panelEditingMarkerId={panelEditingMarkerId}
                setPanelEditingMarkerId={setPanelEditingMarkerId}
                currentLat={inputPosition.lat}
                currentLng={inputPosition.lng}
                provider={selected as ProviderId}
                onSearchResultClick={handleSearchResultClick}
              />
              </div>
            </div>
          </div>
        </main>
      </SidebarLayout>
    );
  }