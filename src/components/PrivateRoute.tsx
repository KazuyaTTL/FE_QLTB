import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectUserRole, selectCurrentUser } from '../store/slices/authSlice';

interface PrivateRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'student';
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, requiredRole }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const userRole = useSelector(selectUserRole);
  const currentUser = useSelector(selectCurrentUser);
  const location = useLocation();

  console.log('PrivateRoute Debug:', {
    isAuthenticated,
    userRole,
    currentUser,
    requiredRole,
    currentPath: location.pathname
  });

  // Nếu chưa đăng nhập, chuyển về trang login
  if (!isAuthenticated || !currentUser) {
    console.log('Not authenticated or no user info, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Nếu có yêu cầu về role và role không khớp
  if (requiredRole && userRole !== requiredRole) {
    console.log(`Role mismatch: Required ${requiredRole}, but user is ${userRole}`);
    
    // Chuyển về trang mặc định theo role của user
    const defaultPath = userRole === 'admin' ? '/admin' : '/student/dashboard';
    if (location.pathname !== defaultPath) {
      return <Navigate to={defaultPath} replace />;
    }
  }

  return <>{children}</>;
};

export default PrivateRoute; 
 
 