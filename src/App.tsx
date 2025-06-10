import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { ConfigProvider, theme } from 'antd';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminLayout from './components/layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import EquipmentManagement from './pages/admin/EquipmentManagement';
import BorrowRequests from './pages/admin/BorrowRequests';
import PrivateRoute from './components/PrivateRoute';
import StudentLayout from './components/layouts/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import EquipmentList from './pages/student/EquipmentList';
import BorrowHistory from './pages/student/BorrowHistory';
import { useSelector } from 'react-redux';
import { selectUserRole } from './store/slices/authSlice';
import UserManagement from './pages/admin/UserManagement';
import CreateUser from './pages/admin/CreateUser';
import Statistics from './pages/admin/Statistics';
import Settings from './pages/admin/Settings';

const { defaultAlgorithm } = theme;

function App() {
  return (
    <Provider store={store}>
      <ConfigProvider
        theme={{
          algorithm: defaultAlgorithm,
          token: {
            colorPrimary: '#4F46E5',
            colorSuccess: '#10B981',
            colorWarning: '#F59E0B',
            colorError: '#EF4444',
            colorInfo: '#3B82F6',
            borderRadius: 8,
            wireframe: false,
            fontSize: 14,
          },
          components: {
            Button: {
              controlHeight: 40,
              fontSize: 14,
              borderRadius: 8,
            },
            Input: {
              controlHeight: 40,
              fontSize: 14,
              borderRadius: 8,
            },
            Select: {
              controlHeight: 40,
              fontSize: 14,
              borderRadius: 8,
            },
            Card: {
              borderRadius: 12,
              boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
            },
            Menu: {
              itemHeight: 48,
              itemHoverBg: 'rgba(0, 0, 0, 0.04)',
              itemSelectedBg: 'rgba(79, 70, 229, 0.1)',
              itemSelectedColor: '#4F46E5',
            },
          },
        }}
      >
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <PrivateRoute requiredRole="admin">
                  <AdminLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="users/create" element={<CreateUser />} />
              <Route path="equipment" element={<EquipmentManagement />} />
              <Route path="requests" element={<BorrowRequests />} />
              <Route path="statistics" element={<Statistics />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Student routes */}
            <Route
              path="/student"
              element={
                <PrivateRoute requiredRole="student">
                  <StudentLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/student/dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboard />} />
              <Route path="equipment" element={<EquipmentList />} />
              <Route path="history" element={<BorrowHistory />} />
            </Route>

            {/* Root redirect */}
            <Route
              path="/"
              element={
                <RootRedirect />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ConfigProvider>
    </Provider>
  );
}

// Component to handle root path redirect based on user role
const RootRedirect = () => {
  const userRole = useSelector(selectUserRole);
  
  if (!userRole) {
    return <Navigate to="/login" replace />;
  }
  
  return <Navigate to={userRole === 'admin' ? '/admin' : '/student/dashboard'} replace />;
};

export default App;
