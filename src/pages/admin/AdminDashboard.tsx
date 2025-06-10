import React, { useState, useEffect } from 'react';
import { Card, Row, Col, List, Tag, Typography, Statistic, Button, message } from 'antd';
import {
  UserOutlined,
  AppstoreOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface Equipment {
  _id: string;
  name: string;
  status: 'available' | 'in_use' | 'maintenance' | 'pending' | 'warning' | 'notice';
  borrower?: string;
  dueDate?: string;
}

interface BorrowRequest {
  _id: string;
  studentName: string;
  equipmentName: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface DashboardStats {
  totalEquipment: number;
  availableEquipment: number;
  activeLoans: number;
  pendingRequests: number;
}

const AdminDashboard: React.FC = () => {
  const currentUser = useSelector(selectCurrentUser);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<DashboardStats>({
    totalEquipment: 0,
    availableEquipment: 0,
    activeLoans: 0,
    pendingRequests: 0
  });
  const [recentRequests, setRecentRequests] = useState<BorrowRequest[]>([]);
  const [equipmentAlerts, setEquipmentAlerts] = useState<Equipment[]>([]);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch equipment statistics
      const equipmentResponse = await axiosClient.get('/api/equipment');
      console.log('Equipment response:', equipmentResponse.data);
      
      const equipments = equipmentResponse.data?.data?.equipments || [];
      const totalEquipment = equipments.length;
      const availableEquipment = equipments.filter((e: any) => e.availableQuantity > 0).length;
      
      // Fetch borrow requests
      const requestsResponse = await axiosClient.get('/api/requests');
      console.log('Requests response:', requestsResponse.data);
      
      const requests = requestsResponse.data?.data || [];
      const pendingRequests = requests.filter((r: any) => r.status === 'pending').length;
      const activeLoans = requests.filter((r: any) => r.status === 'borrowed').length;

      // Update statistics
      setStatistics({
        totalEquipment,
        availableEquipment,
        activeLoans,
        pendingRequests
      });

      // Get recent requests (last 5)
      const recentRequestsData = requests
        .slice(0, 5)
        .map((request: any) => ({
          _id: request._id,
          studentName: request.borrower?.fullName || 'N/A',
          equipmentName: request.equipments?.[0]?.equipment?.name || 'N/A',
          requestDate: dayjs(request.createdAt).format('DD/MM/YYYY HH:mm'),
          status: request.status
        }));
      setRecentRequests(recentRequestsData);

      // Get equipment alerts
      const alertEquipments = equipments
        .filter((equipment: any) => {
          // Tính phần trăm số lượng còn lại
          const remainingPercentage = (equipment.availableQuantity / equipment.totalQuantity) * 100;
          
          return (
            // Thiết bị sắp hết (còn dưới 20%)
            (remainingPercentage <= 20 && remainingPercentage > 0) ||
            // Hoặc thiết bị có tình trạng kém
            equipment.condition === 'poor' ||
            // Hoặc thiết bị đang bảo trì
            equipment.condition === 'maintenance' ||
            // Hoặc thiết bị bị hỏng
            equipment.condition === 'damaged'
          );
        })
        .slice(0, 5)
        .map((equipment: any) => ({
          _id: equipment._id,
          name: equipment.name,
          status: equipment.condition === 'maintenance' ? 'maintenance' : 
                 equipment.condition === 'poor' ? 'warning' :
                 equipment.condition === 'damaged' ? 'error' :
                 'notice',
          description: equipment.condition === 'maintenance' ? 'Đang bảo trì' :
                      equipment.condition === 'poor' ? 'Tình trạng kém' :
                      equipment.condition === 'damaged' ? 'Thiết bị hỏng' :
                      `Sắp hết: còn ${equipment.availableQuantity}/${equipment.totalQuantity} thiết bị`
        }));
      setEquipmentAlerts(alertEquipments);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      message.error('Không thể tải dữ liệu tổng quan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'available':
        return 'success';
      case 'in_use':
        return 'processing';
      case 'maintenance':
        return 'error';
      case 'warning':
        return 'warning';
      case 'notice':
        return 'orange';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Chờ duyệt';
      case 'approved':
        return 'Đã duyệt';
      case 'rejected':
        return 'Từ chối';
      case 'available':
        return 'Sẵn sàng';
      case 'in_use':
        return 'Đang mượn';
      case 'maintenance':
        return 'Bảo trì';
      case 'warning':
        return 'Cần chú ý';
      case 'notice':
        return 'Sắp hết';
      default:
        return status;
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={4} style={{ margin: 0 }}>Xin chào, {currentUser?.fullName}!</Title>
          <Text type="secondary">Tổng quan hệ thống quản lý thiết bị</Text>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable loading={loading}>
            <Statistic
              title="Tổng số thiết bị"
              value={statistics.totalEquipment}
              prefix={<AppstoreOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable loading={loading}>
            <Statistic
              title="Thiết bị khả dụng"
              value={statistics.availableEquipment}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable loading={loading}>
            <Statistic
              title="Đang cho mượn"
              value={statistics.activeLoans}
              valueStyle={{ color: '#1890ff' }}
              prefix={<SyncOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable loading={loading}>
            <Statistic
              title="Yêu cầu chờ duyệt"
              value={statistics.pendingRequests}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-6">
        <Col xs={24} lg={12}>
          <Card
            title={<Title level={5} style={{ margin: 0 }}>Yêu cầu mượn gần đây</Title>}
            extra={<Link to="/admin/requests">Xem tất cả</Link>}
            loading={loading}
          >
            <List
              itemLayout="horizontal"
              dataSource={recentRequests}
              renderItem={(item) => (
                <List.Item
                  extra={
                    <Tag color={getStatusColor(item.status)}>
                      {getStatusText(item.status)}
                    </Tag>
                  }
                >
                  <List.Item.Meta
                    avatar={<UserOutlined style={{ fontSize: '24px' }} />}
                    title={<Text strong>{item.studentName}</Text>}
                    description={
                      <div>
                        <Text>{item.equipmentName}</Text>
                        <br />
                        <Text type="secondary">{item.requestDate}</Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={<Title level={5} style={{ margin: 0 }}>Thiết bị cần chú ý</Title>}
            extra={<Link to="/admin/equipment">Xem tất cả</Link>}
            loading={loading}
          >
            <List
              itemLayout="horizontal"
              dataSource={equipmentAlerts}
              renderItem={(item) => (
                <List.Item
                  extra={
                    <Tag color={getStatusColor(item.status)}>
                      {getStatusText(item.status)}
                    </Tag>
                  }
                >
                  <List.Item.Meta
                    avatar={<AppstoreOutlined style={{ fontSize: '24px' }} />}
                    title={<Text strong>{item.name}</Text>}
                    description={
                      <Text type="secondary">
                        {item.description}
                      </Text>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard; 
 
 
 
 