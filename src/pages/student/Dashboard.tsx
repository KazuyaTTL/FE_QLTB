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
  status: string;
  description: string;
  daysRemaining?: number;
}

interface BorrowRequest {
  _id: string;
  studentName: string;
  equipmentName: string;
  requestDate: string;
  status: string;
}

interface DashboardStats {
  totalEquipment: number;
  availableEquipment: number;
  activeLoans: number;
  pendingRequests: number;
}

const Dashboard: React.FC = () => {
  const currentUser = useSelector(selectCurrentUser);
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState<DashboardStats>({
    totalEquipment: 0,
    availableEquipment: 0,
    activeLoans: 0,
    pendingRequests: 0
  });
  const [recentRequests, setRecentRequests] = useState<BorrowRequest[]>([]);
  const [upcomingReturns, setUpcomingReturns] = useState<Equipment[]>([]);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch statistics
      const statsResponse = await axiosClient.get('/api/borrow-requests/stats');
      console.log('Stats response:', statsResponse.data);
      
      if (statsResponse.data?.success) {
        setStatistics(statsResponse.data.data);
      }
      
      // Fetch recent requests
      const requestsResponse = await axiosClient.get('/api/borrow-requests/my-requests');
      console.log('Requests response:', requestsResponse.data);
      
      if (requestsResponse.data?.success) {
        const recentRequestsData = requestsResponse.data.data
          .map((request: any) => ({
            _id: request._id,
            studentName: request.studentName,
            equipmentName: request.equipmentName,
            requestDate: dayjs(request.requestDate).format('DD/MM/YYYY HH:mm'),
            status: request.status
          }));
        setRecentRequests(recentRequestsData);
      }

      // Fetch upcoming returns
      const returnsResponse = await axiosClient.get('/api/borrow-requests/upcoming-returns');
      console.log('Returns response:', returnsResponse.data);
      
      if (returnsResponse.data?.success) {
        setUpcomingReturns(returnsResponse.data.data);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      message.error('Không thể tải dữ liệu tổng quan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'borrowed':
        return 'processing';
      case 'warning':
        return 'warning';
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
      case 'borrowed':
        return 'Đang mượn';
      default:
        return status;
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Xin chào, {currentUser?.fullName}!</Title>
          <Text type="secondary">Tổng quan thiết bị của bạn</Text>
        </div>
        <Button 
          type="primary"
          icon={<SyncOutlined />}
          onClick={fetchDashboardData}
          loading={loading}
        >
          Làm mới
        </Button>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Tổng số thiết bị"
              value={statistics.totalEquipment}
              prefix={<AppstoreOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Thiết bị khả dụng"
              value={statistics.availableEquipment}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Đang mượn"
              value={statistics.activeLoans}
              prefix={<SyncOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card loading={loading}>
            <Statistic
              title="Chờ duyệt"
              value={statistics.pendingRequests}
              prefix={<ClockCircleOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card 
            title="Yêu cầu mượn gần đây"
            extra={<Link to="/student/my-requests">Xem tất cả</Link>}
            loading={loading}
          >
            <List
              dataSource={recentRequests}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.equipmentName}
                    description={`Ngày yêu cầu: ${item.requestDate}`}
                  />
                  <Tag color={getStatusColor(item.status)}>
                    {getStatusText(item.status)}
                  </Tag>
                </List.Item>
              )}
              locale={{
                emptyText: 'Không có yêu cầu nào'
              }}
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card 
            title="Thiết bị sắp đến hạn trả"
            loading={loading}
          >
            <List
              dataSource={upcomingReturns}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.name}
                    description={item.description}
                  />
                  {item.daysRemaining && item.daysRemaining <= 3 && (
                    <Tag color="error">
                      <ExclamationCircleOutlined /> {item.daysRemaining} ngày
                    </Tag>
                  )}
                </List.Item>
              )}
              locale={{
                emptyText: 'Không có thiết bị nào sắp đến hạn'
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 