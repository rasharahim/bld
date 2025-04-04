import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaArrowRight } from 'react-icons/fa';
import '../FormStyles.css';

const ReceiverThanks = () => {
  const navigate = useNavigate();

  const handleCheckStatus = () => {
    navigate('/request-status'); // Navigate to request status page instead of dashboard
  };

  return (
    <div className="form-container thanks-container">
      <div className="thanks-content">
        <FaCheckCircle className="success-icon" />
        <h2>Request Submitted Successfully!</h2>
        <p>Your blood request has been submitted and is being processed.</p>
        <p>You can check the status of your request by clicking the button below.</p>
        
        <button 
          className="submit-btn check-status-btn"
          onClick={handleCheckStatus}
        >
          Check Request Status <FaArrowRight className="btn-icon" />
        </button>
      </div>
    </div>
  );
};

export default ReceiverThanks;