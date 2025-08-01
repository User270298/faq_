import { Tariff, TariffsData, TariffDiscounts } from '@/types/api';
import tariffsData from '@/data/tariffs.json';

export class TariffsService {
  private data: {
    tariffs: Tariff[];
    discounts: TariffDiscounts;
    trial_period: number;
  };

  constructor() {
    this.data = tariffsData as {
      tariffs: Tariff[];
      discounts: TariffDiscounts;
      trial_period: number;
    };
  }

  getAllTariffs(): TariffsData {
    return {
      tariffs: this.data.tariffs,
      discounts: this.data.discounts,
      trial_period: this.data.trial_period
    };
  }

  getTariffById(id: string): Tariff | null {
    return this.data.tariffs.find((tariff: Tariff) => tariff.id === id) || null;
  }

  getPopularTariffs(): Tariff[] {
    return this.data.tariffs.filter((tariff: Tariff) => tariff.popular);
  }

  getRecommendedTariffs(): Tariff[] {
    return this.data.tariffs.filter((tariff: Tariff) => tariff.recommended);
  }

  getDiscounts(): TariffDiscounts {
    return this.data.discounts;
  }

  getTrialPeriod(): number {
    return this.data.trial_period;
  }

  calculatePriceWithDiscount(tariffId: string, period: string): Record<string, unknown> | null {
    const tariff = this.getTariffById(tariffId);
    if (!tariff) return null;

    let discount = 0;
    let finalPrice = tariff.price;

    switch (period) {
      case 'quarterly':
        discount = this.data.discounts.quarterly;
        finalPrice = tariff.price * 3 * (1 - discount / 100);
        break;
      case 'yearly':
        discount = this.data.discounts.yearly;
        finalPrice = tariff.price * 12 * (1 - discount / 100);
        break;
      case 'monthly':
      default:
        discount = 0;
        finalPrice = tariff.price;
        break;
    }

    return {
      tariff_id: tariffId,
      period: period,
      original_price: tariff.price,
      discount_percent: discount,
      final_price: Math.round(finalPrice * 100) / 100,
      currency: tariff.currency
    };
  }
} 