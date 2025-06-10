import { Form, Input, Button, Typography, Divider, message, Select } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';
import axiosClient from '../api/axiosClient';
import Logo from '../assets/logo.svg';
import '../styles/auth.css';
import { AxiosError } from 'axios';

const { Title, Text } = Typography;
const { Option } = Select;

interface RegisterForm {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  studentId: string;
  phone: string;
  faculty: string;
  class: string;
}

interface RegisterResponse {
  success: boolean;
  message: string;
  data?: {
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

const Register = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form] = Form.useForm();

  const onFinish = async (values: RegisterForm) => {
    try {
      // Validate password match
      if (values.password !== values.confirmPassword) {
        message.error('Mật khẩu xác nhận không khớp');
        return;
      }

      // Format dữ liệu đăng ký
      const registerData = {
        fullName: values.fullName.trim(),
        email: values.email.toLowerCase().trim(),
        password: values.password,
        studentId: values.studentId?.trim(),
        phone: values.phone?.trim(),
        faculty: values.faculty?.trim(),
        class: values.class?.trim()
      };

      console.log('Sending register data:', registerData);

      const response = await axiosClient.post<RegisterResponse>('/api/auth/register', registerData);
      
      console.log('Register response:', response.data);
      
      if (response.data?.success && response.data.data?.user && response.data.data?.token) {
        message.success('Đăng ký thành công!');
        dispatch(setCredentials({
          user: response.data.data.user,
          token: response.data.data.token
        }));
        navigate('/student/dashboard', { replace: true });
      }

    } catch (error: any) {
      console.error('Register error:', error);
      message.error(error.response?.data?.message || 'Đăng ký thất bại');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <img src={Logo} alt="Logo" className="auth-logo" />
          <Title level={2}>Đăng ký tài khoản</Title>
          <Text type="secondary">Đăng ký tài khoản để mượn thiết bị</Text>
        </div>

        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          layout="vertical"
          requiredMark={false}
        >
          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[
              { required: true, message: 'Vui lòng nhập họ tên' },
              { min: 2, message: 'Họ tên phải có ít nhất 2 ký tự' }
            ]}
          >
            <Input placeholder="Nhập họ và tên" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' }
            ]}
          >
            <Input placeholder="Nhập email" />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Xác nhận mật khẩu"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Xác nhận mật khẩu" />
          </Form.Item>

          <Form.Item
            name="studentId"
            label="Mã sinh viên"
            rules={[
              { required: true, message: 'Vui lòng nhập mã sinh viên' },
              { pattern: /^\d+$/, message: 'Mã sinh viên chỉ được chứa số' },
              { min: 3, message: 'Mã sinh viên phải có ít nhất 3 ký tự' }
            ]}
          >
            <Input placeholder="Nhập mã sinh viên" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[
              { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ' }
            ]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item
            name="faculty"
            label="Khoa"
            rules={[
              { required: true, message: 'Vui lòng nhập tên khoa' },
              { min: 2, message: 'Tên khoa phải có ít nhất 2 ký tự' }
            ]}
          >
            <Input placeholder="Nhập tên khoa" />
          </Form.Item>

          <Form.Item
            name="class"
            label="Lớp"
            rules={[
              { required: true, message: 'Vui lòng nhập tên lớp' },
              { min: 2, message: 'Tên lớp phải có ít nhất 2 ký tự' }
            ]}
          >
            <Input placeholder="Nhập tên lớp" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Đăng ký
            </Button>
          </Form.Item>

          <Divider>Hoặc</Divider>

          <div className="auth-links">
            <Text>Đã có tài khoản?</Text>
            <Link to="/login">Đăng nhập</Link>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default Register; 