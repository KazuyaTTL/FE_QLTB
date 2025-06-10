import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import {
  ToolOutlined,
  UserOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';

const Dashboard = () => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng số thiết bị"
              value={150}
              prefix={<ToolOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Yêu cầu mượn mới"
              value={8}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Người dùng"
              value={45}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Thiết bị đang mượn"
              value={32}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-6">
        <Col xs={24} lg={12}>
          <Card title="Thiết bị được mượn nhiều nhất">
            <p>Đang cập nhật...</p>
          </Card>
        </Col>
        
        <Col xs={24} lg={12}>
          <Card title="Yêu cầu mượn gần đây">
            <p>Đang cập nhật...</p>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 
 
 
 
 