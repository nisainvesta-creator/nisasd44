import React from 'react';
import { useLanguage } from '../hooks/useLanguage';

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  availableAmount: number;
  currencyIcon: React.ReactNode;
  currencySymbol: string;
  precision: number;
  disabled?: boolean;
  isError?: boolean;
  errorMessage?: string | null;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  placeholder,
  availableAmount,
  currencyIcon,
  currencySymbol,
  precision,
  disabled = false,
  isError = false,
  errorMessage = null,
}) => {
  const { t } = useLanguage();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    let sanitizedValue = inputValue.replace(/[^0-9.]/g, '');

    const parts = sanitizedValue.split('.');
    if (parts.length > 2) {
      sanitizedValue = parts[0] + '.' + parts.slice(1).join('');
    }

    if (sanitizedValue.startsWith('.')) {
        sanitizedValue = '0' + sanitizedValue;
    }

    if (sanitizedValue.length > 1 && sanitizedValue.startsWith('0') && !sanitizedValue.startsWith('0.')) {
        sanitizedValue = sanitizedValue.substring(1);
    }

    const [integerPart, decimalPart] = sanitizedValue.split('.');

    if (decimalPart && decimalPart.length > precision) {
      sanitizedValue = `${integerPart}.${decimalPart.substring(0, precision)}`;
    }

    onChange(sanitizedValue);
  };

  const handleAllClick = () => {
    onChange(availableAmount.toFixed(precision));
  };

  return (
    <div>
      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          className={`w-full text-lg border rounded-lg p-3 pr-36 focus:outline-none transition-colors ${
            isError ? 'border-red-500 text-red-600' : 'border-gray-200 focus:border-[#07c160]'
          } ${disabled ? 'bg-gray-50' : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          aria-label={`${currencySymbol} amount`}
          aria-invalid={isError}
          aria-describedby={isError ? `${currencySymbol}-error` : undefined}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          {currencyIcon}
          <span className="font-semibold mx-2 text-gray-800">{currencySymbol}</span>
          {!disabled && (
            <>
              <div className="h-6 border-l border-gray-300"></div>
              <button
                onClick={handleAllClick}
                className="ml-2 px-2 py-1 rounded-md text-sm font-bold text-[#07c160] hover:bg-green-50 active:bg-green-100 transition-colors duration-150"
                aria-label={`Fill maximum available ${currencySymbol} amount`}
              >
                {t('currencyInput.all')}
              </button>
            </>
          )}
        </div>
      </div>
      <div id={`${currencySymbol}-error`} className={`text-xs h-4 mt-1.5 px-1 transition-colors ${isError ? 'text-red-500' : 'text-gray-500'}`}>
        {errorMessage ? (
          <span>{errorMessage}</span>
        ) : (
          <span>{t('currencyInput.available')}: {availableAmount.toFixed(precision)} {currencySymbol}</span>
        )}
      </div>
    </div>
  );
};
