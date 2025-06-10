import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Modal,
  message,
  Card,
  Typography,
  Tooltip,
  Form,
  Input,
  DatePicker
} from 'antd';
import {
  CheckOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
  EyeOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import axiosClient from '../../api/axiosClient';
import dayjs from 'dayjs';

const { Title } = Typography;
const { confirm } = Modal;
const { TextArea } = Input;

interface BorrowRequest {
  _id: string;
  student: {
    _id: string;
    fullName: string;
  };
  equipments: Array<{
    equipment: {
      _id: string;
      name: string;
    };
    quantity: number;
  }>;
  status: 'pending' | 'approved' | 'rejected' | 'borrowed' | 'returned';
  borrowDate: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  purpose: string;
}

const BorrowRequests: React.FC = () => {
  const [requests, setRequests] = useState<BorrowRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BorrowRequest | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [rejectForm] = Form.useForm();
  const [rejectModalVisible, setRejectModalVisible] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/api/requests');
      console.log('Raw API Response:', response);

      if (!response.data) {
        throw new Error('No data received from API');
      }

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch requests');
      }

      const requestsData = response.data.data || [];
      console.log('Requests Data:', requestsData);

      const formattedRequests = requestsData.map(request => {
        console.log('Processing request:', request);
        return {
          ...request,
          key: request._id,
          studentName: request.borrower?.fullName || 'N/A',
          equipmentDetails: (request.equipments || []).map(eq => ({
            name: eq.equipment?.name || 'Unknown Equipment',
            quantity: eq.quantity || 0
          })),
          borrowDate: request.borrowDate ? dayjs(request.borrowDate).format('DD/MM/YYYY') : 'N/A',
          expectedReturnDate: request.expectedReturnDate ? dayjs(request.expectedReturnDate).format('DD/MM/YYYY HH:mm') : 'N/A',
          actualReturnDate: request.actualReturnDate ? dayjs(request.actualReturnDate).format('DD/MM/YYYY HH:mm') : null
        };
      });

      console.log('Formatted Requests:', formattedRequests);
      setRequests(formattedRequests);

    } catch (error: any) {
      console.error('Error fetching requests:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        stack: error.stack
      });
      message.error('Không thể tải danh sách yêu cầu mượn: ' + (error.response?.data?.message || error.message));
      setRequests([]); 
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (requestId: string, newStatus: string, reason?: string) => {
    try {
      let endpoint = '';
      let data = {};
      
      switch (newStatus) {
        case 'approved':
          endpoint = `/api/requests/${requestId}/approve`;
          data = { notes: reason };
          break;
        case 'rejected':
          endpoint = `/api/requests/${requestId}/reject`;
          data = { reason };
          break;
        case 'borrowed':
          endpoint = `/api/requests/${requestId}/borrow`;
          break;
        case 'returned':
          endpoint = `/api/requests/${requestId}/return`;
          break;
        default:
          throw new Error('Invalid status');
      }

      const response = await axiosClient.put(endpoint, data);

      if (response.data?.status === 'success') {
        message.success('Cập nhật trạng thái thành công');
        await fetchRequests(); // Refresh data
        if (newStatus === 'rejected') {
          setRejectModalVisible(false);
          rejectForm.resetFields();
        }
      } else {
        throw new Error(response.data?.message || 'Failed to update status');
      }
    } catch (error: any) {
      console.error('Error updating status:', error);
      message.error(error.response?.data?.message || error.message || 'Không thể cập nhật trạng thái');
    }
  };

  const showRejectModal = (request: BorrowRequest) => {
    setSelectedRequest(request);
    setRejectModalVisible(true);
  };

  const showDetailModal = (request: BorrowRequest) => {
    setSelectedRequest(request);
    setModalVisible(true);
  };

  const columns: ColumnsType<BorrowRequest> = [
    {
      title: 'Sinh viên',
      dataIndex: 'studentName',
      key: 'studentName',
    },
    {
      title: 'Thiết bị',
      dataIndex: 'equipmentDetails',
      key: 'equipmentDetails',
      render: (equipments) => (
        <>
          {equipments.map((eq: any, index: number) => (
            <div key={index}>
              {eq.name} (SL: {eq.quantity})
            </div>
          ))}
        </>
      ),
    },
    {
      title: 'Ngày mượn',
      dataIndex: 'borrowDate',
      key: 'borrowDate',
    },
    {
      title: 'Ngày giờ trả dự kiến',
      dataIndex: 'expectedReturnDate',
      key: 'expectedReturnDate',
      width: 140,
    },
    {
      title: 'Ngày giờ trả thực tế',
      dataIndex: 'actualReturnDate',
      key: 'actualReturnDate',
      width: 140,
      render: (date: string) => date || '-'
    },
    {
      title: 'Trạng thái',
      key: 'status',
      dataIndex: 'status',
      render: (status: string) => {
        let color = 'default';
        let text = 'Unknown';

        switch (status) {
          case 'pending':
            color = 'processing';
            text = 'Chờ duyệt';
            break;
          case 'approved':
            color = 'warning';
            text = 'Đã duyệt';
            break;
          case 'borrowed':
            color = 'success';
            text = 'Đang mượn';
            break;
          case 'rejected':
            color = 'error';
            text = 'Từ chối';
            break;
          case 'returned':
            color = 'default';
            text = 'Đã trả';
            break;
        }

        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Xem chi tiết">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => showDetailModal(record)}
            />
          </Tooltip>
          
          {record.status === 'pending' && (
            <>
              <Tooltip title="Duyệt yêu cầu">
                <Button
                  type="text"
                  icon={<CheckOutlined style={{ color: '#52c41a' }} />}
                  onClick={() => {
                    confirm({
                      title: 'Xác nhận duyệt yêu cầu mượn?',
                      icon: <ExclamationCircleOutlined />,
                      content: 'Bạn có chắc chắn muốn duyệt yêu cầu mượn này?',
                      onOk() {
                        handleStatusChange(record._id, 'approved');
                      }
                    });
                  }}
                />
              </Tooltip>
              
              <Tooltip title="Từ chối yêu cầu">
                <Button
                  type="text"
                  icon={<CloseOutlined style={{ color: '#ff4d4f' }} />}
                  onClick={() => showRejectModal(record)}
                />
              </Tooltip>
            </>
          )}

          {record.status === 'approved' && (
            <Tooltip title="Xác nhận cho mượn">
              <Button
                type="primary"
                onClick={() => {
                  confirm({
                    title: 'Xác nhận cho mượn thiết bị?',
                    icon: <ExclamationCircleOutlined />,
                    content: 'Bạn có chắc chắn muốn cho mượn thiết bị này?',
                    onOk() {
                      handleStatusChange(record._id, 'borrowed');
                    }
                  });
                }}
              >
                Cho mượn
              </Button>
            </Tooltip>
          )}

          {record.status === 'borrowed' && (
            <Tooltip title="Xác nhận trả thiết bị">
              <Button
                type="primary"
                onClick={() => {
                  confirm({
                    title: 'Xác nhận trả thiết bị?',
                    icon: <ExclamationCircleOutlined />,
                    content: 'Bạn có chắc chắn muốn xác nhận trả thiết bị này?',
                    onOk() {
                      handleStatusChange(record._id, 'returned');
                    }
                  });
                }}
              >
                Xác nhận trả
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <div className="p-6">
      <Card>
        <Title level={2}>Quản lý yêu cầu mượn thiết bị</Title>
        
        <Table
          columns={columns}
          dataSource={requests}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />

        {/* Chi tiết yêu cầu mượn */}
        <Modal
          title="Chi tiết yêu cầu mượn"
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
        >
          {selectedRequest && (
            <div className="space-y-4">
              <div>
                <p className="font-semibold">Sinh viên:</p>
                <p>{selectedRequest.studentName}</p>
              </div>
              
              <div>
                <p className="font-semibold">Thiết bị:</p>
                <p>{selectedRequest.equipmentDetails.map(eq => eq.name).join(', ')}</p>
              </div>

              <div>
                <p className="font-semibold">Số lượng:</p>
                <p>{selectedRequest.equipmentDetails.map(eq => eq.quantity).join(', ')}</p>
              </div>

              <div>
                <p className="font-semibold">Ngày mượn:</p>
                <p>{selectedRequest.borrowDate}</p>
              </div>

              <div>
                <p className="font-semibold">Ngày giờ trả dự kiến:</p>
                <p>{selectedRequest.expectedReturnDate}</p>
              </div>

              <div>
                <p className="font-semibold">Trạng thái:</p>
                <p>{selectedRequest.status}</p>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal từ chối yêu cầu */}
        <Modal
          title="Từ chối yêu cầu mượn"
          open={rejectModalVisible}
          onCancel={() => {
            setRejectModalVisible(false);
            rejectForm.resetFields();
          }}
          footer={null}
        >
          <Form
            form={rejectForm}
            layout="vertical"
            onFinish={(values) => {
              if (selectedRequest) {
                handleStatusChange(selectedRequest._id, 'rejected', values.reason);
              }
            }}
          >
            <Form.Item
              name="reason"
              label="Lý do từ chối"
              rules={[
                { required: true, message: 'Vui lòng nhập lý do từ chối' },
                { min: 5, message: 'Lý do từ chối phải có ít nhất 5 ký tự' }
              ]}
            >
              <TextArea rows={4} placeholder="Nhập lý do từ chối yêu cầu mượn..." />
            </Form.Item>

            <Form.Item className="mb-0 text-right">
              <Space>
                <Button onClick={() => {
                  setRejectModalVisible(false);
                  rejectForm.resetFields();
                }}>
                  Hủy
                </Button>
                <Button type="primary" danger htmlType="submit">
                  Xác nhận từ chối
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default BorrowRequests; 
 