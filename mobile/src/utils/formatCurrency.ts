export const formatCurrency = (amount: string | number | null | undefined): string => {
    const num = parseFloat(String(amount ?? 0)) || 0;
    return `₦${num.toLocaleString('en-NG', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};
