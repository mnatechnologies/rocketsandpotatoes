'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Loader2,
  Save,
  ShieldAlert,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Power,
  RefreshCw,
} from 'lucide-react';

// --- Types ---

interface HaltState {
  id: string;
  metal_type: string;
  is_halted: boolean;
  halted_at: string | null;
  halted_by: string | null;
  halt_reason: string | null;
  resumed_at: string | null;
  resumed_by: string | null;
  updated_at: string;
}

interface HaltConfig {
  id: string;
  metal_type: string;
  drop_threshold_pct: number;
  check_window_minutes: number;
  enabled: boolean;
  updated_at: string;
  updated_by: string | null;
}

interface HistoryEntry {
  metal_type: string;
  event: 'halted' | 'resumed';
  triggered_by: string;
  reason: string | null;
  timestamp: string;
}

interface SalesHaltData {
  halt_states: HaltState[];
  config: HaltConfig[];
  history: HistoryEntry[];
}

// --- Constants ---

const METALS = [
  { code: 'XAU', name: 'Gold' },
  { code: 'XAG', name: 'Silver' },
  { code: 'XPT', name: 'Platinum' },
  { code: 'XPD', name: 'Palladium' },
] as const;

// --- Helpers ---

function formatTimestamp(ts: string | null): string {
  if (!ts) return '--';
  return new Date(ts).toLocaleString('en-AU', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Australia/Sydney',
  });
}

function triggeredByLabel(triggeredBy: string): string {
  if (triggeredBy === 'auto') return 'Auto (Price Monitor)';
  return 'Admin';
}

// --- Main Page ---

export default function SalesControlPage() {
  const [data, setData] = useState<SalesHaltData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    metalType: string;
    action: 'halt' | 'resume';
  } | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/sales-halt?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sales halt data');
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load sales control data';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggleHalt = async (metalType: string, shouldHalt: boolean) => {
    setConfirmDialog(null);
    setActionLoading(metalType);

    try {
      const response = await fetch('/api/admin/sales-halt', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metal_type: metalType,
          is_halted: shouldHalt,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to update halt state');
      }

      const result = await response.json();
      if (result.success) {
        const label = metalType === 'ALL' ? 'All sales' : metalType;
        toast.success(`${label} ${shouldHalt ? 'halted' : 'resumed'} successfully`);
        await fetchData();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update halt state';
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  const requestToggle = (metalType: string, shouldHalt: boolean) => {
    setConfirmDialog({ metalType, action: shouldHalt ? 'halt' : 'resume' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="bg-destructive/10 border border-destructive/30 text-destructive-foreground px-6 py-4 rounded-lg text-center">
          <h2 className="font-semibold mb-2">Error Loading Sales Control</h2>
          <p className="mb-4">{error}</p>
          <button
            onClick={() => { setError(null); setLoading(true); fetchData(); }}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const globalState = data.halt_states.find(s => s.metal_type === 'ALL');
  const metalStates = data.halt_states.filter(s => s.metal_type !== 'ALL');
  const isGlobalHalted = globalState?.is_halted ?? false;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Sales Control</h1>
        <p className="text-muted-foreground">
          Monitor and control sales halt states for all precious metals
        </p>
      </div>

      {/* Global Kill Switch */}
      <GlobalKillSwitch
        state={globalState!}
        isLoading={actionLoading === 'ALL'}
        onToggle={(shouldHalt) => requestToggle('ALL', shouldHalt)}
      />

      {/* Per-Metal Controls */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Per-Metal Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {METALS.map(metal => {
            const state = metalStates.find(s => s.metal_type === metal.code);
            if (!state) return null;
            return (
              <MetalCard
                key={metal.code}
                metal={metal}
                state={state}
                isGlobalHalted={isGlobalHalted}
                isLoading={actionLoading === metal.code}
                onToggle={(shouldHalt) => requestToggle(metal.code, shouldHalt)}
              />
            );
          })}
        </div>
      </div>

      {/* Auto-Halt Configuration */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Auto-Halt Configuration</h2>
        <div className="space-y-3">
          {METALS.map(metal => {
            const cfg = data.config.find(c => c.metal_type === metal.code);
            if (!cfg) return null;
            return (
              <AutoHaltConfigCard
                key={metal.code}
                metal={metal}
                config={cfg}
                onSaved={fetchData}
              />
            );
          })}
        </div>
      </div>

      {/* Halt History */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Halt History</h2>
        <HaltHistoryTable history={data.history} />
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center pb-4">
        <button
          onClick={() => { setLoading(true); fetchData(); }}
          className="px-4 py-2 border border-border rounded-lg font-medium text-sm hover:bg-muted transition-colors flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Data
        </button>
      </div>

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          metalType={confirmDialog.metalType}
          action={confirmDialog.action}
          onConfirm={() => handleToggleHalt(confirmDialog.metalType, confirmDialog.action === 'halt')}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </div>
  );
}

// --- Global Kill Switch ---

function GlobalKillSwitch({
  state,
  isLoading,
  onToggle,
}: {
  state: HaltState;
  isLoading: boolean;
  onToggle: (shouldHalt: boolean) => void;
}) {
  const isHalted = state.is_halted;

  return (
    <div
      className={`rounded-xl border-2 p-6 shadow-sm transition-colors ${
        isHalted
          ? 'bg-red-50 border-red-300'
          : 'bg-green-50 border-green-300'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {isHalted ? (
            <ShieldAlert className="h-10 w-10 text-red-600 flex-shrink-0" />
          ) : (
            <ShieldCheck className="h-10 w-10 text-green-600 flex-shrink-0" />
          )}
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Global Kill Switch
            </h2>
            <div className="mt-1">
              {isHalted ? (
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    ALL SALES HALTED
                  </span>
                  {state.halted_at && (
                    <p className="text-sm text-muted-foreground mt-1.5">
                      Since {formatTimestamp(state.halted_at)}
                      {state.halt_reason && <> &mdash; {state.halt_reason}</>}
                    </p>
                  )}
                </div>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Sales Active
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => onToggle(!isHalted)}
          disabled={isLoading}
          className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 flex items-center gap-2 flex-shrink-0 ${
            isHalted
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Power className="h-4 w-4" />
          )}
          {isHalted ? 'Resume All Sales' : 'Halt All Sales'}
        </button>
      </div>
    </div>
  );
}

// --- Metal Card ---

function MetalCard({
  metal,
  state,
  isGlobalHalted,
  isLoading,
  onToggle,
}: {
  metal: { code: string; name: string };
  state: HaltState;
  isGlobalHalted: boolean;
  isLoading: boolean;
  onToggle: (shouldHalt: boolean) => void;
}) {
  const isHalted = state.is_halted;
  const effectivelyHalted = isHalted || isGlobalHalted;

  return (
    <div className={`bg-card rounded-xl border shadow-sm p-5 ${
      effectivelyHalted ? 'border-red-300' : 'border-border'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            {metal.name}
            <span className="text-sm font-normal text-muted-foreground ml-2">({metal.code})</span>
          </h3>
          <div className="mt-1">
            {effectivelyHalted ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                {isGlobalHalted && !isHalted ? 'Halted (Global)' : 'Halted'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Active
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => onToggle(!isHalted)}
          disabled={isLoading}
          className={`px-4 py-2 rounded-lg font-medium text-xs transition-all disabled:opacity-50 flex items-center gap-1.5 ${
            isHalted
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-red-600 text-white hover:bg-red-700'
          }`}
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Power className="h-3.5 w-3.5" />
          )}
          {isHalted ? 'Resume' : 'Halt'}
        </button>
      </div>

      {/* Details */}
      <div className="space-y-1.5 text-sm text-muted-foreground">
        {state.halted_at && (
          <p>
            <span className="font-medium text-foreground">Last halted:</span>{' '}
            {formatTimestamp(state.halted_at)}
          </p>
        )}
        {state.halt_reason && (
          <p>
            <span className="font-medium text-foreground">Reason:</span>{' '}
            {state.halt_reason}
          </p>
        )}
        {state.halted_by && (
          <p>
            <span className="font-medium text-foreground">Triggered by:</span>{' '}
            {triggeredByLabel(state.halted_by)}
          </p>
        )}
        {state.resumed_at && (
          <p>
            <span className="font-medium text-foreground">Last resumed:</span>{' '}
            {formatTimestamp(state.resumed_at)}
          </p>
        )}
        {!state.halted_at && !state.resumed_at && (
          <p className="text-xs italic">No halt events recorded</p>
        )}
      </div>
    </div>
  );
}

// --- Auto-Halt Config Card ---

function AutoHaltConfigCard({
  metal,
  config,
  onSaved,
}: {
  metal: { code: string; name: string };
  config: HaltConfig;
  onSaved: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [threshold, setThreshold] = useState(config.drop_threshold_pct);
  const [window, setWindow] = useState(config.check_window_minutes);
  const [enabled, setEnabled] = useState(config.enabled);
  const [saving, setSaving] = useState(false);

  // Reset local state when config prop changes
  useEffect(() => {
    setThreshold(config.drop_threshold_pct);
    setWindow(config.check_window_minutes);
    setEnabled(config.enabled);
  }, [config]);

  const hasChanges =
    threshold !== config.drop_threshold_pct ||
    window !== config.check_window_minutes ||
    enabled !== config.enabled;

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/sales-halt/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metal_type: metal.code,
          drop_threshold_pct: threshold,
          check_window_minutes: window,
          enabled,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to save config');
      }

      const result = await response.json();
      if (result.success) {
        toast.success(`Auto-halt config updated for ${metal.name}`);
        onSaved();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save config';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm">
      {/* Header / Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/30 transition-colors rounded-xl"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-semibold text-foreground">
            {metal.name} ({metal.code})
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            config.enabled
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-600'
          }`}>
            {config.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          {config.drop_threshold_pct}% / {config.check_window_minutes}min
        </span>
      </button>

      {/* Expanded Config */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 space-y-4 border-t border-border mt-0 pt-4">
          {/* Enabled toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              Auto-halt enabled
            </label>
            <button
              onClick={() => setEnabled(!enabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                enabled ? 'bg-green-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                  enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Drop threshold */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground">
              Drop Threshold (%)
            </label>
            <p className="text-xs text-muted-foreground">
              Trigger auto-halt when price drops this percentage within the check window (0-50%)
            </p>
            <input
              type="number"
              min="0.1"
              max="50"
              step="0.1"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value) || 0)}
              className="w-full max-w-xs px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>

          {/* Check window */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-foreground">
              Check Window (minutes)
            </label>
            <p className="text-xs text-muted-foreground">
              Time window for price drop calculation (5-1440 minutes)
            </p>
            <input
              type="number"
              min="5"
              max="1440"
              step="1"
              value={window}
              onChange={(e) => setWindow(parseInt(e.target.value) || 5)}
              className="w-full max-w-xs px-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
            />
          </div>

          {/* Save / Reset */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? 'Saving...' : 'Save'}
            </button>
            {hasChanges && (
              <button
                onClick={() => {
                  setThreshold(config.drop_threshold_pct);
                  setWindow(config.check_window_minutes);
                  setEnabled(config.enabled);
                }}
                className="px-4 py-2 border border-border rounded-lg font-medium text-sm hover:bg-muted transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Halt History Table ---

function HaltHistoryTable({ history }: { history: HistoryEntry[] }) {
  if (history.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-8 text-center text-sm text-muted-foreground">
        No halt or resume events recorded yet.
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left font-semibold text-foreground">Time</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Metal</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Event</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Triggered By</th>
              <th className="px-4 py-3 text-left font-semibold text-foreground">Reason</th>
            </tr>
          </thead>
          <tbody>
            {history.map((entry, idx) => (
              <tr key={idx} className="border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {formatTimestamp(entry.timestamp)}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">
                  {entry.metal_type || '--'}
                </td>
                <td className="px-4 py-3">
                  {entry.event === 'halted' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                      Halted
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      Resumed
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {triggeredByLabel(entry.triggered_by)}
                </td>
                <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                  {entry.reason || '--'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Confirm Dialog ---

function ConfirmDialog({
  metalType,
  action,
  onConfirm,
  onCancel,
}: {
  metalType: string;
  action: 'halt' | 'resume';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const isHalt = action === 'halt';
  const label = metalType === 'ALL' ? 'ALL sales' : `${metalType} sales`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-xl border border-border shadow-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className={`h-6 w-6 ${isHalt ? 'text-red-600' : 'text-green-600'}`} />
          <h3 className="text-lg font-semibold text-foreground">
            Confirm {isHalt ? 'Halt' : 'Resume'}
          </h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          {isHalt
            ? `Are you sure you want to halt ${label}? Customers will not be able to purchase ${metalType === 'ALL' ? 'any products' : `${metalType} products`} until sales are manually resumed.`
            : `Are you sure you want to resume ${label}? Customers will be able to purchase ${metalType === 'ALL' ? 'products' : `${metalType} products`} again immediately.`}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-border rounded-lg font-medium text-sm hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg font-semibold text-sm text-white transition-all ${
              isHalt
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isHalt ? 'Halt Sales' : 'Resume Sales'}
          </button>
        </div>
      </div>
    </div>
  );
}
