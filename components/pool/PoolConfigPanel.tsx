'use client'

import { useState, useTransition } from 'react'
import { Settings, DollarSign, Percent, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils/cn'
import { togglePool, updatePoolConfig } from '@/app/actions/pool'
import type { Room, PoolSplit } from '@/types/database'

interface PoolConfigPanelProps {
  room: Room
  onClose: () => void
  open: boolean
}

const CURRENCY_OPTIONS = [
  { value: 'MXN', label: '🇲🇽 MXN', symbol: '$' },
  { value: 'USD', label: '🇺🇸 USD', symbol: '$' },
  { value: 'EUR', label: '🇪🇺 EUR', symbol: '€' },
  { value: 'PEN', label: '🇵🇪 PEN', symbol: 'S/' },
  { value: 'COP', label: '🇨🇴 COP', symbol: '$' },
  { value: 'ARS', label: '🇦🇷 ARS', symbol: '$' },
  { value: 'CLP', label: '🇨🇱 CLP', symbol: '$' },
  { value: 'BRL', label: '🇧🇷 BRL', symbol: 'R$' },
]

const SPLIT_PRESETS: { label: string; split: PoolSplit[] }[] = [
  { label: 'Top 3 (70/20/10)', split: [{ place: 1, pct: 70 }, { place: 2, pct: 20 }, { place: 3, pct: 10 }] },
  { label: 'Top 3 (60/25/15)', split: [{ place: 1, pct: 60 }, { place: 2, pct: 25 }, { place: 3, pct: 15 }] },
  { label: 'Top 2 (80/20)', split: [{ place: 1, pct: 80 }, { place: 2, pct: 20 }] },
  { label: 'Winner takes all', split: [{ place: 1, pct: 100 }] },
]

export function PoolConfigPanel({ room, onClose, open }: PoolConfigPanelProps) {
  const poolSplit = Array.isArray(room.pool_split)
    ? (room.pool_split as unknown as PoolSplit[])
    : [{ place: 1, pct: 70 }, { place: 2, pct: 20 }, { place: 3, pct: 10 }]

  const [enabled, setEnabled] = useState(room.pool_enabled)
  const [buyIn, setBuyIn] = useState(room.pool_buy_in || 100)
  const [currency, setCurrency] = useState(room.pool_currency || 'MXN')
  const [split, setSplit] = useState<PoolSplit[]>(poolSplit)
  const [isPending, startTransition] = useTransition()

  const splitTotal = split.reduce((s, x) => s + x.pct, 0)
  const currencySymbol = CURRENCY_OPTIONS.find((c) => c.value === currency)?.symbol || '$'

  const handleToggle = () => {
    const newVal = !enabled
    startTransition(async () => {
      const res = await togglePool(room.id, newVal)
      if (res.error) {
        toast.error(res.error)
        return
      }
      setEnabled(newVal)
      toast.success(newVal ? 'Polla activada' : 'Polla desactivada')
    })
  }

  const handleSave = () => {
    if (splitTotal !== 100) {
      toast.error('Los porcentajes deben sumar 100%')
      return
    }
    startTransition(async () => {
      const res = await updatePoolConfig(room.id, buyIn, currency, split)
      if (res.error) {
        toast.error(res.error)
        return
      }
      toast.success('Configuración guardada')
      onClose()
    })
  }

  const handlePreset = (preset: PoolSplit[]) => {
    setSplit(preset.map((s) => ({ ...s })))
  }

  const updateSplitPct = (idx: number, pct: number) => {
    setSplit((prev) => prev.map((s, i) => (i === idx ? { ...s, pct } : s)))
  }

  const addPlace = () => {
    const maxPlace = Math.max(...split.map((s) => s.place), 0)
    setSplit((prev) => [...prev, { place: maxPlace + 1, pct: 0 }])
  }

  const removePlace = (idx: number) => {
    if (split.length <= 1) return
    setSplit((prev) => prev.filter((_, i) => i !== idx))
  }

  return (
    <Modal open={open} onClose={onClose} title="Configurar Polla" size="md">
      <div className="space-y-6">
        {/* Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-body font-medium text-sm dark:text-white">Activar Polla</p>
            <p className="text-xs text-gray-400 font-body mt-0.5">
              Habilita el sistema de apuestas con dinero
            </p>
          </div>
          <button
            onClick={handleToggle}
            disabled={isPending}
            className={cn(
              'relative w-11 h-6 rounded-full transition-colors',
              enabled ? 'bg-[#3CAC3B]' : 'bg-gray-300 dark:bg-white/20'
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
                enabled && 'translate-x-5'
              )}
            />
          </button>
        </div>

        {enabled && (
          <>
            <div className="border-t border-gray-100 dark:border-white/[0.06]" />

            {/* Buy-in */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-body font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                <DollarSign size={12} /> Entrada
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-mono">{currencySymbol}</span>
                  <input
                    type="number"
                    min={0}
                    max={1000000}
                    value={buyIn}
                    onChange={(e) => setBuyIn(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full pl-8 pr-3 py-2 text-sm font-mono bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/10 rounded-lg focus:ring-2 focus:ring-[#2A398D]/30 focus:border-[#2A398D] outline-none transition-all"
                  />
                </div>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="px-3 py-2 text-sm font-body bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/10 rounded-lg outline-none"
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Split presets */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-body font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                <Percent size={12} /> Distribución de premios
              </label>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {SPLIT_PRESETS.map((preset) => {
                  const isActive = JSON.stringify(split) === JSON.stringify(preset.split)
                  return (
                    <button
                      key={preset.label}
                      onClick={() => handlePreset(preset.split)}
                      className={cn(
                        'px-2.5 py-1 text-xs font-body rounded-full border transition-colors',
                        isActive
                          ? 'bg-[#2A398D] text-white border-[#2A398D]'
                          : 'bg-gray-50 dark:bg-white/[0.06] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-[#2A398D]/40'
                      )}
                    >
                      {preset.label}
                    </button>
                  )
                })}
              </div>

              {/* Custom split editor */}
              <div className="space-y-2">
                {split.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-mono text-gray-400 w-8 text-right">{s.place}°</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={s.pct}
                      onChange={(e) => updateSplitPct(idx, Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-20 px-2 py-1.5 text-sm font-mono bg-gray-50 dark:bg-white/[0.06] border border-gray-200 dark:border-white/10 rounded-lg outline-none text-center"
                    />
                    <span className="text-xs text-gray-400">%</span>
                    <div className="flex-1 bg-gray-100 dark:bg-white/[0.06] rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-[#2A398D] rounded-full transition-all"
                        style={{ width: `${Math.min(s.pct, 100)}%` }}
                      />
                    </div>
                    {split.length > 1 && (
                      <button
                        onClick={() => removePlace(idx)}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                {split.length < 5 && (
                  <button
                    onClick={addPlace}
                    className="text-xs font-body text-[#2A398D] hover:underline"
                  >
                    + Agregar lugar
                  </button>
                )}
                <div className={cn(
                  'text-xs font-mono text-right',
                  splitTotal === 100 ? 'text-[#3CAC3B]' : 'text-[#E61D25]'
                )}>
                  Total: {splitTotal}%
                </div>
              </div>
            </div>

            {/* Preview */}
            {buyIn > 0 && (
              <div className="bg-gray-50 dark:bg-white/[0.04] rounded-xl p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-body font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
                  <Zap size={12} /> Vista previa (10 miembros)
                </div>
                <p className="text-sm font-body text-gray-600 dark:text-gray-300">
                  Pozo total: <span className="font-mono font-bold">{currencySymbol}{(buyIn * 10).toLocaleString()}</span>
                </p>
                {split.map((s) => (
                  <div key={s.place} className="flex items-center justify-between text-sm font-body">
                    <span className="text-gray-500 dark:text-gray-400">{s.place}° lugar ({s.pct}%)</span>
                    <span className="font-mono font-bold text-gray-700 dark:text-gray-200">
                      {currencySymbol}{Math.round(buyIn * 10 * s.pct / 100).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={isPending || splitTotal !== 100}
              className={cn(
                'w-full py-2.5 text-sm font-body font-medium rounded-xl transition-colors',
                splitTotal === 100
                  ? 'bg-[#2A398D] text-white hover:bg-[#2A398D]/90'
                  : 'bg-gray-200 dark:bg-white/10 text-gray-400 cursor-not-allowed'
              )}
            >
              {isPending ? 'Guardando...' : 'Guardar configuración'}
            </button>
          </>
        )}
      </div>
    </Modal>
  )
}

export function PoolConfigButton({ room }: { room: Room }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-[#C9A84C]/10 hover:bg-[#C9A84C]/20 transition-colors"
        title="Configurar Polla"
      >
        <Settings size={16} className="text-[#C9A84C]" />
      </button>
      <PoolConfigPanel room={room} open={open} onClose={() => setOpen(false)} />
    </>
  )
}
