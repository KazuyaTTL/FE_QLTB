import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Switch,
  InputNumber,
  Typography,
  Row,
  Col,
  message,
  Space,
  Modal,
  Table,
  Tag,
  Popconfirm
} from 'antd';
import {
  SettingOutlined,
  SafetyOutlined,
  MailOutlined,
  DatabaseOutlined,
  UserOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import axiosClient from '../../api/axiosClient';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface SystemSettings {
  _id?: string;
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  maxBorrowDays: number;
  maxBorrowQuantity: number;
  enableNotifications: boolean;
  enableAutoReminders: boolean;
  reminderDaysBefore: number;
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

const Settings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/api/settings');
      if (response.data?.success) {
        const settingsData = response.data.data;
        setSettings(settingsData);
        form.setFieldsValue(settingsData);
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      message.error('Không thể tải cài đặt hệ thống');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: SystemSettings) => {
    try {
      setLoading(true);
      const response = await axiosClient.put('/api/settings', values);
      
      if (response.data?.success) {
        setSettings(response.data.data);
        message.success('Cập nhật cài đặt hệ thống thành công!');
      } else {
        throw new Error(response.data?.message || 'Failed to update settings');
      }
    } catch (error: any) {
      console.error('Error updating settings:', error);
      message.error('Không thể cập nhật cài đặt: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    try {
      const response = await axiosClient.get('/api/settings/backup');
      if (response.data?.success) {
        // Tạo file download
        const dataStr = JSON.stringify(response.data.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `settings-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        message.success('Đã xuất backup cài đặt thành công!');
      }
    } catch (error: any) {
      console.error('Error backing up settings:', error);
      message.error('Không thể backup cài đặt');
    }
  };

  const handleReset = () => {
    Modal.confirm({
      title: 'Reset cài đặt hệ thống',
      icon: <ExclamationCircleOutlined />,
      content: 'Bạn có chắc chắn muốn reset tất cả cài đặt về mặc định?',
      okText: 'Reset',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const response = await axiosClient.post('/api/settings/reset');
          if (response.data?.success) {
            setSettings(response.data.data);
            form.setFieldsValue(response.data.data);
            message.success('Đã reset cài đặt về mặc định');
          }
        } catch (error: any) {
          message.error('Không thể reset cài đặt');
        }
      }
    });
  };

  return (
    <div className="p-6">
      <Title level={2}>
        <SettingOutlined /> Cài đặt hệ thống
      </Title>

      <Row gutter={[24, 24]}>
        {/* Cài đặt chung */}
        <Col xs={24} lg={12}>
          <Card title={<><SettingOutlined /> Cài đặt chung</>} className="h-full">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
            >
              <Form.Item
                label="Tên hệ thống"
                name="siteName"
                rules={[{ required: true, message: 'Vui lòng nhập tên hệ thống!' }]}
              >
                <Input />
              </Form.Item>

              <Form.Item
                label="Mô tả hệ thống"
                name="siteDescription"
              >
                <TextArea rows={3} />
              </Form.Item>

              <Form.Item
                label="Email liên hệ"
                name="contactEmail"
                rules={[
                  { required: true, message: 'Vui lòng nhập email!' },
                  { type: 'email', message: 'Email không hợp lệ!' }
                ]}
              >
                <Input prefix={<MailOutlined />} />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Số ngày mượn tối đa"
                    name="maxBorrowDays"
                    rules={[{ required: true, message: 'Vui lòng nhập số ngày!' }]}
                  >
                    <InputNumber min={1} max={365} className="w-full" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Số lượng mượn tối đa"
                    name="maxBorrowQuantity"
                    rules={[{ required: true, message: 'Vui lòng nhập số lượng!' }]}
                  >
                    <InputNumber min={1} max={50} className="w-full" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Kích hoạt thông báo"
                name="enableNotifications"
                valuePropName="checked"
              >
                <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
              </Form.Item>

              <Form.Item
                label="Nhắc nhở tự động"
                name="enableAutoReminders"
                valuePropName="checked"
              >
                <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
              </Form.Item>

              <Form.Item
                label="Nhắc nhở trước (ngày)"
                name="reminderDaysBefore"
                rules={[{ required: true, message: 'Vui lòng nhập số ngày!' }]}
              >
                <InputNumber min={1} max={30} className="w-full" />
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block>
                  Lưu cài đặt
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Bảo trì hệ thống */}
        <Col xs={24} lg={12}>
          <Card title={<><SafetyOutlined /> Bảo trì hệ thống</>} className="h-full">
            <Form form={form} layout="vertical">
              <Form.Item
                label="Chế độ bảo trì"
                name="maintenanceMode"
                valuePropName="checked"
              >
                <Switch 
                  checkedChildren="Bật" 
                  unCheckedChildren="Tắt"
                  onChange={(checked) => {
                    if (checked) {
                      Modal.confirm({
                        title: 'Bật chế độ bảo trì',
                        content: 'Người dùng sẽ không thể truy cập hệ thống khi bật chế độ này.',
                        onOk: () => {
                          const values = form.getFieldsValue();
                          handleSubmit({ ...values, maintenanceMode: true });
                        },
                        onCancel: () => {
                          form.setFieldValue('maintenanceMode', false);
                        }
                      });
                    } else {
                      const values = form.getFieldsValue();
                      handleSubmit({ ...values, maintenanceMode: false });
                    }
                  }}
                />
              </Form.Item>

              <Form.Item
                label="Thông báo bảo trì"
                name="maintenanceMessage"
                rules={[{ required: true, message: 'Vui lòng nhập thông báo bảo trì!' }]}
              >
                <TextArea rows={3} />
              </Form.Item>

              <div className="mt-6">
                <Title level={5}>Quản lý dữ liệu</Title>
                
                <div className="space-y-3">
                  <Button 
                    icon={<DatabaseOutlined />} 
                    block
                    onClick={handleBackup}
                  >
                    Xuất backup dữ liệu
                  </Button>
                  
                  <Button 
                    icon={<DatabaseOutlined />} 
                    block
                    onClick={() => {
                      message.info('Chức năng đang phát triển');
                    }}
                  >
                    Khôi phục dữ liệu
                  </Button>
                  
                  <Button 
                    danger 
                    icon={<DeleteOutlined />} 
                    block
                    onClick={handleReset}
                  >
                    Reset cài đặt mặc định
                  </Button>
                </div>
              </div>
            </Form>
          </Card>
        </Col>

        {/* Quản lý người dùng (sẽ thêm sau) */}
        <Col xs={24}>
          <Card title={<><UserOutlined /> Quản lý người dùng</>}>
            <Text type="secondary">
              Tính năng quản lý người dùng đang được phát triển...
            </Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Settings; 