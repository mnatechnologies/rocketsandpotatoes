
"use client";
import { getMetalInfo, type MetalSymbol } from "@/lib/metals-api/metalsApi";
import { useMetalPrices } from '@/contexts/MetalPricesContext';

interface MetalPrice {
  metal: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function MetalsPricing() {
  // Use shared prices from context - no more individual fetching!
  const { prices: contextPrices, isLoading, error, lastUpdated, refetch } = useMetalPrices();

  // Transform context prices to match the component's expected format
  const prices: MetalPrice[] = contextPrices.map((quote) => {
    const metalInfo = getMetalInfo(quote.symbol as MetalSymbol);
    return {
      metal: metalInfo.ticker,
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent
    };
  });

  /* ===== COMMENTED OUT - Now using shared context instead of individual fetch =====
  const [prices, setPrices] = useState<MetalPrice[]>([
    { metal: "GOLD", price: 0, change: 0, changePercent: 0 },
    { metal: "SILVER", price: 0, change: 0, changePercent: 0 },
    { metal: "PLATINUM", price: 0, change: 0, changePercent: 0 },
    { metal: "PALLADIUM", price: 0, change: 0, changePercent: 0 },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/api/metals?baseCurrency=USD');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      console.log('API Response:', result);

      if (result.success && result.data) {
        const newPrices: MetalPrice[] = result.data.map((quote: any) => {
          const metalInfo = getMetalInfo(quote.symbol as MetalSymbol);
          return {
            metal: metalInfo.ticker,
            price: quote.price,
            change: quote.change,
            changePercent: quote.changePercent
          };
        });

        console.log('Mapped prices:', newPrices);
        setPrices(newPrices);
        setLastUpdated(new Date());
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch prices');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch prices on component mount
  useEffect(() => {
    fetchPrices();
  }, []);

  // Optional: Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPrices();
    }, 600000); // 5 minutes

    return () => clearInterval(interval);
  }, []);
  ===== END COMMENTED OUT CODE ===== */

  const formatPrice = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  if (error) {
    return (
      <div className="bg-black text-white p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
            <h2 className="text-xl font-bold text-red-500 mb-2">Error Loading Prices</h2>
            <p className="text-red-300">{error}</p>
            <button
              onClick={refetch}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-5xl font-bold mb-3">
            Live Precious Metals Pricing
          </h1>
          <p suppressHydrationWarning={true} className="text-gray-500 text-sm">
            {isLoading ? (
              "Loading prices..."
            ) : (
              <>
                Last updated: {lastUpdated ? formatTime(lastUpdated) : 'Never'} • Updates every 5 minutes
              </>
            )}
          </p>
        </div>

        {/* Price Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {prices.map((metal) => (
            <div
              key={metal.metal}
              className={`bg-zinc-900 rounded-lg p-6 border border-zinc-800 transition-opacity ${
                isLoading ? 'opacity-50' : 'opacity-100'
              }`}
            >
              {/* Metal Name and Unit */}
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-lg font-semibold">{metal.metal}</h2>
                <span className="text-xs text-gray-500">USD/oz</span>
              </div>

              {/* Price */}
              <div className="mb-4">
                <p className="text-3xl font-bold">
                  {isLoading && metal.price === 0 ? (
                    <span className="text-gray-600">Loading...</span>
                  ) : (
                    formatPrice(metal.price)
                  )}
                </p>
              </div>

              {/* Change */}
              <div
                className={`flex items-center space-x-1 text-sm ${
                  metal.change >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                <svg
                  className="h-3 w-3"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {metal.change >= 0 ? (
                    <polyline points="18 15 12 9 6 15" />
                  ) : (
                    <polyline points="6 9 12 15 18 9" />
                  )}
                </svg>
                <span className="font-medium">
                  {metal.change >= 0 ? "+" : ""}${Math.abs(metal.change).toFixed(2)} (
                  {metal.changePercent >= 0 ? "+" : ""}
                  {metal.changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}