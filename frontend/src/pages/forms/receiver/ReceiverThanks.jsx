import React from 'react';
import { Link } from 'react-router-dom';
import '../ThanksStyles.css';

const HeartbeatIcon = () => {
  return (
    <svg 
      className="heartbeat-icon"
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 512 512"
    >
      <path 
        d="M47.5 309.9c-9.4-9.4-9.4-24.6 0-33.9l46.9-46.9c9.4-9.4 24.6-9.4 33.9 0 9.4 9.4 9.4 24.6 0 33.9l-30.9 30.9 30.9 30.9c9.4 9.4 9.4 24.6 0 33.9-9.4 9.4-24.6 9.4-33.9 0l-46.9-46.9zM256 160c17.7 0 32-14.3 32-32s-14.3-32-32-32-32 14.3-32 32 14.3 32 32 32zm128 192c0 17.7-14.3 32-32 32s-32-14.3-32-32 14.3-32 32-32 32 14.3 32 32zm32-128c-17.7 0-32 14.3-32 32s14.3 32 32 32 32-14.3 32-32-14.3-32-32-32zm-256 32c0-17.7-14.3-32-32-32s-32 14.3-32 32 14.3 32 32 32 32-14.3 32-32zm96-128c-17.7 0-32 14.3-32 32s14.3 32 32 32 32-14.3 32-32-14.3-32-32-32zm160 160c0 17.7-14.3 32-32 32s-32-14.3-32-32 14.3-32 32-32 32 14.3 32 32z"
      />
    </svg>
  );
};

const ReceiverThankYou = () => {
  return (
    <div className="thank-you-container">
      <div className="thank-you-card">
        <h1>Your Blood Request Has Been Submitted!</h1>
        <div className="icon-container">
          <HeartbeatIcon />
        </div>
        
        <div className="info-section">
          <h2>What Happens Next?</h2>
          <ul>
            <li>Our team will verify your prescription and request details</li>
            <li>We'll match you with suitable donors in your area</li>
            <li>You'll receive a call within 24 hours with potential donor matches</li>
            <li>You can check your request status in your dashboard</li>
          </ul>
        </div>

        <div className="emergency-contact">
          <h3>Emergency?</h3>
          <p>If this is a life-threatening emergency, please call our 24/7 helpline:</p>
          <a href="tel:+1234567890" className="emergency-number">+1 (234) 567-890</a>
        </div>

        <div className="quick-links">
          <h3>Quick Links</h3>
          <div className="link-buttons">
            <Link to="/request-status" className="link-button">
              Check Request Status
            </Link>
            <Link to="/faq" className="link-button">
              Frequently Asked Questions
            </Link>
            <Link to="/receiver-dashboard" className="link-button">
              Your Receiver Dashboard
            </Link>
          </div>
        </div>

        <Link to="/home " className="return-home">
          Return to Home Page
        </Link>
      </div>
    </div>
  );
};

export default ReceiverThankYou;