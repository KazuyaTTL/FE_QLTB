import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'student';
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

// Khôi phục thông tin user từ localStorage
const storedToken = localStorage.getItem('token');
const storedUser = localStorage.getItem('user');
let initialUser = null;

try {
  if (storedUser) {
    const parsedUser = JSON.parse(storedUser);
    // Validate user data
    if (parsedUser && 
        parsedUser._id && 
        parsedUser.fullName && 
        parsedUser.email && 
        (parsedUser.role === 'admin' || parsedUser.role === 'student')) {
      initialUser = parsedUser;
      console.log('Khôi phục user từ localStorage:', {
        id: initialUser._id,
        fullName: initialUser.fullName,
        email: initialUser.email,
        role: initialUser.role
      });
    } else {
      console.error('Invalid user data in localStorage:', parsedUser);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  }
} catch (error) {
  console.error('Error parsing stored user:', error);
  // Xóa dữ liệu không hợp lệ
  localStorage.removeItem('user');
  localStorage.removeItem('token');
}

const initialState: AuthState = {
  isAuthenticated: !!storedToken && !!initialUser,
  user: initialUser,
  token: storedToken,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; token: string }>
    ) => {
      const { user, token } = action.payload;
      
      // Validate user data before setting
      if (!user || !user.role || (user.role !== 'admin' && user.role !== 'student')) {
        console.error('Invalid user data in setCredentials:', user);
        return;
      }

      state.user = user;
      state.token = token;
      state.isAuthenticated = true;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      console.log('Updated auth state:', {
        isAuthenticated: true,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role
        }
      });
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log('User logged out, auth state cleared');
    },
  },
});

// Selectors
export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectUserRole = (state: { auth: AuthState }) => state.auth.user?.role;

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer; 
 
 