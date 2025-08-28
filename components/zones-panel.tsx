import { Dispatch, SetStateAction } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { LatLng, ProviderId, ZoneData, ZoneType } from "@/lib/core/geo-types";

interface ZonesPanelProps {
  zones: ZoneData[];
  setZones: Dispatch<SetStateAction<ZoneData[]>>;
  drawingMode: ZoneType | null;
  setDrawingMode: Dispatch<SetStateAction<ZoneType | null>>;
  currentPolygonPoints: LatLng[];
  setCurrentPolygonPoints: Dispatch<SetStateAction<LatLng[]>>;
  provider: ProviderId;
}

function ZoneCard({ zone, setZones }: { zone: ZoneData, setZones: Dispatch<SetStateAction<ZoneData[]>> }) {
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

export function ZonesPanel({
  zones,
  setZones,
  drawingMode,
  setDrawingMode,
  currentPolygonPoints,
  setCurrentPolygonPoints,
  provider,
}: ZonesPanelProps) {
  
  const handleCompletePolygon = () => {
    if (currentPolygonPoints.length < 3 || !provider) return;

    const newZone: ZoneData = {
      id: uuidv4(),
      provider: provider,
      type: drawingMode as 'polygon' | 'polyline',
      geometry: currentPolygonPoints,
      editable: false, // Изначально редактирование выключено
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
  };

  return (
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
                onClick={handleCompletePolygon}
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
  );
}
