import type { RunFn } from '@mangotools/runtime';
import { convertUnitText } from '../format/units.ts';
import {
  type CbmCostInput,
  type CbmCostResult,
  type CbmPackage,
  type CbmResult,
  type CbmSnapshot,
  newPackage,
  packagePayload,
  samplePackages,
} from './cbmShipmentModel.ts';

const failure = { code: 'INTERNAL_ERROR', messageKey: 'errors.INTERNAL_ERROR' };
class ShipmentController {
  constructor(private run: RunFn) {}
  private state: CbmSnapshot = {
    packages: samplePackages(),
    unit: 'cm',
    precision: '3',
    costInput: { enabled: false, currency: 'INR', rate: '', minimumCharge: '', otherCharges: '' },
    shipment: null,
    cost: null,
    pending: false,
    error: null,
    costError: null,
    warnings: [],
  };
  private listeners = new Set<(snapshot: CbmSnapshot) => void>();
  private revision = 0;
  private costRevision = 0;
  private nextId = 1;
  private shipmentAbort = new AbortController();
  private costAbort = new AbortController();
  private disposed = false;
  private emit = (patch: Partial<CbmSnapshot>) => {
    this.state = { ...this.state, ...patch };
    for (const notify of this.listeners) notify(this.state);
  };
  private invalidateCost = () => {
    this.costRevision++;
    this.costAbort.abort();
    this.emit({ cost: null, costError: null });
  };
  private calculateCost = async () => {
    this.invalidateCost();
    if (!this.state.costInput.enabled || !this.state.shipment || this.disposed) return;
    const token = this.costRevision;
    this.costAbort = new AbortController();
    const { currency, rate, minimumCharge, otherCharges } = this.state.costInput;
    try {
      const result = await this.run(
        'logistics.cost.estimate@1',
        {
          rateBasis: 'per-cbm',
          quantity: this.state.shipment.totalCbmExact,
          currency,
          rate,
          minimumCharge,
          otherCharges,
        },
        {},
        this.costAbort.signal,
      );
      if (this.disposed || token !== this.costRevision) return;
      this.emit(
        result.ok
          ? { cost: result.value as unknown as CbmCostResult }
          : { costError: result.error },
      );
    } catch {
      if (!this.disposed && token === this.costRevision) this.emit({ costError: failure });
    }
  };
  calculate = async () => {
    const token = ++this.revision;
    this.shipmentAbort.abort();
    this.invalidateCost();
    this.shipmentAbort = new AbortController();
    this.emit({ shipment: null, error: null, warnings: [], pending: true });
    try {
      const result = await this.run(
        'logistics.cbm.shipment@1',
        { packages: this.state.packages.map(packagePayload), decimalPlaces: this.state.precision },
        {},
        this.shipmentAbort.signal,
      );
      if (this.disposed || token !== this.revision) return;
      this.emit(
        result.ok
          ? {
              shipment: result.value as unknown as CbmResult,
              warnings: result.warnings,
              pending: false,
            }
          : { error: result.error, pending: false },
      );
      if (result.ok) void this.calculateCost();
    } catch {
      if (!this.disposed && token === this.revision) this.emit({ error: failure, pending: false });
    }
  };
  private setPackages = (packages: CbmPackage[]) => {
    this.emit({ packages, shipment: null, cost: null, warnings: [] });
    void this.calculate();
  };
  edit = (id: number, field: keyof CbmPackage, value: string) => {
    this.setPackages(
      this.state.packages.map((row) => {
        if (row.id !== id) return row;
        if (field !== 'unit') return { ...row, [field]: value };
        return {
          ...row,
          unit: value,
          length: convertUnitText(row.length, 'length', row.unit, value),
          width: convertUnitText(row.width, 'length', row.unit, value),
          height: convertUnitText(row.height, 'length', row.unit, value),
        };
      }),
    );
  };
  get = () => this.state;
  subscribe = (notify: (value: CbmSnapshot) => void) => {
    this.listeners.add(notify);
    return () => this.listeners.delete(notify);
  };
  setDefaultUnit = (unit: string) => this.emit({ unit });
  setPrecision = (precision: string) => {
    this.emit({ precision, shipment: null, cost: null });
    void this.calculate();
  };
  setCost = (patch: Partial<CbmCostInput>) => {
    this.emit({ costInput: { ...this.state.costInput, ...patch }, cost: null, costError: null });
    void this.calculateCost();
  };
  add = () => {
    if (this.state.packages.length < 50)
      this.setPackages([...this.state.packages, newPackage(this.nextId++, this.state.unit)]);
  };
  duplicate = (id: number) => {
    if (this.state.packages.length >= 50) return;
    this.setPackages(
      this.state.packages.flatMap((row) =>
        row.id === id ? [row, { ...row, id: this.nextId++ }] : [row],
      ),
    );
  };
  remove = (id: number) => this.setPackages(this.state.packages.filter((row) => row.id !== id));
  clear = () => this.setPackages([newPackage(this.nextId++, this.state.unit)]);
  sample = () => this.setPackages(samplePackages().map((row) => ({ ...row, id: this.nextId++ })));
  dispose = () => {
    this.disposed = true;
    this.revision++;
    this.costRevision++;
    this.shipmentAbort.abort();
    this.costAbort.abort();
    this.listeners.clear();
  };
}
export function createCbmController(run: RunFn) {
  return new ShipmentController(run);
}
export type CbmController = ReturnType<typeof createCbmController>;
