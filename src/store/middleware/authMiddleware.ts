import { createListenerMiddleware } from '@reduxjs/toolkit';
import { setCredentials, logout } from '../slices/authSlice';
import axiosClient from '../../api/axiosClient';
import { message } from 'antd';

const listenerMiddleware = createListenerMiddleware();

// Biến để theo dõi trạng thái kiểm tra token
let isCheckingToken = false;

// Kiểm tra token khi ứng dụng khởi động
listenerMiddleware.startListening({
  actionCreator: setCredentials,
  effect: async (action, listenerApi) => {
    // Nếu đang kiểm tra token, bỏ qua
    if (isCheckingToken) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        listenerApi.dispatch(logout());
        return;
      }

      isCheckingToken = true;
      
      // Gọi API để lấy thông tin user
      const response = await axiosClient.get('/api/auth/profile');

      if (response.data.data) {
        listenerApi.dispatch(setCredentials({
          user: response.data.data,
          token
        }));
      } else {
        message.error('Phiên đăng nhập không hợp lệ');
        listenerApi.dispatch(logout());
      }
    } catch (error: any) {
      console.error('Error verifying token:', error);
      
      // Xử lý lỗi rate limit
      if (error.response?.status === 429) {
        message.error('Hệ thống đang tải. Vui lòng thử lại sau giây lát.');
        // Thử lại sau 2 giây
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        return;
      }

      message.error('Phiên đăng nhập đã hết hạn');
      listenerApi.dispatch(logout());
    } finally {
      isCheckingToken = false;
    }
  }
});

export default listenerMiddleware; 