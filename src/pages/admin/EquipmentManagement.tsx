import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tag,
  Tooltip,
  Card,
  Typography,
  InputNumber
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axiosClient from '../../api/axiosClient';

const { Title } = Typography;
const { confirm } = Modal;

interface Equipment {
  _id: string;
  name: string;
  code: string;
  category: 'electronics' | 'furniture' | 'sports' | 'laboratory' | 'audio_visual' | 'other';
  description?: string;
  specifications?: string;
  totalQuantity: number;
  availableQuantity: number;
  borrowedQuantity: number;
  condition: 'new' | 'good' | 'fair' | 'poor' | 'damaged';
  location: {
    building: string;
    floor: string;
    room: string;
  };
  purchaseDate?: Date;
  purchasePrice?: number;
  warrantyExpiry?: Date;
  notes?: string;
}

const EquipmentManagement: React.FC = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch equipment data
  const fetchEquipment = async () => {
    try {
      console.log('Starting to fetch equipment...');
      setLoading(true);
      
      const response = await axiosClient.get('/api/equipment');
      console.log('Raw API response:', response);
      console.log('Response data:', response.data);
      
      if (!response.data || response.data.status !== 'success') {
        throw new Error(response.data?.message || 'Failed to fetch equipment');
      }
      
      // Kiểm tra và xử lý dữ liệu trả về
      const responseData = response.data?.data;
      console.log('Response data structure:', responseData);

      // Lấy mảng equipments từ response
      let equipmentData = responseData?.equipments || [];
      console.log('Equipment array:', equipmentData);
      
      // Validate dữ liệu
      if (!Array.isArray(equipmentData)) {
        console.error('Equipment data is not an array:', equipmentData);
        equipmentData = [];
      }
      
      // Đảm bảo dữ liệu là mảng và có các trường cần thiết
      const formattedData = equipmentData.map(item => {
        // Log từng item để debug
        console.log('Processing equipment item:', item);
        
        // Kiểm tra _id
        if (!item._id) {
          console.error('Equipment item missing _id:', item);
          return null;
        }
        
        return {
          ...item,
          key: item._id,
          totalQuantity: Number(item.totalQuantity || 0),
          availableQuantity: Number(item.availableQuantity || 0),
          borrowedQuantity: Number(item.borrowedQuantity || 0),
          condition: item.condition || 'unknown',
          location: item.location || { building: '', floor: '', room: '' }
        };
      })
      .filter(Boolean); // Lọc bỏ các item null

      console.log('Final formatted data:', formattedData);
      setEquipment(formattedData);
      
    } catch (error) {
      console.error('Error fetching equipment:', error);
      message.error('Không thể tải danh sách thiết bị');
      setEquipment([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []); // Fetch khi component mount

  // Handle form submission
  const handleSubmit = async (values: any) => {
    try {
      console.log('Raw form values:', values);

      // Format dữ liệu trước khi gửi
      const formattedData: any = {};

      // Chỉ thêm các trường có giá trị
      if (values.code) formattedData.code = values.code.trim();
      if (values.name) formattedData.name = values.name.trim();
      if (values.description) formattedData.description = values.description.trim();
      if (values.category) formattedData.category = values.category.toLowerCase();
      if (values.specifications) formattedData.specifications = values.specifications.trim();
      if (values.totalQuantity) formattedData.totalQuantity = Number(values.totalQuantity);
      if (values.condition) formattedData.condition = values.condition;
      
      // Chỉ thêm location nếu có đầy đủ thông tin
      if (values.location?.building || values.location?.floor || values.location?.room) {
        formattedData.location = {
          building: values.location.building?.trim() || '',
          floor: values.location.floor?.trim() || '',
          room: values.location.room?.trim() || ''
        };
      }

      // Chỉ thêm các trường ngày tháng và giá nếu có giá trị
      if (values.purchaseDate) formattedData.purchaseDate = values.purchaseDate;
      if (values.purchasePrice) formattedData.purchasePrice = Number(values.purchasePrice);
      if (values.warrantyExpiry) formattedData.warrantyExpiry = values.warrantyExpiry;
      if (values.notes) formattedData.notes = values.notes.trim();

      // Nếu là thêm mới, set availableQuantity = totalQuantity
      if (!editingId) {
        formattedData.availableQuantity = formattedData.totalQuantity;
        formattedData.borrowedQuantity = 0;
      }

      console.log('Formatted data to submit:', formattedData);

      let response;
      if (editingId) {
        // Validate required fields for update
        if (!formattedData.code || !formattedData.name || !formattedData.category) {
          message.error('Vui lòng điền đầy đủ thông tin bắt buộc (mã, tên, loại thiết bị)');
          return;
        }
        
        // Validate location for update
        if (!formattedData.location?.building || !formattedData.location?.floor || !formattedData.location?.room) {
          message.error('Vui lòng điền đầy đủ thông tin vị trí (tòa nhà, tầng, phòng)');
          return;
        }

        console.log('Updating equipment with ID:', editingId);
        response = await axiosClient.put(`/api/equipment/${editingId}`, formattedData);
      } else {
        // Validate required fields for create
        if (!formattedData.code || !formattedData.name || !formattedData.category || !formattedData.totalQuantity) {
          message.error('Vui lòng điền đầy đủ thông tin bắt buộc');
          return;
        }

        console.log('Creating new equipment with data:', formattedData);
        response = await axiosClient.post('/api/equipment', formattedData);
      }

      console.log('API Response:', response.data);

      if (!response.data || response.data.status !== 'success') {
        throw new Error(response.data?.message || 'Operation failed');
      }

      // Show success message
      message.success(editingId ? 'Cập nhật thiết bị thành công' : 'Thêm thiết bị thành công');

      // Đóng modal và reset form
      setModalVisible(false);
      form.resetFields();
      setEditingId(null);

      // Fetch lại dữ liệu
      console.log('Fetching updated equipment list...');
      await fetchEquipment();

    } catch (error: any) {
      console.error('Error submitting form:', error);
      console.error('Error details:', error.response?.data);
      
      // Hiển thị chi tiết lỗi validation nếu có
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors
          .map((err: any) => `${err.field}: ${err.message}`)
          .join('\n');
        message.error(errorMessages);
      } else {
        message.error(
          error.response?.data?.message || 
          error.message || 
          'Có lỗi xảy ra khi lưu thiết bị'
        );
      }
    }
  };

  // Handle equipment deletion
  const handleDelete = (id: string) => {
    // Kiểm tra id có tồn tại không
    if (!id) {
      message.error('ID thiết bị không hợp lệ');
      return;
    }

    console.log('Attempting to delete equipment with ID:', id);

    confirm({
      title: 'Xác nhận xóa thiết bị',
      icon: <ExclamationCircleOutlined />,
      content: 'Bạn có chắc chắn muốn xóa thiết bị này?',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          console.log('Sending delete request for ID:', id);
          const response = await axiosClient.delete(`/api/equipment/${id}`);
          
          console.log('Delete response:', response.data);
          
          if (!response.data || response.data.status !== 'success') {
            throw new Error(response.data?.message || 'Xóa thiết bị thất bại');
          }

          message.success('Xóa thiết bị thành công');
          
          // Đợi một chút trước khi fetch lại dữ liệu
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Fetch lại danh sách
          console.log('Fetching updated list after deletion');
          await fetchEquipment();
          
        } catch (error: any) {
          console.error('Error deleting equipment:', error);
          message.error(error.response?.data?.message || error.message || 'Có lỗi xảy ra khi xóa thiết bị');
        }
      },
    });
  };

  // Handle editing equipment
  const handleEdit = (record: Equipment) => {
    console.log('Editing equipment:', record);
    setEditingId(record._id);
    form.setFieldsValue({
      ...record,
      // Đảm bảo set đầy đủ thông tin location
      location: {
        building: record.location?.building || '',
        floor: record.location?.floor || '',
        room: record.location?.room || ''
      }
    });
    setModalVisible(true);
  };

  const columns: ColumnsType<Equipment> = [
    {
      title: 'Mã thiết bị',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Tên thiết bị',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => {
        const categoryMap = {
          electronics: 'Thiết bị điện tử',
          furniture: 'Nội thất',
          sports: 'Dụng cụ thể thao',
          laboratory: 'Thiết bị phòng thí nghiệm',
          audio_visual: 'Thiết bị nghe nhìn',
          other: 'Khác'
        };
        return categoryMap[category as keyof typeof categoryMap] || category;
      },
    },
    {
      title: 'Số lượng',
      key: 'quantity',
      render: (_, record) => (
        <div>
          <p>Tổng: {record.totalQuantity}</p>
          <p className="text-green-500">Khả dụng: {record.availableQuantity}</p>
          <p className="text-blue-500">Đang mượn: {record.borrowedQuantity}</p>
        </div>
      ),
    },
    {
      title: 'Tình trạng',
      dataIndex: 'condition',
      key: 'condition',
      render: (condition: string) => {
        const conditionMap = {
          new: { color: 'success', text: 'Mới' },
          good: { color: 'processing', text: 'Tốt' },
          fair: { color: 'warning', text: 'Bình thường' },
          poor: { color: 'error', text: 'Kém' },
          damaged: { color: 'default', text: 'Hỏng' }
        };
        const config = conditionMap[condition as keyof typeof conditionMap] || { color: 'default', text: 'Không xác định' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Vị trí',
      key: 'location',
      render: (_, record) => {
        const location = record.location || { building: '', floor: '', room: '' };
        return (
          <span>
            {location.building || 'N/A'} 
            {location.floor ? ` - Tầng ${location.floor}` : ''} 
            {location.room ? ` - Phòng ${location.room}` : ''}
          </span>
        );
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Chỉnh sửa">
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Xóa">
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => {
                // Kiểm tra record và id trước khi gọi handleDelete
                if (!record || !record._id) {
                  message.error('Không thể xóa: thiếu thông tin thiết bị');
                  return;
                }
                handleDelete(record._id);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const initialFormValues = {
    status: 'available',
    condition: 'good',
    quantity: 1
  };

  return (
    <div className="p-6">
      <Card>
        <div className="flex justify-between items-center mb-4">
          <Title level={2}>Quản lý thiết bị</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingId(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            Thêm thiết bị
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={equipment}
          rowKey="_id"
          loading={loading}
        />

        <Modal
          title={editingId ? "Chỉnh sửa thiết bị" : "Thêm thiết bị mới"}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              status: 'available',
              condition: 'good',
              totalQuantity: 1,
              category: 'electronics'
            }}
          >
            <Form.Item
              name="code"
              label="Mã thiết bị"
              rules={[
                { required: true, message: 'Vui lòng nhập mã thiết bị' },
                { min: 3, message: 'Mã thiết bị phải có ít nhất 3 ký tự' }
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="name"
              label="Tên thiết bị"
              rules={[
                { required: true, message: 'Vui lòng nhập tên thiết bị' },
                { min: 2, message: 'Tên thiết bị phải có ít nhất 2 ký tự' }
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="description"
              label="Mô tả"
              rules={[
                { max: 500, message: 'Mô tả không được vượt quá 500 ký tự' }
              ]}
            >
              <Input.TextArea />
            </Form.Item>

            <Form.Item
              name="category"
              label="Danh mục"
              rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
            >
              <Select>
                <Select.Option value="electronics">Thiết bị điện tử</Select.Option>
                <Select.Option value="furniture">Nội thất</Select.Option>
                <Select.Option value="sports">Dụng cụ thể thao</Select.Option>
                <Select.Option value="laboratory">Thiết bị phòng thí nghiệm</Select.Option>
                <Select.Option value="audio_visual">Thiết bị nghe nhìn</Select.Option>
                <Select.Option value="other">Khác</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="totalQuantity"
              label="Tổng số lượng"
              rules={[
                { required: true, message: 'Vui lòng nhập số lượng' },
                { 
                  validator: (_, value) => {
                    const num = Number(value);
                    if (isNaN(num)) {
                      return Promise.reject('Vui lòng nhập số');
                    }
                    if (num < 0) {
                      return Promise.reject('Số lượng không được âm');
                    }
                    if (!Number.isInteger(num)) {
                      return Promise.reject('Số lượng phải là số nguyên');
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="condition"
              label="Tình trạng"
              rules={[{ required: true, message: 'Vui lòng chọn tình trạng' }]}
            >
              <Select>
                <Select.Option value="new">Mới</Select.Option>
                <Select.Option value="good">Tốt</Select.Option>
                <Select.Option value="fair">Bình thường</Select.Option>
                <Select.Option value="poor">Kém</Select.Option>
                <Select.Option value="damaged">Hỏng</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item label="Vị trí" required>
              <Input.Group compact>
                <Form.Item
                  name={['location', 'building']}
                  noStyle
                  rules={[{ required: true, message: 'Vui lòng nhập tòa nhà' }]}
                >
                  <Input placeholder="Tòa nhà" style={{ width: '33%' }} />
                </Form.Item>
                <Form.Item
                  name={['location', 'floor']}
                  noStyle
                  rules={[{ required: true, message: 'Vui lòng nhập tầng' }]}
                >
                  <Input placeholder="Tầng" style={{ width: '33%' }} />
                </Form.Item>
                <Form.Item
                  name={['location', 'room']}
                  noStyle
                  rules={[{ required: true, message: 'Vui lòng nhập phòng' }]}
                >
                  <Input placeholder="Phòng" style={{ width: '34%' }} />
                </Form.Item>
              </Input.Group>
            </Form.Item>

            <Form.Item
              name="specifications"
              label="Thông số kỹ thuật"
              rules={[
                { max: 1000, message: 'Thông số kỹ thuật không được vượt quá 1000 ký tự' }
              ]}
            >
              <Input.TextArea />
            </Form.Item>

            <Form.Item
              name="notes"
              label="Ghi chú"
              rules={[
                { max: 1000, message: 'Ghi chú không được vượt quá 1000 ký tự' }
              ]}
            >
              <Input.TextArea />
            </Form.Item>

            <Form.Item className="mb-0 text-right">
              <Space>
                <Button onClick={() => setModalVisible(false)}>
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit">
                  {editingId ? 'Cập nhật' : 'Thêm mới'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default EquipmentManagement; 
 
 
 
 