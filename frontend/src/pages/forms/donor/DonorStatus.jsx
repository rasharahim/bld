import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from '@/utils/axios';
import "./DonorStatus.css";

const DonorStatusPage = () => {
  const { donorId } = useParams();
  const [donorStatus, setDonorStatus] = useState("pending");
  const [bloodRequests, setBloodRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDonorStatus = async () => {
      try {
        const response = await api.get('/api/donors/status');
        if (response.data.success) {
          setDonorStatus(response.data.status);
          if (response.data.status === 'approved') {
            fetchBloodRequests();
          }
        } else {
          setError('Failed to fetch donor status');
        }
      } catch (err) {
        console.error('Error fetching donor status:', err);
        setError('Failed to fetch donor status');
      } finally {
        setLoading(false);
      }
    };

    fetchDonorStatus();
  }, []);

  const fetchBloodRequests = async () => {
    try {
      const response = await api.get('/api/blood-requests');
      if (response.data.success) {
        setBloodRequests(response.data.requests || []);
      }
    } catch (err) {
      console.error('Error fetching blood requests:', err);
    }
  };

  const handleAcceptRequest = async (id) => {
    try {
      const response = await api.post('/api/donors/accept-request', {
        requestId: id
      });

      if (response.data.success) {
        alert('Request accepted! You can now contact the receiver.');
        fetchBloodRequests(); // Refresh the list
      } else {
        throw new Error(response.data.message || 'Failed to accept request');
      }
    } catch (err) {
      console.error('Error accepting request:', err);
      alert(err.message || 'Error accepting request');
    }
  };

  if (loading) {
    return (
      <div className="status-container">
        <div className="loading">Loading donor status...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="status-container">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="status-container">
      <h1>Donor Status</h1>
      
      {donorStatus === "pending" && (
        <div className="status-message pending">
          <p>Your donation application is under review. Please wait for admin approval.</p>
        </div>
      )}

      {donorStatus === "rejected" && (
        <div className="status-message rejected">
          <p>Your donation application has been rejected. Please contact support for more information.</p>
        </div>
      )}

      {donorStatus === "approved" && (
        <div className="status-message approved">
          <p>Your donor status is <strong>Approved</strong>. You can now accept blood requests.</p>
          
          <div className="blood-requests-section">
            <h2>Nearby Blood Requests</h2>
            {bloodRequests.length > 0 ? (
              <div className="request-list">
                {bloodRequests.map(request => (
                  <div key={request.id} className="request-card">
                    <div className="request-info">
                      <h3>{request.user_name}</h3>
                      <p><strong>Blood Type:</strong> {request.blood_type}</p>
                      <p><strong>Distance:</strong> {request.distance} km</p>
                      <p><strong>Location:</strong> {request.address}</p>
                    </div>
                    <button 
                      className="accept-btn"
                      onClick={() => handleAcceptRequest(request.id)}
                    >
                      Accept Request
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-requests">No blood requests available in your area at the moment.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DonorStatusPage;