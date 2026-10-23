import type { RunFn } from '@mangotools/runtime';
import { convertUnitText } from '../format/units.ts';
import type { CbmCostInput, CbmCostResult } from './cbmShipmentModel.ts';
import {
  emptyLoadPackage,
  initialLoadState,
  type LoadPackage,
  type LoadResult,
  type LoadSettings,
  type LoadSnapshot,
  loadPayload,
} from './containerWorkspaceModel.ts';

const failure = { code: 'INTERNAL_ERROR', messageKey: 'errors.INTERNAL_ERROR' };
class LoadController {
  constructor(private run: RunFn) {}
  private state = initialLoadState();
  private listeners = new Set<(state: LoadSnapshot) => void>();
  private revision = 0;
  private costRevision = 0;
  private nextId = 4;
  private disposed = false;
  private abort = new AbortController();
  private costAbort = new AbortController();
  get = () => this.state;
  subscribe = (listener: (state: LoadSnapshot) => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  private emit = (patch: Partial<LoadSnapshot>) => {
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener(this.state);
  };
  private invalidateCost = () => {
    this.costRevision++;
    this.costAbort.abort();
    this.emit({ cost: null, costError: null });
  };
  private calculateCost = async () => {
    this.invalidateCost();
    const result = this.state.result;
    if (
      !this.state.costInput.enabled ||
      result?.status !== 'complete' ||
      result.containersRequired === '0' ||
      this.disposed
    )
      return;
    const token = this.costRevision;
    this.costAbort = new AbortController();
    const { enabled: _enabled, ...cost } = this.state.costInput;
    try {
      const outcome = await this.run(
        'logistics.cost.estimate@1',
        { ...cost, rateBasis: 'per-container', quantity: result.containersRequired },
        {},
        this.costAbort.signal,
      );
      if (this.disposed || token !== this.costRevision) return;
      this.emit(
        outcome.ok
          ? { cost: outcome.value as unknown as CbmCostResult }
          : { costError: outcome.error },
      );
    } catch {
      if (!this.disposed && token === this.costRevision) this.emit({ costError: failure });
    }
  };
  calculate = async () => {
    const token = ++this.revision;
    this.abort.abort();
    this.invalidateCost();
    this.abort = new AbortController();
    this.emit({ result: null, error: null, warnings: [], pending: true });
    const { allowRotation, keepUpright, stackable } = this.state.settings;
    try {
      const outcome = await this.run(
        'logistics.container.load@1',
        loadPayload(this.state),
        { allowRotation, keepUpright, stackable },
        this.abort.signal,
      );
      if (this.disposed || token !== this.revision) return;
      this.emit(
        outcome.ok
          ? {
              result: outcome.value as unknown as LoadResult,
              pending: false,
              warnings: outcome.warnings.map((w) => w.code),
            }
          : { error: outcome.error, pending: false },
      );
      if (outcome.ok) void this.calculateCost();
    } catch {
      if (!this.disposed && token === this.revision) this.emit({ pending: false, error: failure });
    }
  };
  private setPackages = (packages: LoadPackage[]) => {
    this.emit({ packages, result: null, cost: null });
    void this.calculate();
  };
  edit = (id: number, field: keyof Omit<LoadPackage, 'id'>, value: string) => {
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
  settings = (patch: Partial<LoadSettings>) => {
    this.emit({ settings: { ...this.state.settings, ...patch }, result: null, cost: null });
    void this.calculate();
  };
  cost = (patch: Partial<CbmCostInput>) => {
    this.emit({ costInput: { ...this.state.costInput, ...patch }, cost: null });
    void this.calculateCost();
  };
  add = () => {
    if (this.state.packages.length < 50)
      this.setPackages([...this.state.packages, emptyLoadPackage(this.nextId++)]);
  };
  duplicate = (id: number) => {
    if (this.state.packages.length < 50)
      this.setPackages(
        this.state.packages.flatMap((row) =>
          row.id === id ? [row, { ...row, id: this.nextId++ }] : [row],
        ),
      );
  };
  remove = (id: number) => this.setPackages(this.state.packages.filter((row) => row.id !== id));
  clear = () => this.setPackages([emptyLoadPackage(this.nextId++)]);
  dispose = () => {
    this.disposed = true;
    this.revision++;
    this.costRevision++;
    this.abort.abort();
    this.costAbort.abort();
    this.listeners.clear();
  };
}
export const createLoadController = (run: RunFn) => new LoadController(run);
export type LoadControllerHandle = ReturnType<typeof createLoadController>;
