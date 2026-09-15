/**
 * PesaPal v3 API Integration Service
 * Official API for processing payments in Uganda (MTN MoMo, Airtel Money, Visa, Mastercard, Bank).
 */

const PESAPAL_CONSUMER_KEY =
  process.env.PESAPAL_CONSUMER_KEY || 'MFYoplJY0fl0hrP7UUdIjU5s4kwCeH4u';
const PESAPAL_CONSUMER_SECRET =
  process.env.PESAPAL_CONSUMER_SECRET || 'RnPg8vlzdNlK7OUk6oYw2gbdsG4=';
const PESAPAL_ENV = process.env.PESAPAL_ENVIRONMENT || 'production';

const BASE_URL =
  PESAPAL_ENV === 'sandbox'
    ? 'https://cybqa.pesapal.com/pesapalv3/api'
    : 'https://pay.pesapal.com/v3/api';

let cachedToken: string | null = null;
let tokenExpiryTimestamp = 0;
let cachedIpnId: string | null = process.env.PESAPAL_IPN_ID || '11187eae-f61b-4793-b72e-d9e7bc46d45f';

export interface PesaPalBillingAddress {
  email_address?: string;
  phone_number?: string;
  country_code?: string;
  first_name?: string;
  last_name?: string;
}

export interface PesaPalSubmitOrderParams {
  reference: string;
  amount: number;
  phone: string;
  email?: string;
  fullName?: string;
  description?: string;
  callbackUrl: string;
}

export interface PesaPalSubmitOrderResponse {
  order_tracking_id: string;
  merchant_reference: string;
  redirect_url: string;
  status: string;
  error?: any;
}

export interface PesaPalTransactionStatusResponse {
  payment_method?: string;
  amount: number;
  created_date?: string;
  confirmation_code?: string;
  order_tracking_id: string;
  payment_status_description: string;
  description?: string;
  message?: string;
  payment_account?: string;
  status_code: number;
  merchant_reference: string;
  currency: string;
  error?: any;
  status: string;
}

/**
 * Retrieves a valid PesaPal JWT authentication token, caching it until expiration.
 */
export async function getPesaPalAuthToken(): Promise<string> {
  // Return cached token if valid for at least 60 seconds
  if (cachedToken && Date.now() < tokenExpiryTimestamp - 60000) {
    return cachedToken;
  }

  const response = await fetch(`${BASE_URL}/Auth/RequestToken`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      consumer_key: PESAPAL_CONSUMER_KEY,
      consumer_secret: PESAPAL_CONSUMER_SECRET
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PesaPal Authentication failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  if (!data.token) {
    throw new Error(`Invalid token response from PesaPal: ${JSON.stringify(data)}`);
  }

  cachedToken = data.token;
  if (data.expiryDate) {
    tokenExpiryTimestamp = new Date(data.expiryDate).getTime();
  } else {
    // Default to 5 minutes expiration
    tokenExpiryTimestamp = Date.now() + 5 * 60 * 1000;
  }

  return cachedToken;
}

/**
 * Gets or registers an IPN notification ID with PesaPal.
 */
export async function getOrRegisterIpnId(appBaseUrl: string): Promise<string> {
  if (cachedIpnId) {
    return cachedIpnId;
  }

  const token = await getPesaPalAuthToken();

  try {
    // Check existing IPNs
    const listRes = await fetch(`${BASE_URL}/URLSetup/GetIPNList`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    });

    if (listRes.ok) {
      const ipnList = await listRes.json();
      if (Array.isArray(ipnList) && ipnList.length > 0) {
        const activeIpn = ipnList.find(item => item.ipn_id);
        if (activeIpn) {
          cachedIpnId = activeIpn.ipn_id;
          return cachedIpnId!;
        }
      }
    }

    // Otherwise register an IPN URL
    const ipnUrl = `${appBaseUrl.replace(/\/$/, '')}/api/pesapal/ipn`;
    const regRes = await fetch(`${BASE_URL}/URLSetup/RegisterIPN`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        url: ipnUrl,
        ipn_notification_type: 'GET'
      })
    });

    if (regRes.ok) {
      const regData = await regRes.json();
      if (regData.ipn_id) {
        cachedIpnId = regData.ipn_id;
        return cachedIpnId!;
      }
    }
  } catch (err) {
    console.warn('Could not query or register PesaPal IPN, using fallback ID:', err);
  }

  // Fallback to default registered ID for this account
  cachedIpnId = 'bbeafde2-0a75-490d-b5ec-da4ae9b84d94';
  return cachedIpnId;
}

/**
 * Submits an order request to PesaPal to generate an interactive payment checkout.
 */
export async function submitPesaPalOrder(
  params: PesaPalSubmitOrderParams
): Promise<PesaPalSubmitOrderResponse> {
  const token = await getPesaPalAuthToken();
  const notificationId = await getOrRegisterIpnId(
    params.callbackUrl.replace(/\/api\/pesapal\/.*$/, '')
  );

  const names = (params.fullName || 'Valued Customer').trim().split(' ');
  const firstName = names[0] || 'Customer';
  const lastName = names.slice(1).join(' ') || 'Uganda';

  const payload = {
    id: params.reference,
    currency: 'UGX',
    amount: Math.round(params.amount),
    description: params.description || `VENDRA Recharge - ${params.reference}`,
    callback_url: params.callbackUrl,
    notification_id: notificationId,
    billing_address: {
      email_address: params.email || 'customer@vendra.ug',
      phone_number: params.phone,
      country_code: 'UG',
      first_name: firstName,
      last_name: lastName
    }
  };

  const response = await fetch(`${BASE_URL}/Transactions/SubmitOrderRequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PesaPal Order submission failed (${response.status}): ${errorText}`);
  }

  const data: PesaPalSubmitOrderResponse = await response.json();

  if (!data.order_tracking_id || !data.redirect_url) {
    throw new Error(data.error?.message || 'Failed to generate PesaPal checkout URL.');
  }

  return data;
}

/**
 * Queries the real-time transaction status from PesaPal for a given orderTrackingId.
 */
export async function getPesaPalTransactionStatus(
  orderTrackingId: string
): Promise<PesaPalTransactionStatusResponse> {
  const token = await getPesaPalAuthToken();

  const response = await fetch(
    `${BASE_URL}/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json'
      }
    }
  );

  const data = await response.json();
  return data;
}

/**
 * Determines whether a PesaPal transaction status response indicates completed payment.
 */
export function isPesaPalCompleted(status: PesaPalTransactionStatusResponse): boolean {
  if (!status) return false;
  const desc = (status.payment_status_description || '').toUpperCase();
  return desc === 'COMPLETED' || status.status_code === 1;
}
