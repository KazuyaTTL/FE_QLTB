import React from 'react';
import { Alert, Typography } from 'antd';
import { ToolOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface MaintenanceAlertProps {
  message: string;
  className?: string;
  showIcon?: boolean;
}

const MaintenanceAlert: React.FC<MaintenanceAlertProps> = ({ 
  message, 
  className = "mb-4",
  showIcon = true 
}) => {
  return (
    <Alert
      message={
        <div className="flex items-center">
          {showIcon && <ToolOutlined className="mr-2" />}
          <Text strong>Hệ thống đang bảo trì</Text>
        </div>
      }
      description={message}
      type="warning"
      showIcon={showIcon}
      icon={showIcon ? <ToolOutlined /> : undefined}
      className={className}
      banner
    />
  );
};

export default MaintenanceAlert; 