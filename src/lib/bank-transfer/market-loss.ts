import { createLogger } from '@/lib/utils/logger';

const logger = createLogger('MARKET_LOSS');

interface MarketLossInput {
  lockedTotalAud: number;
  currentTotalAud: number;
  depositAmountAud: number;
  cancellationFeePercentage: number;
}

interface MarketLossResult {
  marketLoss: number;
  cancellationFee: number;
  captureAmount: number;
  shouldCapture: boolean;
}

export function calculateMarketLoss(input: MarketLossInput): MarketLossResult {
  const { lockedTotalAud, currentTotalAud, depositAmountAud, cancellationFeePercentage } = input;

  const marketLoss = Math.max(0, lockedTotalAud - currentTotalAud);
  const cancellationFee = lockedTotalAud * (cancellationFeePercentage / 100);
  const rawCapture = marketLoss + cancellationFee;
  const captureAmount = Math.min(rawCapture, depositAmountAud);
  const shouldCapture = captureAmount > 0;

  const result = {
    marketLoss: Math.round(marketLoss * 100) / 100,
    cancellationFee: Math.round(cancellationFee * 100) / 100,
    captureAmount: Math.round(captureAmount * 100) / 100,
    shouldCapture,
  };

  logger.log('Market loss calculation:', {
    lockedTotalAud,
    currentTotalAud,
    ...result,
  });

  return result;
}
