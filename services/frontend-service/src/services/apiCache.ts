// Simple in-memory cache service to reduce API calls
class ApiCache {
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

  // Cache data with TTL (time to live in milliseconds)
  set(key: string, data: any, ttl: number = 60000): void { // Default 1 minute TTL
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Get cached data if not expired
  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  // Clear specific cache entry
  delete(key: string): void {
    this.cache.delete(key);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
  }

  // Generate cache key from parameters
  generateKey(endpoint: string, params?: any): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${endpoint}:${paramString}`;
  }

  // Clear expired entries (cleanup)
  cleanup(): void {
    const now = Date.now();
    for (const [key, cached] of this.cache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Clear job-related cache (for when jobs are created/updated/deleted)
  clearJobCache(): void {
    for (const key of this.cache.keys()) {
      if (key.includes('getAllJobs') || key.includes('getLatestJobs') || 
          key.includes('getFeaturedJobs') || key.includes('searchJobs')) {
        this.cache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const apiCache = new ApiCache();

// Auto cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    apiCache.cleanup();
  }, 5 * 60 * 1000);
}

export default apiCache;
