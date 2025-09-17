// Favorites Service - Manages favorites using localStorage
export interface FavoriteJob {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  tags: string[];
  logo: string;
  logoColor: string;
  description?: string;
  applied?: number;
  capacity?: number;
  salary?: string;
  match?: number;
  savedAt: string; // ISO date string when job was saved
}

class FavoritesService {
  private readonly STORAGE_KEY = 'favoriteJobs';

  // Get all favorite jobs from localStorage
  getFavoriteJobs(): FavoriteJob[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading favorites from localStorage:', error);
      return [];
    }
  }

  // Add a job to favorites
  addToFavorites(job: Omit<FavoriteJob, 'savedAt'>): boolean {
    try {
      const favorites = this.getFavoriteJobs();
      
      // Check if job is already in favorites
      if (favorites.some(fav => fav.id === job.id)) {
        return false; // Already exists
      }

      const newFavorite: FavoriteJob = {
        ...job,
        savedAt: new Date().toISOString()
      };

      favorites.push(newFavorite);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
      return true;
    } catch (error) {
      console.error('Error adding job to favorites:', error);
      return false;
    }
  }

  // Remove a job from favorites
  removeFromFavorites(jobId: number): boolean {
    try {
      const favorites = this.getFavoriteJobs();
      const filteredFavorites = favorites.filter(job => job.id !== jobId);
      
      if (filteredFavorites.length === favorites.length) {
        return false; // Job was not in favorites
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredFavorites));
      return true;
    } catch (error) {
      console.error('Error removing job from favorites:', error);
      return false;
    }
  }

  // Check if a job is in favorites
  isJobFavorited(jobId: number): boolean {
    const favorites = this.getFavoriteJobs();
    return favorites.some(job => job.id === jobId);
  }

  // Toggle favorite status
  toggleFavorite(job: Omit<FavoriteJob, 'savedAt'>): boolean {
    if (this.isJobFavorited(job.id)) {
      return this.removeFromFavorites(job.id);
    } else {
      return this.addToFavorites(job);
    }
  }

  // Get favorites count
  getFavoritesCount(): number {
    return this.getFavoriteJobs().length;
  }

  // Clear all favorites
  clearAllFavorites(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing favorites:', error);
    }
  }

  // Search favorites
  searchFavorites(query: string): FavoriteJob[] {
    const favorites = this.getFavoriteJobs();
    if (!query.trim()) return favorites;

    const searchTerm = query.toLowerCase();
    return favorites.filter(job => 
      job.title.toLowerCase().includes(searchTerm) ||
      job.company.toLowerCase().includes(searchTerm) ||
      job.location.toLowerCase().includes(searchTerm) ||
      job.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  // Get favorites by filter
  getFilteredFavorites(filters: {
    employmentType?: string[];
    categories?: string[];
    location?: string;
  }): FavoriteJob[] {
    let favorites = this.getFavoriteJobs();

    if (filters.employmentType && filters.employmentType.length > 0) {
      favorites = favorites.filter(job => 
        filters.employmentType!.includes(job.type)
      );
    }

    if (filters.categories && filters.categories.length > 0) {
      favorites = favorites.filter(job =>
        job.tags.some(tag => filters.categories!.includes(tag))
      );
    }

    if (filters.location) {
      const locationFilter = filters.location.toLowerCase();
      favorites = favorites.filter(job =>
        job.location.toLowerCase().includes(locationFilter)
      );
    }

    return favorites;
  }

  // Sort favorites
  sortFavorites(favorites: FavoriteJob[], sortBy: 'newest' | 'oldest' | 'title' | 'company'): FavoriteJob[] {
    return [...favorites].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
        case 'oldest':
          return new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'company':
          return a.company.localeCompare(b.company);
        default:
          return 0;
      }
    });
  }
}

// Export singleton instance
export const favoritesService = new FavoritesService();
export default favoritesService;
