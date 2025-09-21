interface ApiClientConfig {
  baseURL?: string;
  headers?: Record<string, string>;
}

class ApiClient {
  private baseURL: string;
  private headers: Record<string, string>;
  private isRedirectingToLogin = false;
  private redirectTimeout: NodeJS.Timeout | null = null;

  constructor(config: ApiClientConfig = {}) {
    this.baseURL = config.baseURL || '';
    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  private isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('access_token');
    return !!token;
  }

  private clearAuthData(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  }

  private redirectToLogin(): void {
    if (this.isRedirectingToLogin) return; // Prevent multiple redirects
    
    this.isRedirectingToLogin = true;
    
    // Clear any existing timeout
    if (this.redirectTimeout) {
      clearTimeout(this.redirectTimeout);
    }
    
    // Set a timeout to reset the flag after redirect
    this.redirectTimeout = setTimeout(() => {
      this.isRedirectingToLogin = false;
    }, 1000);
    
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      // Store current path for redirect after login
      localStorage.setItem('redirect_after_login', window.location.pathname);
      
      // Get current locale from URL or default to 'en'
      const pathParts = window.location.pathname.split('/');
      const locale = pathParts[1] && pathParts[1].length === 2 ? pathParts[1] : 'en';
      
      window.location.href = `/${locale}/login`;
    }
  }

  private async request<T>(
    method: string,
    url: string,
    data?: any,
    customHeaders?: Record<string, string>,
    requireAuth: boolean = true
  ): Promise<T> {
    const fullUrl = `${this.baseURL}${url}`;
    
    // Check authentication for protected endpoints
    if (requireAuth && !this.isAuthenticated()) {
      console.log('No access token found, redirecting to login');
      this.redirectToLogin();
      const error = new Error('Authentication required');
      (error as any).status = 401;
      (error as any).isAuthError = true;
      throw error;
    }
    
    // Get access token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    
    console.log(`API Request: ${method} ${fullUrl}`, {
      requireAuth,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 10)}...` : 'none'
    }); // Debug log
    
    const headers = { 
      ...this.headers, 
      ...customHeaders,
      ...(token && { 'Authorization': `Bearer ${token}` })
    };

    const config: RequestInit = {
      method,
      headers,
    };

    if (data && method !== 'GET') {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(fullUrl, config);
      
      if (!response.ok) {
        // Handle authentication errors - redirect to login only once
        if ((response.status === 401 || response.status === 403) && !this.isRedirectingToLogin) {
          // Clear all auth data
          this.clearAuthData();
          
          // Redirect to login
          this.redirectToLogin();
        }
        
        // Try to parse error response body
        let errorData: any = null;
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
          }
        } catch (e) {
          // Ignore JSON parsing errors
        }
        
        // Create a specific error with status code and response data
        const error = new Error(`HTTP error! status: ${response.status}`);
        (error as any).status = response.status;
        (error as any).isAuthError = response.status === 401 || response.status === 403;
        (error as any).response = { data: errorData };
        throw error;
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return {} as T;
    } catch (error) {
      console.error(`API request failed: ${method} ${fullUrl}`, error);
      throw error;
    }
  }

  async get<T>(url: string, headers?: Record<string, string>, requireAuth: boolean = true): Promise<T> {
    return this.request<T>('GET', url, undefined, headers, requireAuth);
  }

  async post<T>(url: string, data?: any, headers?: Record<string, string>, requireAuth: boolean = true): Promise<T> {
    return this.request<T>('POST', url, data, headers, requireAuth);
  }

  async put<T>(url: string, data?: any, headers?: Record<string, string>, requireAuth: boolean = true): Promise<T> {
    return this.request<T>('PUT', url, data, headers, requireAuth);
  }

  async delete<T>(url: string, headers?: Record<string, string>, requireAuth: boolean = true): Promise<T> {
    return this.request<T>('DELETE', url, undefined, headers, requireAuth);
  }

  async patch<T>(url: string, data?: any, headers?: Record<string, string>, requireAuth: boolean = true): Promise<T> {
    return this.request<T>('PATCH', url, data, headers, requireAuth);
  }
}

console.log('NEXT_PUBLIC_API_BASE_URL', process.env.NEXT_PUBLIC_API_BASE_URL);
// Create a default API client instance
export const apiClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8001',
});
