import { ProviderId, ZoneData, ProviderZoneHandle, LatLng } from '../core/geo-types';

export interface ZoneAdapter {
  mount(context: any, zone: ZoneData, onEditEnd: (newGeometry: LatLng[] | LatLng, newRadius?: number) => void): ProviderZoneHandle;
  unmount(handle: ProviderZoneHandle): void;
  update(handle: ProviderZoneHandle, newZoneData: ZoneData): void;
  setEditable(handle: ProviderZoneHandle, editable: boolean): void;
}

export class ZoneEngine {
  private adapters: Map<ProviderId, ZoneAdapter> = new Map();

  public registerAdapter(providerId: ProviderId, adapter: ZoneAdapter): void {
    this.adapters.set(providerId, adapter);
  }

  public mount(providerId: ProviderId, context: any, zone: ZoneData, onEditEnd: (newGeometry: LatLng[] | LatLng, newRadius?: number) => void): ProviderZoneHandle {
    const adapter = this.adapters.get(providerId);
    if (!adapter) {
      throw new Error(`No adapter registered for provider: ${providerId}`);
    }
    return adapter.mount(context, zone, onEditEnd);
  }

  public unmount(providerId: ProviderId, handle: ProviderZoneHandle): void {
    const adapter = this.adapters.get(providerId);
    if (!adapter) {
      throw new Error(`No adapter registered for provider: ${providerId}`);
    }
    adapter.unmount(handle);
  }

  public update(providerId: ProviderId, handle: ProviderZoneHandle, newZoneData: ZoneData): void {
    const adapter = this.adapters.get(providerId);
    if (!adapter) {
      throw new Error(`No adapter registered for provider: ${providerId}`);
    }
    adapter.update(handle, newZoneData);
  }

  public setEditable(providerId: ProviderId, handle: ProviderZoneHandle, editable: boolean): void {
    const adapter = this.adapters.get(providerId);
    if (!adapter) {
      throw new Error(`No adapter registered for provider: ${providerId}`);
    }
    adapter.setEditable(handle, editable);
  }
}

export const zoneEngine = new ZoneEngine();
