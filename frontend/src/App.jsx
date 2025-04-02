import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Dashboard from './components/dashboard/Dashboard';
import Login from './pages/login/Login';
import Register from './pages/register/Register';
import Home from './pages/home/Home';
import Info from './pages/info/Info';
import ForgotPassword from './pages/forgotpassword/ForgotPassword';
//import Donate from './pages/donate/Donate';
//import RequestBlood from './pages/requestblood/RequestBlood';
import Profile from "./pages/profile/Profile"; 
import DonorForm from './pages/forms/donor/DonorForm';       
import ReceiverForm from "./pages/forms/receiver/ReceiverForm"; 
import ReceiverThanks from "./pages/forms/receiver/ReceiverThanks";
import RequestStatus from "./pages/forms/receiver/RequestStatus";
import DonorStatusPage from './pages/forms/donor/DonorStatus';
import DonorThanks from "./pages/forms/donor/DonorThanks";
import { lazy } from 'react';
import ProfilePage from './pages/profile/Profile';
const AdminDashboard = lazy(() => import('./components/dashboard/AdminDashboard')); // Lazy load AdminDashboard





const App = () => {
  const location = useLocation(); // Get the current route location

  // Define routes where the Dashboard should NOT be displayed
  const excludeDashboardRoutes = ['/login', '/register','/'];

  // Check if the current route is in the exclude list
  const shouldShowDashboard = !excludeDashboardRoutes.includes(location.pathname);

  return (
    <>
      {/* Conditionally render the Dashboard */}
      {shouldShowDashboard && <Dashboard />}

      {/* Routes */}
      <Routes>
        <Route path="/Login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/info" element={<Info />} />
        <Route path="/" element={<Login />} />
        {/*<Route path="/donate" element={<Donate />} /> */}
        <Route path="/donor-form" element={<DonorForm />} />
        <Route path="/donor-thanks" element={<DonorThanks />} />
        <Route path="/donor-status" element={<DonorStatusPage />} />
        <Route path="/receiver-form" element={<ReceiverForm />} />
        <Route path="/receiver-thanks" element={<ReceiverThanks />} />
        <Route path="/request-status" element={<RequestStatus />} />
        <Route path="/profile" element={<ProfilePage />} />
        {/* AdminDashboard is already imported above */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        {/* Add other routes as needed */}
        
        
      </Routes>
    </>
  );
};

// Wrap the App component with Router
const AppWrapper = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;