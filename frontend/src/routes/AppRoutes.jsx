import { BrowserRouter, Route, Routes } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Transactions from '../pages/Transactions';
import Categories from '../pages/Categories';
import Goals from '../pages/Goals';
import Budgets from '../pages/Budgets';
import Reports from '../pages/Reports';
import Profile from '../pages/Profile';
import Education from '../pages/Education';
import Chat from '../pages/Chat';
import Stats from '../pages/Stats';
import VerifyEmail from '../pages/VerifyEmail';
import BackupLogin from '../pages/BackupLogin';
import ResetPasswordWithBackupCode from '../pages/ResetPasswordWithBackupCode';
import SetupTotp from '../pages/SetupTotp';
import PrivacyPolicy from '../pages/PrivacyPolicy';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/setup-totp" element={<SetupTotp />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/reset-password-with-backup-code" element={<ResetPasswordWithBackupCode />} />

        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/transactions" element={<PrivateRoute><Transactions /></PrivateRoute>} />
        <Route path="/categories" element={<PrivateRoute><Categories /></PrivateRoute>} />
        <Route path="/goals" element={<PrivateRoute><Goals /></PrivateRoute>} />
        <Route path="/budgets" element={<PrivateRoute><Budgets /></PrivateRoute>} />
        <Route path="/reports" element={<PrivateRoute><Reports /></PrivateRoute>} />
        <Route path="/education" element={<PrivateRoute><Education /></PrivateRoute>} />
        <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
        <Route path="/stats" element={<PrivateRoute><Stats /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/backup-login" element={<BackupLogin />} />

      </Routes>
    </BrowserRouter>
  );
}
