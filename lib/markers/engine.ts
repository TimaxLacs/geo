import { MarkerData, ProviderMarkerHandle, LatLng, ProviderId } from '@/lib/core/geo-types';

/**
 * Интерфейс для адаптера маркеров, специфичного для каждого провайдера.
 * Каждый провайдер (Яндекс, Google, 2ГИС) должен реализовать этот интерфейс.
 */
export interface MarkerAdapter {
  mount(context: any, marker: MarkerData, onDragEnd: (newPosition: LatLng) => void): ProviderMarkerHandle;
  unmount(handle: ProviderMarkerHandle): void;
  subscribeMapClick(context: any, callback: (pos: LatLng) => void): () => void;
}

/**
 * Тип для хранения всех зарегистрированных адаптеров.
 * Ключ - это ProviderId ('yandex', 'google', '2gis').
 */
type AdapterRegistry = Partial<Record<ProviderId, MarkerAdapter>>;

/**
 * Универсальный движок для управления маркерами на карте.
 * Он делегирует операции (mount, unmount, etc.) соответствующему адаптеру
 * в зависимости от провайдера текущей карты.
 */
class MarkerEngine {
  private adapters: AdapterRegistry = {};

  /**
   * Регистрирует адаптер для конкретного провайдера.
   * @param providerId - Идентификатор провайдера ('yandex', 'google', '2gis').
   * @param adapter - Объект, реализующий интерфейс MarkerAdapter.
   */
  registerAdapter(providerId: ProviderId, adapter: MarkerAdapter) {
    this.adapters[providerId] = adapter;
    console.log(`[MarkerEngine] Adapter registered for ${providerId}`);
  }

  /**
   * Получает адаптер для указанного провайдера.
   * @param providerId - Идентификатор провайдера.
   * @returns Адаптер, если он зарегистрирован.
   * @throws Ошибка, если адаптер не найден.
   */
  private getAdapter(providerId: ProviderId): MarkerAdapter {
    const adapter = this.adapters[providerId];
    if (!adapter) {
      throw new Error(`[MarkerEngine] No adapter registered for provider: ${providerId}`);
    }
    return adapter;
  }

  /**
   * Монтирует (добавляет) маркер на карту, используя соответствующий адаптер.
   * @param providerId - Провайдер карты.
   * @param mapInstance - Экземпляр объекта карты от провайдера.
   * @param marker - Данные маркера для добавления.
   * @returns "Ручка" для управления созданным маркером.
   */
  mount(providerId: ProviderId, context: any, marker: MarkerData, onDragEnd: (newPosition: LatLng) => void): ProviderMarkerHandle {
    return this.getAdapter(providerId).mount(context, marker, onDragEnd);
  }

  /**
   * Демонтирует (удаляет) маркер с карты.
   * @param providerId - Провайдер карты.
   * @param handle - "Ручка" маркера, полученная при монтировании.
   */
  unmount(providerId: ProviderId, handle: ProviderMarkerHandle): void {
    this.getAdapter(providerId).unmount(handle);
  }

  /**
   * Подписывается на событие клика по карте.
   * @param providerId - Провайдер карты.
   * @param mapInstance - Экземпляр объекта карты.
   * @param callback - Функция, которая будет вызвана с координатами клика.
   * @returns Функция для отписки от события.
   */
  subscribeMapClick(providerId: ProviderId, context: any, callback: (pos: LatLng) => void): () => void {
    return this.getAdapter(providerId).subscribeMapClick(context, callback);
  }
}

// Экспортируем единственный экземпляр (синглтон) движка.
export const markerEngine = new MarkerEngine();
