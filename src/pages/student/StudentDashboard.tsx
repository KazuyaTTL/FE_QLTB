import React, { useEffect, useState } from 'react';
import { Card, Row, Col, List, Tag, Typography, Statistic, Button, Spin, Badge, notification } from 'antd';
import { 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  HistoryOutlined,
  RightOutlined,
  InfoCircleOutlined,
  UserOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentUser, selectIsAuthenticated } from '../../store/slices/authSlice';
import axiosClient from '../../api/axiosClient';
import dayjs from 'dayjs';
import './StudentDashboard.css';
import { useMaintenanceStatus } from '../../hooks/useMaintenanceStatus';
import MaintenanceAlert from '../../components/MaintenanceAlert';

const { Title, Text } = Typography;

interface Notification {
  _id: string;
  type: 'request_submitted' | 'request_approved' | 'request_rejected' | 'return_reminder' | 'system' | 'maintenance';
  title: string;
  message: string;
  read: boolean;
  requestId?: string;
  createdAt: string;
}

interface UpcomingReturn {
  id: string;
  equipmentName: string;
  returnDate: string;
  isOverdue: boolean;
  hoursUntilDue?: number;
}

interface BorrowingSummary {
  pending: number;
  active: number;
  overdue: number;
  total: number;
}

const StudentDashboard: React.FC = () => {
  const currentUser = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const navigate = useNavigate();
  const { maintenanceStatus } = useMaintenanceStatus();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [upcomingReturns, setUpcomingReturns] = useState<UpcomingReturn[]>([]);
  const [borrowingSummary, setBorrowingSummary] = useState<BorrowingSummary>({
    pending: 0,
    active: 0,
    overdue: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch notifications từ API thực
        const notificationsRes = await axiosClient.get('/api/notifications');
        if (notificationsRes.data.success) {
          setNotifications(notificationsRes.data.data || []);
        }

        // Fetch upcoming returns từ API thực
        const returnsRes = await axiosClient.get('/api/borrow-requests/upcoming');
        if (returnsRes.data.success) {
          setUpcomingReturns(returnsRes.data.upcomingReturns || []);
        }

        // Fetch borrowing summary từ API thực
        const summaryRes = await axiosClient.get('/api/borrow-requests/summary');
        if (summaryRes.data.success) {
          setBorrowingSummary(summaryRes.data.summary);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        notification.error({
          message: 'Lỗi tải dữ liệu',
          description: 'Có lỗi xảy ra khi tải dữ liệu dashboard'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Refresh data every minute
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, navigate]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'request_submitted':
        return <InfoCircleOutlined className="text-blue-500" />;
      case 'request_approved':
        return <CheckCircleOutlined className="text-green-500" />;
      case 'request_rejected':
        return <ExclamationCircleOutlined className="text-red-500" />;
      case 'return_reminder':
        return <ClockCircleOutlined className="text-yellow-500" />;
      case 'maintenance':
        return <ExclamationCircleOutlined className="text-orange-500" />;
      case 'system':
        return <CheckCircleOutlined className="text-green-600" />;
      default:
        return <InfoCircleOutlined className="text-blue-500" />;
    }
  };

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

  const getStatusText = (isOverdue: boolean) => {
    return isOverdue ? 'Quá hạn' : 'Sắp đến hạn';
  };

  const getTimeRemaining = (returnDate: string) => {
    const now = dayjs();
    const target = dayjs(returnDate);
    const diffInMinutes = target.diff(now, 'minute');
    
    if (diffInMinutes <= 0) {
      const overdueDays = Math.abs(now.diff(target, 'day'));
      const overdueHours = Math.abs(now.diff(target, 'hour')) % 24;
      
      if (overdueDays > 0) {
        return `Quá hạn ${overdueDays} ngày ${overdueHours > 0 ? `${overdueHours} giờ` : ''}`;
      } else if (overdueHours > 0) {
        return `Quá hạn ${overdueHours} giờ`;
      } else {
        return 'Quá hạn';
      }
    }
    
    const days = Math.floor(diffInMinutes / (24 * 60));
    const hours = Math.floor((diffInMinutes % (24 * 60)) / 60);
    const minutes = diffInMinutes % 60;
    
    if (days > 0) {
      return `Còn ${days} ngày ${hours > 0 ? `${hours} giờ` : ''}`;
    } else if (hours > 0) {
      return `Còn ${hours} giờ ${minutes > 0 ? `${minutes} phút` : ''}`;
    } else if (minutes > 0) {
      return `Còn ${minutes} phút`;
    } else {
      return 'Sắp hết hạn';
    }
  };

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-64px)]">
        <Spin size="large" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-64px)]">
        <Spin size="large" />
      </div>
    );
  }

  console.log('Rendering dashboard content');
  return (
    <div className="p-6">
      {/* Thông báo bảo trì */}
      {maintenanceStatus.maintenanceMode && (
        <MaintenanceAlert message={maintenanceStatus.maintenanceMessage} />
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={4} style={{ margin: 0 }}>Xin chào, {currentUser.fullName}!</Title>
          <Text type="secondary">Tổng quan tình trạng mượn trả thiết bị</Text>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable loading={loading}>
            <Statistic
              title="Đang chờ duyệt"
              value={borrowingSummary.pending}
              valueStyle={{ color: '#faad14' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable loading={loading}>
            <Statistic
              title="Đang mượn"
              value={borrowingSummary.active}
              valueStyle={{ color: '#1890ff' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable loading={loading}>
            <Statistic
              title="Quá hạn"
              value={borrowingSummary.overdue}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<ExclamationCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable loading={loading}>
            <Statistic
              title="Tổng số lần mượn"
              value={borrowingSummary.total}
              valueStyle={{ color: '#52c41a' }}
              prefix={<HistoryOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-6">
        <Col xs={24} lg={12}>
          <Card
            title={<Title level={5} style={{ margin: 0 }}>Thông báo mới</Title>}
            extra={<Link to="/student/notifications">Xem tất cả</Link>}
            loading={loading}
          >
            <List
              itemLayout="horizontal"
              dataSource={notifications.slice(0, 5)}
              renderItem={(item) => (
                <List.Item 
                  className={`cursor-pointer hover:bg-gray-50 transition-colors rounded p-2 ${!item.read ? 'bg-blue-50' : ''}`}
                >
                  <List.Item.Meta
                    avatar={getNotificationIcon(item.type)}
                    title={
                      <div className="flex items-center gap-2">
                        <Text strong>{item.title}</Text>
                        {!item.read && <Badge status="processing" />}
                      </div>
                    }
                    description={
                      <div className="space-y-1">
                        <Text>{item.message}</Text>
                        <div>
                          <Text type="secondary" className="text-sm">
                            {dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')}
                          </Text>
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
              locale={{
                emptyText: 'Không có thông báo mới'
              }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={<Title level={5} style={{ margin: 0 }}>Sắp đến hạn trả</Title>}
            extra={<Link to="/student/my-requests">Xem tất cả</Link>}
            loading={loading}
          >
            <List
              itemLayout="horizontal"
              dataSource={upcomingReturns.slice(0, 5)}
              renderItem={(item) => (
                <List.Item
                  extra={
                    <Tag color={getStatusColor(item.isOverdue ? 'rejected' : 'warning')}>
                      {getStatusText(item.isOverdue)}
                    </Tag>
                  }
                >
                  <List.Item.Meta
                    avatar={
                      item.isOverdue ? 
                        <ExclamationCircleOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} /> :
                        <ClockCircleOutlined style={{ fontSize: '24px', color: '#faad14' }} />
                    }
                    title={<Text strong>{item.equipmentName}</Text>}
                    description={
                      <div>
                        <Text>Hạn trả: {dayjs(item.returnDate).format('DD/MM/YYYY HH:mm')}</Text>
                        <br />
                        <Text type="secondary" style={{ 
                          color: item.isOverdue ? '#ff4d4f' : dayjs(item.returnDate).diff(dayjs(), 'hour') <= 24 ? '#faad14' : '#666'
                        }}>
                          {getTimeRemaining(item.returnDate)}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
              locale={{
                emptyText: 'Không có thiết bị nào sắp đến hạn trả'
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StudentDashboard; 