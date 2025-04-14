import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCheckCircle, FaArrowRight } from 'react-icons/fa';
import '../FormStyles.css';

const ReceiverThanks = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const requestId = queryParams.get('requestId');

  const handleCheckStatus = () => {
    navigate(`/request-status/${requestId}`);
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