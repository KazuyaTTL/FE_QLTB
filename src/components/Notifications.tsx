import React, { useState, useEffect } from 'react';
import { Badge, Dropdown, List, Typography, Tag } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import axiosClient from '../api/axiosClient';
import dayjs from 'dayjs';

const { Text } = Typography;

interface Notification {
  _id: string;
  type: 'request_approved' | 'request_rejected' | 'return_reminder' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  requestId?: string;
}

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/api/notifications');
      
      if (response.data?.success) {
        setNotifications(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await axiosClient.put(`/api/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Polling for new notifications every minute
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'request_approved':
        return 'success';
      case 'request_rejected':
        return 'error';
      case 'return_reminder':
        return 'warning';
      default:
        return 'default';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const notificationList = (
    <List
      className="w-80 max-h-96 overflow-y-auto"
      loading={loading}
      dataSource={notifications}
      renderItem={(item) => (
        <List.Item
          className={`cursor-pointer hover:bg-gray-50 ${!item.read ? 'bg-blue-50' : ''}`}
          onClick={() => markAsRead(item._id)}
        >
          <List.Item.Meta
            title={
              <div className="flex items-center gap-2">
                <Tag color={getNotificationColor(item.type)}>{item.title}</Tag>
                {!item.read && <Badge status="processing" />}
              </div>
            }
            description={
              <div>
                <Text>{item.message}</Text>
                <div className="text-xs text-gray-500 mt-1">
                  {dayjs(item.createdAt).format('DD/MM/YYYY HH:mm')}
                </div>
              </div>
            }
          />
        </List.Item>
      )}
      locale={{
        emptyText: 'Không có thông báo'
      }}
    />
  );

  return (
    <Dropdown
      overlay={notificationList}
      trigger={['click']}
      placement="bottomRight"
      arrow
    >
      <Badge count={unreadCount} className="cursor-pointer">
        <BellOutlined className="text-xl" />
      </Badge>
    </Dropdown>
  );
};

export default Notifications; 