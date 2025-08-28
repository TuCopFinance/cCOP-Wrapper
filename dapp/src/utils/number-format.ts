/**
 * Number formatting utilities using Spanish locale (dot for thousands, comma for decimals)
 */

/**
 * Formats a number using custom Spanish format (dot for thousands, comma for decimals)
 * Forces thousands separator even for numbers >= 1000
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "1.234,56")
 */
export const formatNumber = (value: number, decimals: number = 2): string => {
  // Convert to string with specified decimals
  const fixedValue = value.toFixed(decimals);
  
  // Split integer and decimal parts
  const [integerPart, decimalPart] = fixedValue.split('.');
  
  // Add thousands separators (dots) to integer part
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  // Return formatted number
  if (decimals === 0) {
    return formattedInteger;
  } else {
    return `${formattedInteger},${decimalPart}`;
  }
};

/**
 * Formats a token amount with symbol
 * @param amount - The amount to format
 * @param symbol - Token symbol
 * @param decimals - Number of decimal places (default: 0 for cCOP/wcCOP, 2 for others)
 * @returns Formatted string (e.g., "1.234 cCOP" or "1.234,56 USD")
 */
export const formatTokenAmount = (amount: number, symbol: string, decimals: number = 2): string => {
  // No decimals for cCOP and wcCOP tokens
  if (symbol === 'cCOP' || symbol === 'wcCOP' || symbol === '') {
    decimals = 0;
  }
  return `${formatNumber(amount, decimals)} ${symbol}`;
};

/**
 * Formats a USD amount
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "$1.234,56 USD")
 */
export const formatUSDAmount = (amount: number, decimals: number = 2): string => {
  return `$${formatNumber(amount, decimals)} USD`;
};

/**
 * Parses a Spanish-formatted number string back to a number
 * @param formattedValue - The formatted string (e.g., "1.234,56")
 * @returns The parsed number
 */
export const parseFormattedNumber = (formattedValue: string): number => {
  // Remove dots (thousands separator) and replace comma with dot for decimal
  const normalizedValue = formattedValue.replace(/\./g, '').replace(',', '.');
  return parseFloat(normalizedValue) || 0;
};

/**
 * Formats a percentage value
 * @param value - The percentage value (0-100)
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string (e.g., "45,7%")
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${formatNumber(value, decimals)}%`;
};