'use client';

import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { Loader2 } from 'lucide-react';
import { useTheme } from '@/contexts/Themecontext';
import { useMetalPrices } from '@/contexts/MetalPricesContext';
import { useCurrency } from '@/contexts/CurrencyContext';

const PERIODS = ['1W', '1M', '3M', '6M', '1Y', '5Y'];
const METALS = ['Gold', 'Silver', 'Platinum', 'Palladium'];
const CURRENCIES = ['AUD', 'USD'];

const METAL_SYMBOL_MAP: Record<string, string> = {
  Gold: 'XAU',
  Silver: 'XAG',
  Platinum: 'XPT',
  Palladium: 'XPD',
};

const METAL_COLORS: Record<string, string> = {
  Gold: '#D4AF37',       // Metallic Gold
  Silver: '#C0C0C0',     // Silver
  Platinum: '#E5E4E2',   // Platinum
  Palladium: '#CED0DD',  // Palladium
};

export default function MetalPriceChart() {
  const { resolvedTheme } = useTheme();
  const { prices: contextPrices } = useMetalPrices();
  const { exchangeRate } = useCurrency();
  const [metal, setMetal] = useState('Gold');
  const [currency, setCurrency] = useState('AUD');
  const [period, setPeriod] = useState('1M');
  const [data, setData] = useState<{ date: string; price: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ metal, currency, period });
        const res = await fetch(`/api/charts/history?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to load chart data');

        const json = await res.json();
        if (Array.isArray(json)) {
          setData(json);
        } else {
          throw new Error('Invalid data format');
        }
      } catch (err) {
        console.error(err);
        setError('Unable to load chart data at this time.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [metal, currency, period]);

  // Use real-time price from MetalPricesContext (same source as ticker) for the header
  const metalSymbol = METAL_SYMBOL_MAP[metal];
  const contextPrice = contextPrices.find(p => p.symbol === metalSymbol)?.price;
  // Context prices are always AUD — convert if chart currency is USD
  const latestPrice = contextPrice
    ? (currency === 'AUD' ? contextPrice : contextPrice / exchangeRate)
    : (data.length > 0 ? data[data.length - 1].price : 0);
  const startPrice = data.length > 0 ? data[0].price : 0;
  const change = latestPrice - startPrice;
  const percentChange = startPrice ? (change / startPrice) * 100 : 0;
  const isPositive = change >= 0;
  const isLight = resolvedTheme === 'light';
  const chartColors = {
    grid: isLight ? '#E4E4E7' : '#3F3F46',
    tick: isLight ? '#52525B' : '#A1A1AA',
    tooltipBg: isLight ? '#FFFFFF' : '#18181B',
    tooltipBorder: isLight ? '#E4E4E7' : '#3F3F46',
    tooltipText: isLight ? '#18181B' : '#F4F4F5',
  };

  return (
    <div className="w-full bg-card rounded-xl shadow-card border border-border p-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {metal} Price Chart
          </h2>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold text-foreground">
              {new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(latestPrice)}
            </span>
            {!loading && (
              <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? '+' : ''}{change.toFixed(2)} ({percentChange.toFixed(2)}%)
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-border bg-transparent text-sm font-medium text-foreground"
          >
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Toggles */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-1 bg-muted p-1 rounded-lg w-fit">
          {METALS.map((m) => (
            <button
              key={m}
              onClick={() => setMetal(m)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                metal === m
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-1 bg-muted p-1 rounded-lg w-fit">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-[400px] w-full relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 z-10 backdrop-blur-sm">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
          </div>
        )}

        {error ? (
          <div className="h-full flex items-center justify-center text-red-500">
            {error}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`color${metal}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={METAL_COLORS[metal] || '#D4AF37'} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={METAL_COLORS[metal] || '#D4AF37'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
              <XAxis
                dataKey="date"
                tickFormatter={(str) => {
                  const date = new Date(str);
                  return period === '1W' || period === '1M'
                    ? date.getDate() + '/' + (date.getMonth() + 1)
                    : date.toLocaleDateString('en-AU', { month: 'short', year: '2-digit' });
                }}
                tick={{ fontSize: 12, fill: chartColors.tick }}
                axisLine={false}
                tickLine={false}
                minTickGap={30}
              />
              <YAxis
                domain={['auto', 'auto']}
                tickFormatter={(val) => `$${val.toLocaleString()}`}
                tick={{ fontSize: 12, fill: chartColors.tick }}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: chartColors.tooltipBg,
                  borderRadius: '8px',
                  border: `1px solid ${chartColors.tooltipBorder}`,
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                labelStyle={{ color: chartColors.tooltipText }}
                itemStyle={{ color: chartColors.tooltipText }}
                formatter={(val: number | undefined) => [
                  val !== undefined ? new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(val) : 'N/A',
                  'Price'
                ]}
                labelFormatter={(label) => new Date(label).toLocaleDateString('en-AU', { dateStyle: 'medium' })}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={METAL_COLORS[metal] || '#D4AF37'}
                fillOpacity={1}
                fill={`url(#color${metal})`}
                strokeWidth={2}
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-4 text-center">
        Market data provided by MetalPriceAPI. Prices are indicative only.
      </p>
    </div>
  );
}
