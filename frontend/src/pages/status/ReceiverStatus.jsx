import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import './ReceiverStatus.css';

const ReceiverStatus = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get('/api/receivers/my-requests', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data.success) {
          setRequests(response.data.requests || []);
        } else {
          setError(response.data.message || 'Failed to fetch requests');
        }
      } catch (err) {
        console.error('Error fetching requests:', err);
        if (err.response?.status === 404) {
          setError('You have not made any blood requests yet');
        } else if (err.response?.status === 401) {
          setError('Please log in again');
          navigate('/login');
        } else {
          setError('Error fetching requests. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="status-container">Loading...</div>;
  }

  if (error) {
    return (
      <div className="status-container">
        <div className="error-message">{error}</div>
        {error === 'You have not made any blood requests yet' && (
          <button 
            className="request-button"
            onClick={() => navigate('/receiver/request')}
          >
            Make a Blood Request
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="status-container">
      <h2>Blood Request Status</h2>
      {requests.length === 0 ? (
        <div className="no-requests">
          <p>You have not made any blood requests yet.</p>
          <button 
            className="request-button"
            onClick={() => navigate('/receiver/request')}
          >
            Make a Blood Request
          </button>
        </div>
      ) : (
        <div className="requests-list">
          {requests.map(request => (
            <div key={request.id} className="request-card">
              <div className="request-header">
                <h3>Request #{request.id}</h3>
                <span className={`status-badge ${request.status.toLowerCase()}`}>
                  {request.status}
                </span>
              </div>
              
              <div className="request-details">
                <div className="info-section">
                  <h4>Request Information</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="label">Blood Type:</span>
                      <span className="value">{request.bloodType}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Request Date:</span>
                      <span className="value">{formatDate(request.createdAt)}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Reason:</span>
                      <span className="value">{request.reasonForRequest}</span>
                    </div>
                  </div>
                </div>

                <div className="info-section">
                  <h4>Contact Information</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="label">Contact:</span>
                      <span className="value">{request.contactNumber}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Location:</span>
                      <span className="value">
                        {request.address}, {request.district}, {request.state}, {request.country}
                      </span>
                    </div>
                  </div>
                </div>

                {request.prescriptionPath && (
                  <div className="info-section">
                    <h4>Prescription</h4>
                    <div className="prescription">
                      <img 
                        src={request.prescriptionPath} 
                        alt="Prescription" 
                        className="prescription-image"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReceiverStatus; 