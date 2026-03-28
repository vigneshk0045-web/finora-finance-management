export const money = (value) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value || 0);
export const shortDate = (value) => new Date(value).toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
