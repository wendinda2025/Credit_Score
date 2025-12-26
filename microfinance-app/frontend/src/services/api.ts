import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs et le refresh token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Si erreur 401 et pas encore retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          useAuthStore.getState().setTokens(accessToken, newRefreshToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Types génériques
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  path: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    totalItems: number;
    itemCount: number;
    itemsPerPage: number;
    totalPages: number;
    currentPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Services Auth
export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post<ApiResponse<any>>('/auth/login', { email, password });
    return response.data.data;
  },

  refresh: async (refreshToken: string) => {
    const response = await api.post<ApiResponse<any>>('/auth/refresh', { refreshToken });
    return response.data.data;
  },

  logout: async (refreshToken?: string) => {
    await api.post('/auth/logout', { refreshToken });
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    await api.post('/auth/change-password', { currentPassword, newPassword });
  },

  getMe: async () => {
    const response = await api.get<ApiResponse<any>>('/auth/me');
    return response.data.data;
  },
};

// Services Clients
export const clientsService = {
  getAll: async (params?: any) => {
    const response = await api.get<ApiResponse<PaginatedResponse<any>>>('/clients', { params });
    return response.data.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<any>>(`/clients/${id}`);
    return response.data.data;
  },

  create: async (data: any) => {
    const response = await api.post<ApiResponse<any>>('/clients', data);
    return response.data.data;
  },

  update: async (id: string, data: any) => {
    const response = await api.patch<ApiResponse<any>>(`/clients/${id}`, data);
    return response.data.data;
  },

  changeStatus: async (id: string, status: string, reason?: string) => {
    const response = await api.patch<ApiResponse<any>>(`/clients/${id}/status`, { status, reason });
    return response.data.data;
  },
};

// Services Prêts
export const loansService = {
  getProducts: async () => {
    const response = await api.get<ApiResponse<any[]>>('/loans/products');
    return response.data.data;
  },

  getAll: async (params?: any) => {
    const response = await api.get<ApiResponse<PaginatedResponse<any>>>('/loans', { params });
    return response.data.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<any>>(`/loans/${id}`);
    return response.data.data;
  },

  create: async (data: any) => {
    const response = await api.post<ApiResponse<any>>('/loans', data);
    return response.data.data;
  },

  previewSchedule: async (data: any) => {
    const response = await api.post<ApiResponse<any>>('/loans/preview-schedule', data);
    return response.data.data;
  },

  approve: async (id: string, data?: any) => {
    const response = await api.post<ApiResponse<any>>(`/loans/${id}/approve`, data || {});
    return response.data.data;
  },

  reject: async (id: string, reason: string) => {
    const response = await api.post<ApiResponse<any>>(`/loans/${id}/reject`, { rejectionReason: reason });
    return response.data.data;
  },

  disburse: async (id: string, data: any) => {
    const response = await api.post<ApiResponse<any>>(`/loans/${id}/disburse`, data);
    return response.data.data;
  },

  makeRepayment: async (id: string, data: any) => {
    const response = await api.post<ApiResponse<any>>(`/loans/${id}/repayment`, data);
    return response.data.data;
  },
};

// Services Épargne
export const savingsService = {
  getProducts: async () => {
    const response = await api.get<ApiResponse<any[]>>('/savings/products');
    return response.data.data;
  },

  getAll: async (params?: any) => {
    const response = await api.get<ApiResponse<PaginatedResponse<any>>>('/savings/accounts', { params });
    return response.data.data;
  },

  getById: async (id: string) => {
    const response = await api.get<ApiResponse<any>>(`/savings/accounts/${id}`);
    return response.data.data;
  },

  create: async (data: any) => {
    const response = await api.post<ApiResponse<any>>('/savings/accounts', data);
    return response.data.data;
  },

  deposit: async (id: string, data: any) => {
    const response = await api.post<ApiResponse<any>>(`/savings/accounts/${id}/deposit`, data);
    return response.data.data;
  },

  withdraw: async (id: string, data: any) => {
    const response = await api.post<ApiResponse<any>>(`/savings/accounts/${id}/withdraw`, data);
    return response.data.data;
  },
};

// Services Rapports
export const reportsService = {
  getDashboard: async (branchId?: string) => {
    const response = await api.get<ApiResponse<any>>('/reports/dashboard', {
      params: branchId ? { branchId } : undefined,
    });
    return response.data.data;
  },

  getPAR: async (asOfDate: string, branchId?: string) => {
    const response = await api.get<ApiResponse<any>>('/reports/par', {
      params: { asOfDate, branchId },
    });
    return response.data.data;
  },

  getLoanProduction: async (fromDate: string, toDate: string, branchId?: string) => {
    const response = await api.get<ApiResponse<any>>('/reports/loan-production', {
      params: { fromDate, toDate, branchId },
    });
    return response.data.data;
  },
};

// Services Organisation
export const organizationService = {
  getBranches: async () => {
    const response = await api.get<ApiResponse<any[]>>('/organizations/branches');
    return response.data.data;
  },

  getPaymentTypes: async () => {
    const response = await api.get<ApiResponse<any[]>>('/organizations/payment-types');
    return response.data.data;
  },
};

export default api;
