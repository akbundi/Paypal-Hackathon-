/**
 * Authentication API Module.
 * 
 * BACKEND STATUS: [TODO: Pending backend implementation]
 * Expected contracts derived from reference-tests/auth-payments/test_auth.py.
 */

import { http, authStorage } from './http';
import { API_ENDPOINTS } from './endpoints';
import {
  LoginRequest,
  SignupRequest,
  AuthResponse,
  UserProfile,
  RefreshTokenRequest,
} from '../../types/api.types';

export const authApi = {
  /**
   * Authenticate user with email and password.
   * On success, stores JWT token in authStorage for subsequent requests.
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await http.post<AuthResponse>(
      API_ENDPOINTS.AUTH.LOGIN,
      credentials,
      { skipAuth: true }
    );
    if (response?.accessToken) {
      authStorage.setToken(response.accessToken);
    }
    return response;
  },

  /**
   * Register a new user and organization.
   */
  async signup(data: SignupRequest): Promise<AuthResponse> {
    const response = await http.post<AuthResponse>(
      API_ENDPOINTS.AUTH.REGISTER,
      data,
      { skipAuth: true }
    );
    if (response?.accessToken) {
      authStorage.setToken(response.accessToken);
    }
    return response;
  },

  /**
   * Log out the current user session and revoke token.
   */
  async logout(): Promise<void> {
    try {
      await http.post(API_ENDPOINTS.AUTH.LOGOUT);
    } finally {
      authStorage.clearToken();
    }
  },

  /**
   * Fetch currently authenticated user profile.
   */
  async getCurrentUser(): Promise<UserProfile> {
    return http.get<UserProfile>(API_ENDPOINTS.AUTH.ME);
  },

  /**
   * Rotate refresh token to obtain a fresh access token.
   */
  async refreshToken(payload: RefreshTokenRequest): Promise<AuthResponse> {
    const response = await http.post<AuthResponse>(
      API_ENDPOINTS.AUTH.REFRESH,
      payload,
      { skipAuth: true }
    );
    if (response?.accessToken) {
      authStorage.setToken(response.accessToken);
    }
    return response;
  },
};
