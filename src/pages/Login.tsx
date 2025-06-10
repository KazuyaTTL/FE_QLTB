import { Form, Input, Button, Typography, Divider, App } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';
import axios from 'axios';
import axiosClient from '../api/axiosClient';
import Logo from '../assets/logo.svg';
import '../styles/auth.css';

const { Title, Text } = Typography;

interface LoginForm {
  email: string;
  password: string;
}

interface User {
  _id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'student';
}

interface LoginResponse {
  status: 'success' | 'error';
  message: string;
  data: {
    user: {
      _id: string;
      fullName: string;
      email: string;
      role: 'admin' | 'student';
      studentId?: string;
      phone?: string;
      faculty?: string;
      class?: string;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    };
    token: string;
  };
}

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const { message: messageApi } = App.useApp();

  const onFinish = async (values: LoginForm) => {
    try {
      console.log('Đang gửi request đăng nhập với:', values);
      
      const response = await axiosClient.post<LoginResponse>('/api/auth/login', values);
      console.log('Response từ server:', response.data);
      
      if (response.data.status === 'success' && response.data.data?.user && response.data.data?.token) {
        const { user, token } = response.data.data;
        
        // Log thông tin user để debug
        console.log('User info:', {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role
        });

        // Kiểm tra role
        if (!user.role || (user.role !== 'admin' && user.role !== 'student')) {
          throw new Error('Invalid user role');
        }
        
        // Lưu thông tin user và token
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Cập nhật Redux store
        dispatch(setCredentials({ user, token }));
        
        // Show success message
        messageApi.success('Đăng nhập thành công!');
        
        // Chuyển hướng dựa trên role
        const redirectPath = user.role === 'admin' ? '/admin' : '/student/dashboard';
        console.log('Chuyển hướng đến:', redirectPath, 'với role:', user.role);
        
        // Chuyển hướng ngay lập tức
        navigate(redirectPath, { replace: true });
      } else {
        throw new Error(response.data.message || 'Đăng nhập thất bại');
      }
      
    } catch (error) {
      console.error('Login error:', error);
      
      // Hiển thị thông báo lỗi chi tiết nếu có
      if (axios.isAxiosError(error)) {
        // Xử lý lỗi rate limiting
        if (error.response?.status === 429) {
          const errorMessage = error.response?.data?.error || 'Quá nhiều yêu cầu đăng nhập. Vui lòng đợi 1 phút và thử lại.';
          messageApi.error({
            content: errorMessage,
            duration: 5,
            style: {
              marginTop: '20vh',
            },
          });
          
          // Disable nút đăng nhập trong 1 phút
          form.setFields([
            {
              name: 'submit',
              value: undefined,
            }
          ]);
          
          // Enable lại nút sau 1 phút
          setTimeout(() => {
            form.setFields([
              {
                name: 'submit',
                value: undefined,
                errors: [],
              }
            ]);
            messageApi.info('Bạn có thể thử đăng nhập lại.');
          }, 60000);
          
          return;
        }
        
        console.error('Error response:', error.response?.data);
        const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra khi đăng nhập';
        messageApi.error(errorMessage);
        
        // Reset password field only if it's an authentication error
        if (error.response?.status === 401) {
          form.setFields([
            {
              name: 'password',
              errors: ['Email hoặc mật khẩu không đúng!']
            }
          ]);
        }
      } else {
        messageApi.error('Có lỗi xảy ra khi đăng nhập. Vui lòng thử lại!');
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-background"></div>
      
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <img src={Logo} alt="Logo" className="auth-logo" />
            <Title level={3} className="auth-title">Hi there! Welcome back</Title>
            <Text className="auth-subtitle">
              Log in to QLTB with your email address
            </Text>
          </div>

          <Form
            form={form}
            name="login"
            onFinish={onFinish}
            layout="vertical"
            requiredMark={false}
            className="auth-form"
            initialValues={{
              email: 'admin@equipment.com',
              password: 'admin123456'
            }}
          >
            <Form.Item
              name="email"
              label="Email address"
              rules={[
                { required: true, message: 'Please enter your email!' },
                { type: 'email', message: 'Invalid email format!' }
              ]}
            >
              <Input 
                placeholder="Enter your email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please enter your password!' }]}
            >
              <Input.Password
                placeholder="Enter your password"
              />
            </Form.Item>

            <Form.Item className="mb-4">
              <Button
                type="primary"
                htmlType="submit"
                block
                name="submit"
              >
                Log in with password
              </Button>
            </Form.Item>

            <Divider className="!my-4">Login with</Divider>

            <Button
              block
              className="mb-6"
            >
              S-Link
            </Button>

            <div className="auth-links">
              By continuing, I agree to QLTB's{' '}
              <Link to="/privacy">Privacy Policy</Link>
              {' '}and{' '}
              <Link to="/terms">Terms of Use</Link>
            </div>
          </Form>

          <Divider className="!my-4" />
          
          <div className="auth-links">
            Don't have an account?{' '}
            <Link to="/register">Sign up for free</Link>
          </div>
        </div>

        <div className="auth-footer">
          qltb.com · <Link to="/support">contact support</Link>
        </div>
      </div>
    </div>
  );
};

export default Login; 