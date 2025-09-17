import { useState, useEffect, useCallback } from 'react';
import { handleApiError } from './apiIntegration';

// Generic API Hook
export const useApi = <T>(apiCall: () => Promise<T>, dependencies: any[] = []) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall();
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    execute();
  }, dependencies);

  const refresh = useCallback(() => {
    return execute();
  }, [execute]);

  return { data, loading, error, refresh, execute };
};

// Mutation Hook (for POST, PUT, DELETE operations)
export const useMutation = <T, P = any>(apiCall: (params: P) => Promise<T>) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const mutate = useCallback(async (params: P) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCall(params);
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { mutate, loading, error, data, reset };
};

// Pagination Hook
export const usePagination = (initialPage = 1, initialLimit = 10) => {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);

  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  const nextPage = useCallback(() => {
    if (hasNext) setPage(p => p + 1);
  }, [hasNext]);

  const prevPage = useCallback(() => {
    if (hasPrev) setPage(p => p - 1);
  }, [hasPrev]);

  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  }, [totalPages]);

  const reset = useCallback(() => {
    setPage(initialPage);
    setLimit(initialLimit);
    setTotal(0);
  }, [initialPage, initialLimit]);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
    setPage,
    setLimit,
    setTotal,
    nextPage,
    prevPage,
    goToPage,
    reset
  };
};

// Search Hook with debouncing
export const useSearch = <T>(
  searchFunction: (query: string, filters?: any) => Promise<T>,
  debounceDelay = 300
) => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<any>({});
  const [results, setResults] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search effect
  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const searchResults = await searchFunction(query, filters);
        setResults(searchResults);
      } catch (err) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }, debounceDelay);

    return () => clearTimeout(timeoutId);
  }, [query, filters, searchFunction, debounceDelay]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults(null);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    filters,
    setFilters,
    results,
    loading,
    error,
    clearSearch
  };
};

// WebSocket Hook (for real-time features)
export const useWebSocket = (url: string, options?: {
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
}) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = (event) => {
      setIsConnected(true);
      setError(null);
      options?.onOpen?.(event);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        options?.onMessage?.(data);
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onerror = (event) => {
      setError('WebSocket connection error');
      options?.onError?.(event);
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      options?.onClose?.(event);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [url]);

  const sendMessage = useCallback((message: any) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(message));
    }
  }, [socket, isConnected]);

  return { socket, isConnected, error, sendMessage };
};

// Local Storage Hook
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
};

// Interval Hook
export const useInterval = (callback: () => void, delay: number | null) => {
  useEffect(() => {
    if (delay === null) return;

    const id = setInterval(callback, delay);
    return () => clearInterval(id);
  }, [callback, delay]);
};

// File Upload Hook
export const useFileUpload = (uploadFunction: (file: File) => Promise<any>) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<any>(null);

  const upload = useCallback(async (file: File) => {
    try {
      setUploading(true);
      setError(null);
      setProgress(0);

      // Simulate progress (you can replace this with actual progress tracking)
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 100);

      const result = await uploadFunction(file);
      
      clearInterval(progressInterval);
      setProgress(100);
      setUploadedFile(result);
      
      return result;
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [uploadFunction]);

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
    setUploadedFile(null);
  }, []);

  return { upload, uploading, progress, error, uploadedFile, reset };
};

export default {
  useApi,
  useMutation,
  usePagination,
  useSearch,
  useWebSocket,
  useLocalStorage,
  useInterval,
  useFileUpload
}; 