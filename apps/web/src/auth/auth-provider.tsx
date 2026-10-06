'use client';

import type { AuthUser, LoginInput, RegisterInput } from '@purrfect/contracts';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { BROWSER_BROWSER_API_BASE_URL } from '../lib/api-config';
import { ApiError, type ApiFailure, type ApiSuccess } from '../lib/api-types';

type AuthPayload = {
  user: AuthUser;
  accessToken: string;
};

type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

type RequestOptions = RequestInit & {
  retryAuth?: boolean;
};

type AuthContextValue = {
  status: AuthStatus;
  user: AuthUser | null;
  login(input: LoginInput): Promise<AuthUser>;
  register(input: RegisterInput): Promise<AuthUser>;
  logout(): Promise<void>;
  refreshSession(): Promise<AuthUser | null>;
  request<T>(path: string, options?: RequestOptions): Promise<T>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function readApiResponse<T>(response: Response): Promise<T> {
  const raw = await response.text();
  const parsed = raw ? (JSON.parse(raw) as ApiSuccess<T> | ApiFailure) : null;

  if (!response.ok) {
    const failure: ApiFailure =
      parsed && 'error' in parsed
        ? parsed
        : {
            error: {
              code: 'HTTP_ERROR',
              message: `Request failed with status ${response.status}.`,
            },
          };

    throw new ApiError(response.status, failure);
  }

  if (!parsed) return undefined as T;
  return (parsed as ApiSuccess<T>).data;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const accessTokenRef = useRef<string | null>(null);
  const refreshPromiseRef = useRef<Promise<AuthPayload | null> | null>(null);

  const setAuthenticated = useCallback((payload: AuthPayload) => {
    accessTokenRef.current = payload.accessToken;
    setUser(payload.user);
    setStatus('authenticated');
  }, []);

  const clearAuthentication = useCallback(() => {
    accessTokenRef.current = null;
    setUser(null);
    setStatus('anonymous');
  }, []);

  const performRefresh = useCallback(async (): Promise<AuthPayload | null> => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    const operation = (async () => {
      try {
        const response = await fetch(`${BROWSER_API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            Accept: 'application/json',
          },
        });

        if (response.status === 401) {
          clearAuthentication();
          return null;
        }

        const payload = await readApiResponse<AuthPayload>(response);
        setAuthenticated(payload);
        return payload;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          clearAuthentication();
          return null;
        }

        clearAuthentication();
        throw error;
      } finally {
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = operation;
    return operation;
  }, [clearAuthentication, setAuthenticated]);

  const refreshSession = useCallback(async () => {
    const payload = await performRefresh();
    return payload?.user ?? null;
  }, [performRefresh]);

  useEffect(() => {
    void performRefresh().catch(() => {
      clearAuthentication();
    });
  }, [clearAuthentication, performRefresh]);

  const request = useCallback(
    async <T,>(path: string, options: RequestOptions = {}): Promise<T> => {
      const { retryAuth = true, headers, ...init } = options;
      const makeRequest = async () => {
        const token = accessTokenRef.current;
        const requestHeaders = new Headers(headers);
        if (!requestHeaders.has('Accept')) requestHeaders.set('Accept', 'application/json');
        if (init.body && !requestHeaders.has('Content-Type')) {
          requestHeaders.set('Content-Type', 'application/json');
        }
        if (token) requestHeaders.set('Authorization', `Bearer ${token}`);

        return fetch(`${BROWSER_API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`, {
          ...init,
          credentials: 'include',
          headers: requestHeaders,
        });
      };

      let response = await makeRequest();

      if (response.status === 401 && retryAuth) {
        const refreshed = await performRefresh();

        if (refreshed) {
          response = await makeRequest();
        }
      }

      return readApiResponse<T>(response);
    },
    [performRefresh],
  );

  const login = useCallback(
    async (input: LoginInput) => {
      const response = await fetch(`${BROWSER_API_BASE_URL}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });
      const payload = await readApiResponse<AuthPayload>(response);
      setAuthenticated(payload);
      return payload.user;
    },
    [setAuthenticated],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const response = await fetch(`${BROWSER_API_BASE_URL}/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
      });
      const payload = await readApiResponse<AuthPayload>(response);
      setAuthenticated(payload);
      return payload.user;
    },
    [setAuthenticated],
  );

  const logout = useCallback(async () => {
    try {
      await fetch(`${BROWSER_API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });
    } finally {
      clearAuthentication();
    }
  }, [clearAuthentication]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      login,
      register,
      logout,
      refreshSession,
      request,
    }),
    [status, user, login, register, logout, refreshSession, request],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return context;
}
