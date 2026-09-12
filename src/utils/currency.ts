export function formatUGX(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) return 'UGX 0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return 'UGX 0';
  return `UGX ${Math.round(num).toLocaleString('en-US')}`;
}

export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateString;
  }
}

export function maskPhone(phone: string | undefined | null): string {
  if (!phone) return '—';
  if (phone.length <= 6) return phone;
  return phone.slice(0, 5) + '••••' + phone.slice(-3);
}
