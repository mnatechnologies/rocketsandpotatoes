import { NextResponse } from 'next/server';

const METAL_CODES: Record<string, string> = {
  Gold: 'XAU',
  Silver: 'XAG',
  Platinum: 'XPT',
  Palladium: 'XPD',
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const metal = searchParams.get('metal') || 'Gold';
  const currency = searchParams.get('currency') || 'AUD';
  const period = searchParams.get('period') || '1M';

  const symbol = METAL_CODES[metal];
  if (!symbol) {
    return NextResponse.json({ error: 'Invalid metal' }, { status: 400 });
  }

  // Calculate dates based on period
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case '1W':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '1M':
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case '3M':
      startDate.setMonth(endDate.getMonth() - 3);
      break;
    case '6M':
      startDate.setMonth(endDate.getMonth() - 6);
      break;
    case '1Y':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    case '5Y':
      startDate.setFullYear(endDate.getFullYear() - 5);
      break;
    default:
      startDate.setMonth(endDate.getMonth() - 1); // Default 1M
  }

  // Format dates as YYYY-MM-DD for the API
  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  try {
    const apiKey = process.env.METALPRICEAPI_API_KEY;
    if (!apiKey) throw new Error('API Key missing');

    const apiUrl = `https://api.metalpriceapi.com/v1/timeframe?api_key=${apiKey}&start_date=${formatDate(startDate)}&end_date=${formatDate(endDate)}&base=${currency}&currencies=${symbol}`;

    const res = await fetch(apiUrl);
    const data = await res.json();

    if (!data.success) {
      console.error('MetalPriceAPI Error:', data);
      throw new Error(data.error?.info || 'Failed to fetch external data');
    }

    // Transform response for Recharts: { "2024-01-01": { "XAU": 2000 } } -> [{ date: "2024-01-01", price: 2000 }]
    const chartData = Object.entries(data.rates || {}).map(([date, rates]: [string, any]) => ({
      date,
      price: rates[symbol] ? (1 / rates[symbol]) : 0 // API often returns Base/Metal, we usually want Currency/Metal (Price of 1 oz)
      // Note: MetalPriceAPI usually returns rates relative to base.
      // If Base=AUD and Currency=XAU, rate is how many XAU you get for 1 AUD (e.g. 0.0003).
      // Price of 1oz Gold in AUD = 1 / Rate.
      // IF however you request Base=USD, Currencies=EUR, it gives EUR per USD.
      // For Metals (XAU), if Base=AUD, rate is XAU per AUD.
      // We want AUD per XAU. So we invert: 1 / rate.
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Check if inversion is needed.
    // If the price looks like 0.0003, we invert. If it looks like 3000, we don't.
    // XAU in AUD is roughly ~4000 AUD. The API with base=AUD returns ~0.00025.
    // So we definitely invert.
    const finalData = chartData.map(d => ({
      ...d,
      price: d.price < 1 ? (1 / d.price) : d.price
    }));

    return NextResponse.json(finalData);
  } catch (error) {
    console.error('History API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}