// API Service Layer
const API_BASE = '/api';

const api = {
  // Generic fetch wrapper
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'An error occurred');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Dashboard
  async getDashboard() {
    return this.request('/dashboard');
  },

  // Students
  students: {
    async getAll(params = {}) {
      const query = new URLSearchParams(params).toString();
      return api.request(`/students${query ? `?${query}` : ''}`);
    },

    async getById(id) {
      return api.request(`/students/${id}`);
    },

    async create(data) {
      return api.request('/students', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    async update(id, data) {
      return api.request(`/students/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    async delete(id) {
      return api.request(`/students/${id}`, {
        method: 'DELETE'
      });
    },

    async getStats() {
      return api.request('/students/stats');
    }
  },

  // Batches
  batches: {
    async getAll() {
      return api.request('/batches');
    },

    async getById(id) {
      return api.request(`/batches/${id}`);
    },

    async create(data) {
      return api.request('/batches', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    async update(id, data) {
      return api.request(`/batches/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    async delete(id) {
      return api.request(`/batches/${id}`, {
        method: 'DELETE'
      });
    }
  },

  // Fees
  fees: {
    async getAll(params = {}) {
      const query = new URLSearchParams(params).toString();
      return api.request(`/fees${query ? `?${query}` : ''}`);
    },

    async getById(id) {
      return api.request(`/fees/${id}`);
    },

    async getByStudent(studentId) {
      return api.request(`/fees/student/${studentId}`);
    },

    async create(data) {
      return api.request('/fees', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    async update(id, data) {
      return api.request(`/fees/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    async recordPayment(id, data) {
      return api.request(`/fees/${id}/payment`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    async delete(id) {
      return api.request(`/fees/${id}`, {
        method: 'DELETE'
      });
    },

    async getStats() {
      return api.request('/fees/stats');
    },

    async getOverdue() {
      return api.request('/fees/overdue');
    }
  },

  // Attendance
  attendance: {
    async getAll(params = {}) {
      const query = new URLSearchParams(params).toString();
      return api.request(`/attendance${query ? `?${query}` : ''}`);
    },

    async getBatchAttendance(batchId, date) {
      return api.request(`/attendance/batch/${batchId}/date/${date}`);
    },

    async markAttendance(data) {
      return api.request('/attendance', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    async update(id, data) {
      return api.request(`/attendance/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    async getStudentStats(studentId, params = {}) {
      const query = new URLSearchParams(params).toString();
      return api.request(`/attendance/student/${studentId}/stats${query ? `?${query}` : ''}`);
    }
  },

  // Export
  async exportData(type) {
    return this.request(`/export/${type}`);
  }
};
