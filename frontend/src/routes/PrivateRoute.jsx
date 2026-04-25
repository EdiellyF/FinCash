import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function PrivateRoute({ children }) {
  const { user, booting } = useAuth();

  if (booting) return <div className="p-10">Carregando...</div>;
  return user ? children : <Navigate to="/login" replace />;
}
