import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom'; // Import useNavigate
import { motion } from 'framer-motion';
import './Dashboard.css';

const Dashboard = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState('');
  const [notifications, setNotifications] = useState([]);
  const location = useLocation();
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No token found. Redirecting to login...");
      navigate("/login"); // Redirect user to login page
      return;
    }

    setActiveLink(location.pathname);
    fetchNotifications(token); // Call function to fetch notifications
  }, [location, navigate]);

  const fetchNotifications = async (token) => {
    try {
      const response = await fetch("http://localhost:5000/api/notifications", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  return (
    <motion.div 
      className={`dashboard ${isScrolled ? 'scrolled' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="dashboard-container">
        <div className="dashboard-brand">
          <i className="fas fa-heartbeat"></i>
          <span>BloodConnect</span>
        </div>
        <div className="dashboard-nav">
          <Link to="/home" className={`dashboard-link ${activeLink === '/home' ? 'active' : ''}`}>
            <i className="fas fa-home"></i>
            <span>Home</span>
          </Link>
          <Link to="/donor-form" className={`dashboard-link ${activeLink === '/donor-form' ? 'active' : ''}`}>
            <i className="fas fa-tint"></i>
            <span>Donate</span>
          </Link>
          <Link to="/receiver-form" className={`dashboard-link ${activeLink === '/receiver-form' ? 'active' : ''}`}>
            <i className="fas fa-hand-holding-medical"></i>
            <span>Request Blood</span>
          </Link>
          <Link to="/profile" className={`dashboard-link ${activeLink === '/profile' ? 'active' : ''}`}>
            <i className="fas fa-user"></i>
            <span>My Profile</span>
          </Link>
        </div>
        <div className="dashboard-actions">
          <button className="notification-btn">
            <i className="fas fa-bell"></i>
            {notifications.length > 0 && <span className="notification-badge">{notifications.length}</span>}
          </button>
          <div className="user-avatar">
            <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
