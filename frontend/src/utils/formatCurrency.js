// Format numbers as Nigerian Naira
// formatCurrency(1500) → "₦1,500.00"
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2
  }).format(amount);
};