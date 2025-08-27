import candidateApi from './candidateApi';
import { isTokenValid } from './tokenUtils';

interface BookmarkCacheItem {
  isBookmarked: boolean;
  timestamp: number;
}

class BookmarkCacheService {
  private cache = new Map<string, BookmarkCacheItem>();
  private readonly CACHE_DURATION = 30000; // 30 seconds
  private readonly MAX_CACHE_SIZE = 100;
  private pendingRequests = new Map<string, Promise<any>>();

  // Check if cache is valid
  private isValidCache(item: BookmarkCacheItem): boolean {
    return Date.now() - item.timestamp < this.CACHE_DURATION;
  }

  // Clean expired cache entries
  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp >= this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }

  // Limit cache size
  private limitCacheSize(): void {
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries());
      // Remove oldest entries
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      for (let i = 0; i < this.cache.size - this.MAX_CACHE_SIZE; i++) {
        this.cache.delete(entries[i][0]);
      }
    }
  }

  // Get bookmark status with caching and deduplication
  async getBookmarkStatus(jobId: string): Promise<{ isBookmarked: boolean; fromCache: boolean }> {
    if (!jobId) {
      return { isBookmarked: false, fromCache: false };
    }

    // Check authentication first
    const token = localStorage.getItem('token');
    if (!token || !isTokenValid(token)) {
      return { isBookmarked: false, fromCache: false };
    }

    // Check cache first
    const cached = this.cache.get(jobId);
    if (cached && this.isValidCache(cached)) {
      return { isBookmarked: cached.isBookmarked, fromCache: true };
    }

    // Check if request is already pending (deduplication)
    if (this.pendingRequests.has(jobId)) {
      try {
        const result = await this.pendingRequests.get(jobId);
        return { isBookmarked: result.isBookmarked, fromCache: false };
      } catch (error) {
        return { isBookmarked: false, fromCache: false };
      }
    }

    // Make API request
    const requestPromise = this.makeBookmarkRequest(jobId);
    this.pendingRequests.set(jobId, requestPromise);

    try {
      const result = await requestPromise;
      this.pendingRequests.delete(jobId);
      return { isBookmarked: result.isBookmarked, fromCache: false };
    } catch (error) {
      this.pendingRequests.delete(jobId);
      console.error('Failed to get bookmark status:', error);
      return { isBookmarked: false, fromCache: false };
    }
  }

  private async makeBookmarkRequest(jobId: string): Promise<{ isBookmarked: boolean }> {
    try {
      const response = await candidateApi.checkJobBookmarkStatus(jobId);
      if (response.success && response.data) {
        const isBookmarked = response.data.is_bookmarked;
        
        // Cache the result
        this.setCache(jobId, isBookmarked);
        
        return { isBookmarked };
      }
      return { isBookmarked: false };
    } catch (error) {
      throw error;
    }
  }

  // Update cache when bookmark status changes
  setCache(jobId: string, isBookmarked: boolean): void {
    if (!jobId) return;
    
    this.cache.set(jobId, {
      isBookmarked,
      timestamp: Date.now()
    });

    // Clean up cache
    this.cleanExpiredCache();
    this.limitCacheSize();
  }

  // Remove from cache
  removeCache(jobId: string): void {
    this.cache.delete(jobId);
  }

  // Clear all cache
  clearCache(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  // Get cache stats for debugging
  getCacheStats(): { size: number; pendingRequests: number } {
    return {
      size: this.cache.size,
      pendingRequests: this.pendingRequests.size
    };
  }
}

// Export singleton instance
export const bookmarkCache = new BookmarkCacheService();
export default bookmarkCache;
