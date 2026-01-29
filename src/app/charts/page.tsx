import MetalPriceChart from '@/components/charts/MetalPriceChart';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Metal Charts & Pricing | Australian National Bullion',
  description: 'View real-time and historical price charts for Gold, Silver, Platinum, and Palladium in AUD and USD.',
};

export default function ChartsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground my-4">
            Precious Metals Charts
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Track live spot prices and analyze historical trends for Gold, Silver, Platinum, and Palladium.
          </p>
        </div>

        <MetalPriceChart />

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6 bg-card rounded-lg shadow-sm border border-border">
            <h3 className="text-lg font-semibold mb-2 text-foreground">Live Data</h3>
            <p className="text-muted-foreground">
              Real-time spot prices updated every minute to keep you informed.
            </p>
          </div>
          <div className="p-6 bg-card rounded-lg shadow-sm border border-border">
            <h3 className="text-lg font-semibold mb-2 text-foreground">Historical Analysis</h3>
            <p className="text-muted-foreground">
              Comprehensive historical data ranging from 1 week to 5 years.
            </p>
          </div>
          <div className="p-6 bg-card rounded-lg shadow-sm border border-border">
            <h3 className="text-lg font-semibold mb-2 text-foreground">Multi-Currency</h3>
            <p className="text-muted-foreground">
              View prices in AUD or USD to suit your investment strategy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
