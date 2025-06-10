import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Switch, Modal, message, Tag, Input, Form, Select } from 'antd';
import { EditOutlined, DeleteOutlined, UserAddOutlined } from '@ant-design/icons';
import axiosClient from '../../api/axiosClient';
import { useNavigate } from 'react-router-dom';

interface User {
  _id: string;
  fullName: string;
  email: string;
  studentId?: string;
  role: 'admin' | 'student';
  isActive: boolean;
  createdAt: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/api/users');
      if (response.data?.success) {
        setUsers(response.data.data);
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        message.error('Bạn không có quyền truy cập trang này');
        navigate('/');
      } else {
        message.error('Lỗi khi tải danh sách người dùng: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      const response = await axiosClient.put(`/api/users/${userId}/toggle-active`);
      if (response.data?.success) {
        message.success(`${isActive ? 'Kích hoạt' : 'Vô hiệu hóa'} tài khoản thành công`);
        setUsers(prev => prev.map(user => 
          user._id === userId ? { ...user, isActive } : user
        ));
      }
    } catch (error: any) {
      message.error('Lỗi khi thay đổi trạng thái tài khoản: ' + error.message);
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    form.setFieldsValue({
      fullName: user.fullName,
      email: user.email,
      studentId: user.studentId,
      role: user.role
    });
    setEditModalVisible(true);
  };

  const handleEditSubmit = async (values: any) => {
    if (!selectedUser) return;

    try {
      const response = await axiosClient.put(`/api/users/${selectedUser._id}`, values);
      if (response.data?.success) {
        message.success('Cập nhật thông tin người dùng thành công');
        setUsers(prev => prev.map(user => 
          user._id === selectedUser._id ? { ...user, ...values } : user
        ));
        setEditModalVisible(false);
      }
    } catch (error: any) {
      message.error('Lỗi khi cập nhật thông tin: ' + error.message);
    }
  };

  const handleDelete = (userId: string) => {
    Modal.confirm({
      title: 'Xác nhận xóa',
      content: 'Bạn có chắc chắn muốn xóa người dùng này không?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const response = await axiosClient.delete(`/api/users/${userId}`);
          if (response.data?.success) {
            message.success('Xóa người dùng thành công');
            setUsers(prev => prev.filter(user => user._id !== userId));
          }
        } catch (error: any) {
          message.error('Lỗi khi xóa người dùng: ' + error.message);
        }
      }
    });
  };

  const columns = [
    {
      title: 'Họ và tên',
      dataIndex: 'fullName',
      key: 'fullName',
      sorter: (a: User, b: User) => a.fullName.localeCompare(b.fullName)
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: 'MSSV',
      dataIndex: 'studentId',
      key: 'studentId',
      render: (studentId: string) => studentId || '-'
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role === 'admin' ? 'Quản trị viên' : 'Sinh viên'}
        </Tag>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean, record: User) => (
        <Switch
          checked={isActive}
          onChange={(checked) => handleToggleActive(record._id, checked)}
          checkedChildren="Hoạt động"
          unCheckedChildren="Khóa"
        />
      )
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_: any, record: User) => (
        <Space>
          <Button 
            type="primary" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Button 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record._id)}
          >
            Xóa
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
        <Button 
          type="primary" 
          icon={<UserAddOutlined />}
          onClick={() => navigate('/admin/users/create')}
        >
          Thêm người dùng
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="_id"
        loading={loading}
      />

      <Modal
        title="Chỉnh sửa thông tin người dùng"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        onOk={form.submit}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleEditSubmit}
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
          >
            <Input />
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
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement; 