import { store } from '../store';
import { setCredentials, logout } from '../store/slices/authSlice';
import axiosClient from '../api/axiosClient';
import { message } from 'antd';

export const checkAuth = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      store.dispatch(logout());
      return;
    }

    // Gọi API để lấy thông tin user
    const response = await axiosClient.get('/api/auth/profile');

    if (response.data.data) {
      store.dispatch(setCredentials({
        user: response.data.data,
        token
      }));
    } else {
      message.error('Phiên đăng nhập không hợp lệ');
      store.dispatch(logout());
    }
  } catch (error: any) {
    console.error('Error verifying token:', error);
    
    if (error.response?.status === 429) {
      message.error('Hệ thống đang tải. Vui lòng thử lại sau giây lát.');
    } else {
      message.error('Phiên đăng nhập đã hết hạn');
      store.dispatch(logout());
    }
  }
}; 