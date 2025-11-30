// MaxDate API Client
const API_BASE = '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken() {
    return this.token;
  }

  isAuthenticated() {
    return !!this.token;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const error = new Error(data?.message || 'Произошла ошибка');
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      if (error.status === 401) {
        this.setToken(null);
        if (!window.location.pathname.includes('login') && 
            !window.location.pathname.includes('register')) {
          window.location.href = '/login.html';
        }
      }
      throw error;
    }
  }

  // Auth endpoints
  async register(email, password, acceptTerms, acceptPrivacy) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, acceptTerms, acceptPrivacy }),
    });
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.accessToken) {
      this.setToken(data.accessToken);
    }
    return data;
  }

  async confirmEmail(token) {
    return this.request(`/auth/confirm-email?token=${token}`);
  }

  async requestPasswordReset(email) {
    return this.request('/auth/request-reset', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token, newPassword) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  }

  async changePassword(oldPassword, newPassword) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  }

  // User endpoints
  async getMe() {
    return this.request('/users/me');
  }

  async deactivateAccount() {
    return this.request('/users/me/deactivate', { method: 'DELETE' });
  }

  async deleteAccount() {
    return this.request('/users/me', { method: 'DELETE' });
  }

  // Profile endpoints
  async getMyProfile() {
    return this.request('/profiles/me');
  }

  async createProfile(data) {
    return this.request('/profiles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProfile(data) {
    return this.request('/profiles', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getProfile(profileId) {
    return this.request(`/profiles/${profileId}`);
  }

  async uploadPhoto(file, isMain = false) {
    const formData = new FormData();
    formData.append('photo', file);
    
    const url = `${API_BASE}/profiles/photos${isMain ? '?isMain=true' : ''}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Ошибка загрузки фото');
    }
    return data;
  }

  async deletePhoto(photoId) {
    return this.request(`/profiles/photos/${photoId}`, { method: 'DELETE' });
  }

  async setMainPhoto(photoId) {
    return this.request(`/profiles/photos/${photoId}/main`, { method: 'PUT' });
  }

  // Cities
  async getCities(query = '') {
    return this.request(`/cities${query ? `?q=${encodeURIComponent(query)}` : ''}`);
  }

  // Feed & Likes
  async getFeed(page = 1, limit = 20) {
    return this.request(`/likes/feed?page=${page}&limit=${limit}`);
  }

  async like(userId) {
    return this.request(`/likes/like/${userId}`, { method: 'POST' });
  }

  async dislike(userId) {
    return this.request(`/likes/dislike/${userId}`, { method: 'POST' });
  }

  // Matches
  async getMatches() {
    return this.request('/likes/matches');
  }

  async markMatchAsViewed(matchId) {
    return this.request(`/likes/matches/${matchId}/view`, { method: 'POST' });
  }

  async getUnviewedMatchCount() {
    return this.request('/likes/matches/unviewed-count');
  }

  logout() {
    this.setToken(null);
    window.location.href = '/login.html';
  }
}

// Global API instance
const api = new ApiClient();

