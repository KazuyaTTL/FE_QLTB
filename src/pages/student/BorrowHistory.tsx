import React, { useState, useEffect } from 'react';
import { Table, Tag, Button, DatePicker, Space, Typography, message, Modal, Spin } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import axiosClient from '../../api/axiosClient';

const { RangePicker } = DatePicker;
const { Title } = Typography;

interface BorrowRequest {
  _id: string;
  requestNumber: string;
  equipments: Array<{
    equipment: {
      _id: string;
      name: string;
      code: string;
    };
    quantity: number;
  }>;
  borrowDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned' | 'borrowed';
  purpose: string;
  notes?: string;
  adminNotes?: string;
}

const BorrowHistory: React.FC = () => {
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<BorrowRequest | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/api/requests');
      
      if (response.data?.success) {
        setRequests(response.data.data || []);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch requests');
      }
    } catch (error: any) {
      console.error('Error fetching requests:', error);
      message.error('Không thể tải lịch sử mượn: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const statusColors = {
    pending: 'gold',
    approved: 'cyan',
    borrowed: 'green',
    rejected: 'red',
    returned: 'blue'
  };

  const statusLabels = {
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    borrowed: 'Đang mượn',
    rejected: 'Từ chối',
    returned: 'Đã trả'
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      const response = await axiosClient.delete(`/api/requests/${requestId}`);
      
      if (response.data?.success) {
        message.success('Hủy yêu cầu thành công');
        fetchRequests();
      } else {
        throw new Error(response.data?.message || 'Failed to cancel request');
      }
    } catch (error: any) {
      console.error('Error canceling request:', error);
      message.error('Không thể hủy yêu cầu: ' + (error.response?.data?.message || error.message));
    }
  };

  const showDetailModal = (request: BorrowRequest) => {
    setSelectedRequest(request);
    setDetailModalVisible(true);
  };

  const columns: ColumnsType<BorrowRequest> = [
    {
      title: 'Mã yêu cầu',
      dataIndex: 'requestNumber',
      key: 'requestNumber',
    },
    {
      title: 'Thiết bị',
      key: 'equipments',
      render: (_, record) => (
        <div>
          {record.equipments.map((eq, index) => (
            <div key={index}>
              {eq.equipment.name} (SL: {eq.quantity})
            </div>
          ))}
        </div>
      ),
    },
    {
      title: 'Ngày mượn',
      dataIndex: 'borrowDate',
      key: 'borrowDate',
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
      sorter: (a, b) => dayjs(a.borrowDate).unix() - dayjs(b.borrowDate).unix(),
    },
    {
      title: 'Ngày giờ trả dự kiến',
      dataIndex: 'expectedReturnDate',
      key: 'expectedReturnDate',
      width: 140,
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: keyof typeof statusColors) => (
        <Tag color={statusColors[status]}>
          {statusLabels[status]}
        </Tag>
      ),
      filters: Object.entries(statusLabels).map(([key, label]) => ({
        text: label,
        value: key,
      })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Mục đích sử dụng',
      dataIndex: 'purpose',
      key: 'purpose',
      ellipsis: true,
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space>
          {record.status === 'pending' && (
            <Button 
              type="link" 
              danger 
              onClick={() => {
                Modal.confirm({
                  title: 'Xác nhận hủy yêu cầu',
                  content: 'Bạn có chắc chắn muốn hủy yêu cầu mượn này?',
                  okText: 'Hủy yêu cầu',
                  cancelText: 'Đóng',
                  onOk: () => handleCancelRequest(record._id)
                });
              }}
            >
              Hủy yêu cầu
            </Button>
          )}
          <Button type="link" onClick={() => showDetailModal(record)}>
            Chi tiết
          </Button>
        </Space>
      ),
    },
  ];

  const filteredRequests = dateRange
    ? requests.filter(request => {
        const borrowDate = dayjs(request.borrowDate);
        return borrowDate.isAfter(dateRange[0]) && borrowDate.isBefore(dateRange[1]);
      })
    : requests;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <Title level={4}>Lịch sử mượn thiết bị</Title>
        <RangePicker
          onChange={(dates) => setDateRange(dates)}
          format="DD/MM/YYYY"
        />
      </div>

      <Table
        loading={loading}
        columns={columns}
        dataSource={filteredRequests}
        rowKey="_id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Tổng số ${total} bản ghi`,
        }}
      />

      <Modal
        title="Chi tiết yêu cầu mượn"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Đóng
          </Button>
        ]}
        width={700}
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div>
              <p className="font-semibold">Mã yêu cầu:</p>
              <p>{selectedRequest.requestNumber}</p>
            </div>

            <div>
              <p className="font-semibold">Thiết bị:</p>
              {selectedRequest.equipments.map((eq, index) => (
                <p key={index}>
                  {eq.equipment.name} (Mã: {eq.equipment.code}) - Số lượng: {eq.quantity}
                </p>
              ))}
            </div>

            <div>
              <p className="font-semibold">Thời gian:</p>
              <p>Ngày mượn: {dayjs(selectedRequest.borrowDate).format('DD/MM/YYYY')}</p>
              <p>Ngày giờ trả dự kiến: {dayjs(selectedRequest.expectedReturnDate).format('DD/MM/YYYY HH:mm')}</p>
              {selectedRequest.actualReturnDate && (
                <p>Ngày giờ trả thực tế: {dayjs(selectedRequest.actualReturnDate).format('DD/MM/YYYY HH:mm')}</p>
              )}
            </div>

            <div>
              <p className="font-semibold">Trạng thái:</p>
              <Tag color={statusColors[selectedRequest.status]}>
                {statusLabels[selectedRequest.status]}
              </Tag>
            </div>

            <div>
              <p className="font-semibold">Mục đích sử dụng:</p>
              <p>{selectedRequest.purpose}</p>
            </div>

            {selectedRequest.notes && (
              <div>
                <p className="font-semibold">Ghi chú:</p>
                <p>{selectedRequest.notes}</p>
              </div>
            )}

            {selectedRequest.adminNotes && (
              <div>
                <p className="font-semibold">Ghi chú từ admin:</p>
                <p>{selectedRequest.adminNotes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BorrowHistory; 
 
 