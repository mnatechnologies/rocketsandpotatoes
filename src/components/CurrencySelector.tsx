
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
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                aria-label="Select currency"
                aria-expanded={isOpen}
            >
                <span>{currency}</span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            <div className={`absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg transition-all duration-200 z-50 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                <div className="py-1">
                    <button
                        onClick={() => handleCurrencyChange('USD')}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                            currency === 'USD' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                        }`}
                    >
                        USD - US Dollar
                    </button>
                    <button
                        onClick={() => handleCurrencyChange('AUD')}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                            currency === 'AUD' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                        }`}
                    >
                        AUD - Australian Dollar
                    </button>
                </div>

                {/* FX Rate Info */}
                {currency === 'AUD' && (
                    <div className="border-t border-gray-200 px-4 py-2 text-xs text-gray-500">
                        {isLoading ? (
                            <span>Loading rate...</span>
                        ) : (
                            <>
                                <div>Rate: 1 USD = {fxRate.toFixed(4)} AUD</div>
                                {fxTimestamp && (
                                    <div className="text-gray-400">
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
