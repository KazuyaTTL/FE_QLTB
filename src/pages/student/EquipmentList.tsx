import React, { useState, useEffect } from 'react';
import { Card, Input, Select, Button, Modal, Form, DatePicker, TimePicker, message, Spin, InputNumber } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { RangePickerProps } from 'antd/es/date-picker';
import dayjs from 'dayjs';
import axiosClient from '../../api/axiosClient';
import { useMaintenanceStatus } from '../../hooks/useMaintenanceStatus';
import MaintenanceAlert from '../../components/MaintenanceAlert';

const { Search } = Input;
const { RangePicker } = DatePicker;

interface Equipment {
  _id: string;
  name: string;
  code: string;
  category: string;
  description: string;
  specifications: string;
  totalQuantity: number;
  availableQuantity: number;
  condition: 'new' | 'good' | 'fair' | 'poor' | 'damaged';
  location: {
    building: string;
    floor: string;
    room: string;
  };
}

const EquipmentList: React.FC = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [borrowModalVisible, setBorrowModalVisible] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();
  const { maintenanceStatus } = useMaintenanceStatus();

  const categories = [
    { value: 'all', label: 'Tất cả' },
    { value: 'electronics', label: 'Thiết bị điện tử' },
    { value: 'furniture', label: 'Nội thất' },
    { value: 'sports', label: 'Dụng cụ thể thao' },
    { value: 'laboratory', label: 'Thiết bị phòng thí nghiệm' },
    { value: 'audio_visual', label: 'Thiết bị nghe nhìn' },
    { value: 'other', label: 'Khác' }
  ];

  // Fetch equipment data
  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/api/equipment');
      
      if (response.data?.status === 'success') {
        const equipmentData = response.data.data?.equipments || [];
        setEquipment(equipmentData);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch equipment');
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
      message.error('Không thể tải danh sách thiết bị');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const handleBorrowRequest = (equipment: Equipment) => {
    setSelectedEquipment(equipment);
    setBorrowModalVisible(true);
  };

  const handleSubmitBorrowRequest = async (values: any) => {
    try {
      // Kiểm tra chế độ bảo trì trước khi gửi request
      if (maintenanceStatus.maintenanceMode) {
        message.warning(maintenanceStatus.maintenanceMessage || 'Hệ thống đang bảo trì, không thể gửi yêu cầu mượn.');
        return;
      }

      if (!selectedEquipment) return;

      const [borrowDate, expectedReturnDate] = values.dates;
      const returnTime = values.returnTime;
      
      // Kết hợp ngày trả và giờ trả
      const returnDateTime = expectedReturnDate.clone()
        .hour(returnTime.hour())
        .minute(returnTime.minute())
        .second(0)
        .millisecond(0);
      
      const requestData = {
        equipments: [{
          equipment: selectedEquipment._id,
          quantity: values.quantity
        }],
        borrowDate: borrowDate.format('YYYY-MM-DD'),
        expectedReturnDate: returnDateTime.toISOString(),
        purpose: values.purpose
      };

      const response = await axiosClient.post('/api/requests', requestData);
      
      // Kiểm tra response và message
      if (response.data?.message) {
        message.success(response.data.message);
        setBorrowModalVisible(false);
        form.resetFields();
        fetchEquipment(); // Refresh equipment list
        return;
      }

      // Nếu không có message cụ thể, hiển thị thông báo mặc định
      message.success('Gửi yêu cầu mượn thiết bị thành công!');
      setBorrowModalVisible(false);
      form.resetFields();
      fetchEquipment(); // Refresh equipment list

    } catch (error: any) {
      console.error('Error submitting borrow request:', error);
      
      // Kiểm tra nếu là lỗi maintenance từ server
      if (error.response?.status === 503 && error.response?.data?.maintenance) {
        message.warning(error.response.data.message);
        return;
      }
      
      // Kiểm tra nếu có response message khác
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Có lỗi xảy ra khi gửi yêu cầu');
      }
    }
  };

  // Disable dates before today for the date picker
  const disabledDate: RangePickerProps['disabledDate'] = (current) => {
    return current && current < dayjs().startOf('day');
  };

  const filteredEquipment = equipment.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.code.toLowerCase().includes(searchText.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getConditionText = (condition: string) => {
    switch (condition) {
      case 'new': return 'Mới';
      case 'good': return 'Tốt';
      case 'fair': return 'Bình thường';
      case 'poor': return 'Kém';
      case 'damaged': return 'Hỏng';
      default: return condition;
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'text-green-600';
      case 'good': return 'text-green-500';
      case 'fair': return 'text-yellow-500';
      case 'poor': return 'text-orange-500';
      case 'damaged': return 'text-red-500';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" tip="Đang tải danh sách thiết bị..." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Thông báo bảo trì */}
      {maintenanceStatus.maintenanceMode && (
        <MaintenanceAlert message={maintenanceStatus.maintenanceMessage} />
      )}

      <div className="flex gap-4 mb-6">
        <Search
          placeholder="Tìm kiếm theo tên, mã hoặc mô tả..."
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          className="max-w-md"
          onChange={(e) => setSearchText(e.target.value)}
        />
        <Select
          size="large"
          value={selectedCategory}
          onChange={setSelectedCategory}
          options={categories}
          style={{ width: 200 }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEquipment.map(item => (
          <Card
            key={item._id}
            actions={[
              <Button 
                type="primary" 
                onClick={() => handleBorrowRequest(item)}
                disabled={
                  item.availableQuantity === 0 || 
                  item.condition === 'damaged' || 
                  maintenanceStatus.maintenanceMode
                }
              >
                {maintenanceStatus.maintenanceMode ? 'Hệ thống bảo trì' : 'Yêu cầu mượn'}
              </Button>
            ]}
          >
            <Card.Meta
              title={
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-lg font-semibold">{item.name}</div>
                    <div className="text-sm text-gray-500">Mã: {item.code}</div>
                  </div>
                </div>
              }
              description={
                <div className="space-y-2 mt-2">
                  <p>{item.description}</p>
                  {item.specifications && (
                    <p className="text-sm text-gray-600">
                      <strong>Thông số:</strong> {item.specifications}
                    </p>
                  )}
                  <p>
                    <strong>Vị trí:</strong> Tòa {item.location.building}, Tầng {item.location.floor}, Phòng {item.location.room}
                  </p>
                  <p>
                    <strong>Tình trạng:</strong>{' '}
                    <span className={getConditionColor(item.condition)}>
                      {getConditionText(item.condition)}
                    </span>
                  </p>
                  <p className={`font-semibold ${item.availableQuantity === 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {item.availableQuantity > 0 
                      ? `Còn ${item.availableQuantity}/${item.totalQuantity} thiết bị` 
                      : 'Hết thiết bị'}
                  </p>
                </div>
              }
            />
          </Card>
        ))}
      </div>

      <Modal
        title="Yêu cầu mượn thiết bị"
        open={borrowModalVisible}
        onCancel={() => setBorrowModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitBorrowRequest}
        >
          <Form.Item
            name="dates"
            label="Thời gian mượn (ngày)"
            rules={[{ required: true, message: 'Vui lòng chọn thời gian mượn!' }]}
          >
            <RangePicker
              disabledDate={disabledDate}
              className="w-full"
              format="DD/MM/YYYY"
            />
          </Form.Item>

          <Form.Item
            name="returnTime"
            label="Giờ trả dự kiến"
            rules={[{ required: true, message: 'Vui lòng chọn giờ trả!' }]}
            extra="Chọn giờ trả trong khung thời gian hành chính (8:00 - 17:00)"
          >
            <TimePicker
              className="w-full"
              format="HH:mm"
              minuteStep={15}
              disabledHours={() => {
                // Chỉ cho phép từ 8:00 đến 17:00
                const hours = [];
                for (let i = 0; i < 8; i++) hours.push(i);
                for (let i = 18; i < 24; i++) hours.push(i);
                return hours;
              }}
              placeholder="Chọn giờ trả"
              defaultValue={dayjs().hour(17).minute(0)} // Mặc định 17:00
            />
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Số lượng"
            rules={[
              { required: true, message: 'Vui lòng nhập số lượng!' },
              { 
                validator: async (_, value) => {
                  if (value === undefined || value === null || value === '') {
                    return Promise.reject('Vui lòng nhập số lượng!');
                  }
                  const numValue = Number(value);
                  if (isNaN(numValue) || !Number.isInteger(numValue)) {
                    return Promise.reject('Số lượng phải là số nguyên!');
                  }
                  if (numValue < 1) {
                    return Promise.reject('Số lượng phải lớn hơn 0!');
                  }
                  if (selectedEquipment && numValue > selectedEquipment.availableQuantity) {
                    return Promise.reject(`Số lượng không được vượt quá ${selectedEquipment.availableQuantity}!`);
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <InputNumber 
              min={1} 
              max={selectedEquipment?.availableQuantity || 1} 
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="purpose"
            label="Mục đích sử dụng"
            rules={[
              { required: true, message: 'Vui lòng nhập mục đích sử dụng!' },
              { min: 10, message: 'Mục đích sử dụng phải có ít nhất 10 ký tự!' }
            ]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item className="mb-0 text-right">
            <Button type="default" onClick={() => setBorrowModalVisible(false)} className="mr-2">
              Hủy
            </Button>
            <Button type="primary" htmlType="submit">
              Gửi yêu cầu
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EquipmentList; 
 
 