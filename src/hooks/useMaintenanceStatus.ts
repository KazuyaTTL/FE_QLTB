import { useState, useEffect } from 'react';
import axiosClient from '../api/axiosClient';

interface MaintenanceStatus {
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

export const useMaintenanceStatus = () => {
  const [maintenanceStatus, setMaintenanceStatus] = useState<MaintenanceStatus>({
    maintenanceMode: false,
    maintenanceMessage: ''
  });
  const [loading, setLoading] = useState(true);

  const checkMaintenanceStatus = async () => {
    try {
      const response = await axiosClient.get('/api/settings/maintenance-status');
      if (response.data?.success) {
        setMaintenanceStatus(response.data.data);
      }
    } catch (error) {
      console.error('Error checking maintenance status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkMaintenanceStatus();
    
    // Kiểm tra định kỳ mỗi 30 giây
    const interval = setInterval(checkMaintenanceStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { maintenanceStatus, loading, checkMaintenanceStatus };
}; 