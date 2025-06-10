import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Add a request interceptor
axiosClient.interceptors.request.use(
  (config) => {
    // Log request details
    console.log('🚀 Request:', {
      method: config.method,
      url: config.url,
      data: config.data,
      headers: config.headers
    });
    
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosClient.interceptors.response.use(
  (response) => {
    // Log successful response
    console.log('✅ Response:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    if (error.response) {
      // Log detailed error
      console.error('❌ API Error:', {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
        requestData: error.config.data
      });

      // Handle 401 error
      if (error.response.status === 401) {
        localStorage.removeItem('token'); // Clear invalid token
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('❌ No Response Error:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('❌ Request Setup Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosClient; 