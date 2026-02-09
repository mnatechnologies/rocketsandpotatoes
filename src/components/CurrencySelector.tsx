'use client';

import { useCurrency } from '@/contexts/CurrencyContext';
import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';


export default function CurrencySelector() {
  const { currency, setCurrency, fxRate, fxTimestamp, isLoading } = useCurrency();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);


    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const handleCurrencyChange = (newCurrency: 'USD' | 'AUD') => {
        setCurrency(newCurrency);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-foreground/80 bg-muted/50 border border-border rounded-md hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 transition-colors"
                aria-label="Select currency"
                aria-expanded={isOpen}
            >
                <span>{currency}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            <div className={`absolute right-0 mt-1.5 w-44 bg-card border border-border rounded-lg shadow-lg transition-all duration-150 z-50 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                <div className="py-1">
                    <button
                        onClick={() => handleCurrencyChange('USD')}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                            currency === 'USD' ? 'bg-primary/10 text-primary font-medium' : 'text-foreground/80 hover:bg-muted/50 hover:text-foreground'
                        }`}
                    >
                        USD - US Dollar
                    </button>
                    <button
                        onClick={() => handleCurrencyChange('AUD')}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                            currency === 'AUD' ? 'bg-primary/10 text-primary font-medium' : 'text-foreground/80 hover:bg-muted/50 hover:text-foreground'
                        }`}
                    >
                        AUD - Australian Dollar
                    </button>
                </div>

                {/* FX Rate Info */}
                {currency === 'AUD' && (
                    <div className="border-t border-border px-3 py-2 text-[11px] text-muted-foreground">
                        {isLoading ? (
                            <span>Loading rate...</span>
                        ) : (
                            <>
                                <div>Rate: 1 USD = {fxRate.toFixed(4)} AUD</div>
                                {fxTimestamp && (
                                    <div className="text-muted-foreground/60 mt-0.5">
                                        Updated: {fxTimestamp.toLocaleTimeString()}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
