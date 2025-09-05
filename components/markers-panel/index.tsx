"use client";

import { useState, useEffect } from "react";
import { MarkerData, ProviderId, GeoObject, LatLng, GeoImperativeHandle } from "@/lib/core/geo-types";
import { v4 as uuidv4 } from 'uuid';
import { Pencil, Move, Trash2 } from 'lucide-react';
import { geocode, reverseGeocode } from '@/lib/geocode'; // Импортируем функции геокодинга

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
          // Вызываем функцию напрямую
          const data = await geocode(provider, query);
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

export function MarkersControlPanel({
  markers,
  setMarkers,
  editingMarkerId,
  setEditingMarkerId,
  panelEditingMarkerId,
  setPanelEditingMarkerId,
  currentLat,
  currentLng,
  provider,
  onSearchResultClick,
}: {
  markers: MarkerData[];
  setMarkers: (updater: (prev: MarkerData[]) => MarkerData[] | MarkerData[]) => void;
  editingMarkerId: string | null;
  setEditingMarkerId: (id: string | null) => void;
  panelEditingMarkerId: string | null;
  setPanelEditingMarkerId: (id: string | null) => void;
  currentLat: number;
  currentLng: number;
  provider: ProviderId;
  onSearchResultClick: (obj: GeoObject) => void;
}) {
  const [editedLat, setEditedLat] = useState<number>(0);
  const [editedLng, setEditedLng] = useState<number>(0);
  // Логика reposition и onMapClick переехала в app/page.tsx, так как требует доступа к карте.
  // Этот компонент теперь отвечает только за UI списка маркеров.
  
  const addMarker = async () => {
    if (!provider) {
      alert("Сначала выберите провайдера карты");
      return;
    }
    
    const coords = { lat: currentLat, lng: currentLng };
    let address = 'Адрес не определен';
    try {
      const results = await reverseGeocode(provider, coords);
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
    setPanelEditingMarkerId(m.id);
    setEditedLat(m.position.lat);
    setEditedLng(m.position.lng);
  };

  const cancelEdit = () => {
    setPanelEditingMarkerId(null);
  };

  const saveEdit = async (id: string) => {
    const newPosition = { lat: editedLat, lng: editedLng };
    let newAddress = 'Не удалось обновить адрес';
    try {
      const results = await reverseGeocode(provider, newPosition);
      if (results && results.length > 0) {
        newAddress = results[0].text;
      }
    } catch (error) {
      console.error("Ошибка обратного геокодирования при сохранении:", error);
    }
    
    setMarkers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, position: newPosition, meta: { ...m.meta, address: newAddress } } : m))
    );
    setPanelEditingMarkerId(null);
  };

  const removeMarker = (id: string) => {
    setMarkers((prev) => prev.filter((m) => m.id !== id));
    if (editingMarkerId === id) setEditingMarkerId(null);
    if (panelEditingMarkerId === id) setPanelEditingMarkerId(null);
  };

  // Удаляем toggleReposition

  return (
    <>
      <GeocodePanel onResultClick={onSearchResultClick} provider={provider} />
      <div className="mt-4">
        <h3 className="font-semibold text-sidebar-foreground mb-3">Маркеры</h3>
        <button
          onClick={addMarker}
          className="w-full bg-primary hover:bg-opacity-90 text-primary-foreground font-medium py-2 px-4 rounded-md transition-colors mb-3"
        >
          + Добавить маркер
        </button>
        <div className="space-y-3">
          {markers.length === 0 && (
            <div className="text-sm text-sidebar-foreground/70">
              Маркеров пока нет.
            </div>
          )}
          {markers.map((m, index) => (
            <div key={m.id} className="p-3 rounded-lg bg-sidebar-accent border border-sidebar-border/50">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  {panelEditingMarkerId === m.id ? (
                    <div className="space-y-2">
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
                      <div>
                        <label className="text-xs text-sidebar-foreground/70">URL иконки</label>
                        <input
                          type="text"
                          defaultValue={m.meta?.icon?.url || ''}
                          onChange={(e) => {
                            const newUrl = e.target.value;
                            setMarkers(prev => prev.map(marker => marker.id === m.id ? { ...marker, meta: { ...marker.meta, icon: { ...(marker.meta?.icon || { width: 32, height: 32 }), url: newUrl } } } : marker));
                          }}
                          className="w-full p-1 rounded-md bg-background/50 text-sidebar-foreground border border-sidebar-border focus:outline-none focus:ring-1 focus:ring-sidebar-ring text-sm"
                          placeholder="https://..."
                        />
                      </div>
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
                <div className="flex items-center gap-2 flex-shrink-0">
                  {panelEditingMarkerId === m.id ? (
                    <></>
                  ) : (
                    <>
                      <button
                        onClick={() => startEdit(m)}
                        className="p-2 rounded-md bg-sidebar-accent hover:bg-sidebar-border text-sidebar-accent-foreground"
                        title="Редактировать маркер"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => setEditingMarkerId(editingMarkerId === m.id ? null : m.id)}
                        className={`p-2 rounded-md transition-colors ${editingMarkerId === m.id 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-sidebar-accent hover:bg-sidebar-border text-sidebar-accent-foreground'
                        }`}
                        title={editingMarkerId === m.id ? "Выключить перемещение" : "Включить перемещение"}
                      >
                        <Move size={14} />
                      </button>
                      <button
                        onClick={() => removeMarker(m.id)}
                        className="p-2 rounded-md bg-destructive/80 hover:bg-destructive text-destructive-foreground"
                        title="Удалить маркер"
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
    </>
  );
}

