import React from 'react';
import { Form, Input, Button, Card, Select, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

interface CreateUserForm {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  studentId?: string;
  role: 'admin' | 'student';
}

const CreateUser: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const onFinish = async (values: CreateUserForm) => {
    try {
      if (values.password !== values.confirmPassword) {
        message.error('Mật khẩu xác nhận không khớp');
        return;
      }

      const response = await axiosClient.post('/api/users', {
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        studentId: values.studentId,
        role: values.role
      });

      if (response.data?.success) {
        message.success('Tạo người dùng mới thành công');
        navigate('/admin/users');
      }
    } catch (error: any) {
      message.error('Lỗi khi tạo người dùng: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="p-6">
      <Card title="Thêm người dùng mới" className="max-w-2xl mx-auto">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ role: 'student' }}
        >
          <Form.Item
            name="fullName"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="studentId"
            label="MSSV"
            rules={[
              { pattern: /^\d+$/, message: 'MSSV chỉ được chứa số' }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu' },
              { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
            ]}
          >
            <Input.Password />
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
            <Input.Password />
          </Form.Item>

          <Form.Item
            name="role"
            label="Vai trò"
            rules={[{ required: true, message: 'Vui lòng chọn vai trò' }]}
          >
            <Select>
              <Select.Option value="student">Sinh viên</Select.Option>
              <Select.Option value="admin">Quản trị viên</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <div className="flex justify-end gap-4">
              <Button onClick={() => navigate('/admin/users')}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                Tạo người dùng
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateUser; 