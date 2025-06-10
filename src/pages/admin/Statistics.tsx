import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { useTheme } from '@mui/material/styles';
import { axiosPrivate } from '../../utils/axios';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const Statistics = () => {
  const theme = useTheme();
  const [equipmentStats, setEquipmentStats] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [period, setPeriod] = useState('monthly');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch equipment borrow statistics
  const fetchEquipmentStats = async () => {
    try {
      let url = '/api/statistics/equipment-borrow-stats';
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (params.toString()) url += '?' + params.toString();

      const response = await axiosPrivate.get(url);
      setEquipmentStats(response.data.data.equipmentStats);
      setSummary(response.data.data.summary);
    } catch (error) {
      console.error('Error fetching equipment stats:', error);
    }
  };

  // Fetch borrowing trends
  const fetchTrends = async () => {
    try {
      const response = await axiosPrivate.get('/api/statistics/borrowing-trends', {
        params: { period }
      });
      setTrends(response.data.data);
    } catch (error) {
      console.error('Error fetching trends:', error);
    }
  };

  useEffect(() => {
    fetchEquipmentStats();
  }, [startDate, endDate]);

  useEffect(() => {
    fetchTrends();
  }, [period]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatCategory = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      electronics: 'Thiết bị điện tử',
      furniture: 'Nội thất',
      sports: 'Dụng cụ thể thao',
      laboratory: 'Thiết bị phòng thí nghiệm',
      audio_visual: 'Thiết bị nghe nhìn',
      other: 'Khác'
    };
    return categoryMap[category] || category;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Thống kê mượn thiết bị
      </Typography>

      {/* Summary Cards */}
      {summary && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Tổng số thiết bị
                </Typography>
                <Typography variant="h5">{summary.totalEquipments}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Tổng lượt mượn
                </Typography>
                <Typography variant="h5">{summary.totalBorrowCount}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Đang cho mượn
                </Typography>
                <Typography variant="h5">{summary.totalCurrentlyBorrowed}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Tỷ lệ sử dụng TB
                </Typography>
                <Typography variant="h5">
                  {summary.averageUtilizationRate.toFixed(1)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Từ ngày"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Đến ngày"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Thời gian</InputLabel>
            <Select
              value={period}
              label="Thời gian"
              onChange={(e) => setPeriod(e.target.value)}
            >
              <MenuItem value="daily">Theo ngày</MenuItem>
              <MenuItem value="weekly">Theo tuần</MenuItem>
              <MenuItem value="monthly">Theo tháng</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Equipment Usage Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Top thiết bị được mượn nhiều nhất
            </Typography>
            <ResponsiveContainer>
              <BarChart
                data={equipmentStats.slice(0, 10)}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="totalBorrowCount"
                  name="Số lượt mượn"
                  fill={theme.palette.primary.main}
                />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Borrowing Trends Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Xu hướng mượn thiết bị theo thời gian
            </Typography>
            <ResponsiveContainer>
              <LineChart
                data={trends}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="borrowCount"
                  name="Số lượt mượn"
                  stroke={theme.palette.primary.main}
                />
                <Line
                  type="monotone"
                  dataKey="totalItems"
                  name="Số thiết bị"
                  stroke={theme.palette.secondary.main}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Detailed Table */}
      <Paper sx={{ mt: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tên thiết bị</TableCell>
                <TableCell>Mã</TableCell>
                <TableCell>Loại</TableCell>
                <TableCell align="right">Tổng số lượng</TableCell>
                <TableCell align="right">Số lượt mượn</TableCell>
                <TableCell align="right">Đang mượn</TableCell>
                <TableCell align="right">Tỷ lệ sử dụng</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {equipmentStats
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => (
                  <TableRow key={row._id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.code}</TableCell>
                    <TableCell>{formatCategory(row.category)}</TableCell>
                    <TableCell align="right">{row.totalQuantity}</TableCell>
                    <TableCell align="right">{row.totalBorrowCount}</TableCell>
                    <TableCell align="right">{row.currentlyBorrowed}</TableCell>
                    <TableCell align="right">
                      {row.utilizationRate.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={equipmentStats.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default Statistics; 