/**
 * Centralized API Service Wrapper for VENDRA Platform
 * 
 * Safely handles API communication, parses JSON responses, catches and logs
 * non-JSON production responses (such as Vercel HTML 404/500 pages), and prevents
 * uncaught syntax exceptions like "Unexpected token 'T', 'The page c...' is not valid JSON".
 */

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T;
  error?: string;
}

export class ApiError extends Error {
  public status: number;
  public statusText: string;
  public endpoint: string;
  public rawBody?: string;

  constructor(message: string, status: number, statusText: string, endpoint: string, rawBody?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.endpoint = endpoint;
    this.rawBody = rawBody;
  }
}

/**
 * Executes a network request and safely handles JSON vs non-JSON (HTML 404/500) responses.
 */
export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('vendra_auth_token');

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // Normalize endpoint URL (ensuring leading slash if relative)
  const normalizedEndpoint = endpoint.startsWith('http') || endpoint.startsWith('/') 
    ? endpoint 
    : `/${endpoint}`;

  let response: Response;
  try {
    response = await fetch(normalizedEndpoint, {
      ...options,
      headers
    });
  } catch (networkError: any) {
    console.error(`[API Network Error] Failed to reach ${normalizedEndpoint}:`, networkError);
    throw new ApiError(
      networkError.message || 'Network connection error. Please verify your internet connection.',
      0,
      'NETWORK_ERROR',
      normalizedEndpoint
    );
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  let responseData: any = null;
  let rawText = '';

  if (isJson) {
    try {
      responseData = await response.json();
    } catch (parseError: any) {
      console.error(`[API Parse Error] JSON parsing failed for ${normalizedEndpoint}:`, parseError);
      throw new ApiError(
        'Server returned invalid JSON response.',
        response.status,
        response.statusText,
        normalizedEndpoint
      );
    }
  } else {
    // Non-JSON response received (often a Vercel 404 HTML page: "The page could not be found...")
    try {
      rawText = await response.text();
    } catch {
      rawText = '';
    }

    // Try parsing as JSON anyway in case header was omitted
    try {
      responseData = JSON.parse(rawText);
    } catch {
      // It is truly non-JSON text/HTML
      const isHtml = rawText.includes('<!DOCTYPE') || rawText.includes('<html') || rawText.includes('The page could not be found');
      const snippet = rawText.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim().slice(0, 150);

      console.warn(`[API Non-JSON Response] ${response.status} ${response.statusText} at ${normalizedEndpoint}`);
      console.warn(`[API Body Preview]`, snippet || '(empty body)');

      let userFriendlyMessage = 'Server error occurred.';
      if (response.status === 404) {
        userFriendlyMessage = `API endpoint '${normalizedEndpoint}' was not found (${response.status}). If deployed on Vercel, ensure serverless API routes are configured.`;
      } else if (response.status === 502 || response.status === 504) {
        userFriendlyMessage = 'Gateway timeout or server connection failed. Please try again shortly.';
      } else if (response.status === 500) {
        userFriendlyMessage = 'Internal server encountered an error.';
      } else if (snippet) {
        userFriendlyMessage = `Server response (${response.status}): ${snippet}`;
      }

      if (!response.ok) {
        throw new ApiError(
          userFriendlyMessage,
          response.status,
          response.statusText,
          normalizedEndpoint,
          rawText
        );
      }
    }
  }

  // Handle standard HTTP error statuses
  if (!response.ok) {
    const errorMessage = 
      responseData?.error || 
      responseData?.message || 
      `Request failed with status ${response.status}`;
    
    throw new ApiError(
      errorMessage,
      response.status,
      response.statusText,
      normalizedEndpoint,
      rawText
    );
  }

  return responseData as T;
}

export const api = {
  get: <T = any>(endpoint: string, options?: RequestInit) => 
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body)
    }),

  put: <T = any>(endpoint: string, body?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body)
    }),

  delete: <T = any>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' })
};

export default api;
