interface ApiClientConfig {
  baseURL?: string;
  headers?: Record<string, string>;
}

class ApiClient {
  private baseURL: string;
  private headers: Record<string, string>;

  constructor(config: ApiClientConfig = {}) {
    this.baseURL = config.baseURL || '';
    this.headers = {
      'Content-Type': 'application/json',
      ...config.headers,
    };
  }

  private async request<T>(
    method: string,
    url: string,
    data?: any,
    customHeaders?: Record<string, string>
  ): Promise<T> {
    const fullUrl = `${this.baseURL}${url}`;
    const headers = { ...this.headers, ...customHeaders };

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
        throw new Error(`HTTP error! status: ${response.status}`);
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

  async get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('GET', url, undefined, headers);
  }

  async post<T>(url: string, data?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('POST', url, data, headers);
  }

  async put<T>(url: string, data?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('PUT', url, data, headers);
  }

  async delete<T>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('DELETE', url, undefined, headers);
  }

  async patch<T>(url: string, data?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>('PATCH', url, data, headers);
  }
}

// Create a default API client instance
export const apiClient = new ApiClient({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
});
