import { kConfig } from "./config";
import type { TNetworkRequestRecord, TStoreListener } from "./types";

let records: TNetworkRequestRecord[] = [];
const listeners = new Set<TStoreListener>();

function notify(): void {
    const snapshot = records.slice();
    for (const listener of listeners) {
        listener(snapshot);
    }
}

export function getRecords(): readonly TNetworkRequestRecord[] {
    return records;
}

export function upsertRecord(record: TNetworkRequestRecord): void {
    const index = records.findIndex((item) => item.id === record.id);
    if (index >= 0) {
        records = [
            ...records.slice(0, index),
            record,
            ...records.slice(index + 1),
        ];
    } else {
        records = [record, ...records];
        if (records.length > kConfig.maxEntries) {
            records = records.slice(0, kConfig.maxEntries);
        }
    }
    notify();
}

/** 刷新前留下的记录接在现有记录后面（它们更早），总数仍不超过上限 */
export function restoreRecords(restored: readonly TNetworkRequestRecord[]): void {
    if (restored.length === 0) {
        return;
    }
    const ids = new Set(records.map((record) => record.id));
    records = [...records, ...restored.filter((record) => !ids.has(record.id))].slice(
        0,
        kConfig.maxEntries,
    );
    notify();
}

export function clearRecords(): void {
    records = [];
    notify();
}

export function subscribe(listener: TStoreListener): () => void {
    listeners.add(listener);
    listener(records.slice());
    return () => {
        listeners.delete(listener);
    };
}