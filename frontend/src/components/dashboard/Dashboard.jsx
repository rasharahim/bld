import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Dashboard.css';

const Dashboard = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState('');
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setActiveLink(location.pathname);
  }, [location]);

  const navLinks = [
    { path: '/home', name: 'Home', icon: 'fa-home' },
    { path: '/donor-form', name: 'Donate', icon: 'fa-tint' },
    { path: '/receiver-form', name: 'Request Blood', icon: 'fa-hand-holding-medical' },
    { path: '/profile', name: 'My Profile', icon: 'fa-user' }
  ];

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
          {navLinks.map((link) => (
            <Link 
              key={link.path}
              to={link.path}
              className={`dashboard-link ${activeLink === link.path ? 'active' : ''}`}
            >
              <i className={`fas ${link.icon}`}></i>
              <span>{link.name}</span>
              {activeLink === link.path && (
                <motion.div 
                  className="nav-indicator"
                  layoutId="navIndicator"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </div>

        <div className="dashboard-actions">
          <button className="notification-btn">
            <i className="fas fa-bell"></i>
            <span className="notification-badge">3</span>
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