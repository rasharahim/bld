import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './DonorStatusPage.css';

const DonorStatusPage = () => {
  const { donorId } = useParams();
  const [donorStatus, setDonorStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDonorStatus = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/donors/${donorId}/status`);
        setDonorStatus(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch donor status');
      } finally {
        setLoading(false);
      }
    };

    fetchDonorStatus();
  }, [donorId]);

  if (loading) {
    return <div className="status-loading">Loading donor status...</div>;
  }

  if (error) {
    return <div className="status-error">{error}</div>;
  }

  if (!donorStatus) {
    return <div className="status-message">No donor status found.</div>;
  }

  return (
    <div className="donor-status-page">
      <div className="status-header">
        <h1>Donor Status Details</h1>
        <div className={`status-badge ${donorStatus.status.toLowerCase()}`}>
          {donorStatus.status}
        </div>
      </div>

      <div className="status-grid">
        <div className="status-card">
          <h2>Personal Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Name:</span>
              <span className="value">{donorStatus.full_name}</span>
            </div>
            <div className="info-item">
              <span className="label">Blood Type:</span>
              <span className="value">{donorStatus.blood_type}</span>
            </div>
            <div className="info-item">
              <span className="label">Age:</span>
              <span className="value">{donorStatus.age}</span>
            </div>
            <div className="info-item">
              <span className="label">Contact:</span>
              <span className="value">{donorStatus.contact_number}</span>
            </div>
          </div>
        </div>

        <div className="status-card">
          <h2>Donation History</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Last Donation:</span>
              <span className="value">{donorStatus.last_donation_date || 'Never'}</span>
            </div>
            <div className="info-item">
              <span className="label">Donation Gap:</span>
              <span className="value">{donorStatus.donation_gap_months || 0} months</span>
            </div>
            <div className="info-item">
              <span className="label">Total Donations:</span>
              <span className="value">{donorStatus.total_donations || 0}</span>
            </div>
          </div>
        </div>

        <div className="status-card">
          <h2>Health Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Health Conditions:</span>
              <span className="value">{donorStatus.health_conditions || 'None'}</span>
            </div>
            <div className="info-item">
              <span className="label">Last Health Check:</span>
              <span className="value">{donorStatus.last_health_check || 'Not available'}</span>
            </div>
          </div>
        </div>

        <div className="status-card">
          <h2>Location</h2>
          <div className="info-grid">
            <div className="info-item">
              <span className="label">Address:</span>
              <span className="value">{donorStatus.location_address}</span>
            </div>
            <div className="info-item">
              <span className="label">District:</span>
              <span className="value">{donorStatus.location_district}</span>
            </div>
            <div className="info-item">
              <span className="label">State:</span>
              <span className="value">{donorStatus.location_state}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorStatusPage; 