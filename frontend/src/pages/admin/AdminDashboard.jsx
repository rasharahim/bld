import React, { useState, useEffect } from 'react';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaTint, FaCalendarAlt, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import api from '@/utils/axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('donors');
  const [donors, setDonors] = useState([]);
  const [receiverRequests, setReceiverRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (activeTab === 'donors') {
      fetchDonors();
    } else {
      fetchReceiverRequests();
    }
  }, [activeTab]);

  const fetchDonors = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/admin/donors');
      console.log('Donors data received:', response.data);
      if (response.data.success && Array.isArray(response.data.data)) {
        setDonors(response.data.data);
      } else {
        setError('Invalid data format received from server');
      }
    } catch (err) {
      setError('Failed to fetch donors. Please try again later.');
      console.error('Error fetching donors:', err);
    }
    setLoading(false);
  };

  const fetchReceiverRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching receiver requests...');
      const response = await api.get('/api/admin/receiver-requests');
      console.log('Receiver requests response:', response.data);
      
      if (response.data.success && Array.isArray(response.data.data)) {
        console.log('Setting receiver requests:', response.data.data);
        setReceiverRequests(response.data.data);
      } else {
        console.error('Invalid data format:', response.data);
        setError('Invalid data format received from server');
      }
    } catch (err) {
      console.error('Error fetching receiver requests:', err.response?.data || err.message);
      setError('Failed to fetch receiver requests. Please try again later.');
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      console.log('Updating request status:', { requestId, newStatus });
      const response = await api.put(`/api/admin/receiver-requests/${requestId}/status`, { 
        status: newStatus.toLowerCase() // Convert to lowercase to match backend
      });
      console.log('Status update response:', response.data);
      await fetchReceiverRequests(); // Refresh the list after update
    } catch (err) {
      console.error('Error updating request status:', {
        error: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      alert('Failed to update request status. Please try again.');
    }
  };

  const viewPrescription = (prescriptionUrl) => {
    if (prescriptionUrl) {
      window.open(prescriptionUrl, '_blank');
    }
  };

  const handleDonorStatusUpdate = async (donorId, newStatus) => {
    try {
      await api.put(`/api/admin/donors/${donorId}/status`, { status: newStatus });
      fetchDonors();
    } catch (err) {
      console.error('Error updating donor status:', err);
      setError('Failed to update donor status. Please try again.');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="tab-buttons">
        <button 
          className={`tab-button ${activeTab === 'donors' ? 'active' : ''}`}
          onClick={() => setActiveTab('donors')}
        >
          Donor Management
        </button>
        <button 
          className={`tab-button ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          Blood Request Management
        </button>
      </div>

      {activeTab === 'donors' ? (
        <div className="donors-container">
          {donors.map(donor => (
            <div key={donor.id} className="donor-card">
              <div className="donor-header">
                <h3>{donor.full_name}</h3>
                <span className={`status-badge ${donor.status || 'pending'}`}>
                  {donor.status || 'pending'}
                </span>
              </div>
              <div className="donor-details">
                <p>
                  <FaTint />
                  <strong>Blood Type:</strong> {donor.blood_type || 'Not specified'}
                </p>
                <p>
                  <FaPhone />
                  <strong>Phone:</strong> {donor.phone_number || 'Not specified'}
                </p>
                <p>
                  <FaEnvelope />
                  <strong>Email:</strong> {donor.email || 'Not specified'}
                </p>
                <p>
                  <FaCalendarAlt />
                  <strong>Age:</strong> {donor.age ? `${donor.age} years` : 'Not specified'}
                </p>
                {(donor.location_lat && donor.location_lng) || donor.address ? (
                  <div className="location-info">
                    <FaMapMarkerAlt className="location-icon" />
                    <div>
                      {donor.address && <p>{donor.address}</p>}
                      {donor.location_lat && donor.location_lng && (
                        <p className="coordinates">
                          ({donor.location_lat.toFixed(6)}, {donor.location_lng.toFixed(6)})
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="no-location">No location information available</p>
                )}
              </div>
              {(!donor.status || donor.status === 'pending') && (
                <div className="action-buttons">
                  <button
                    className="approve-btn"
                    onClick={() => handleDonorStatusUpdate(donor.id, 'approved')}
                  >
                    <FaCheckCircle /> Approve
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => handleDonorStatusUpdate(donor.id, 'rejected')}
                  >
                    <FaTimesCircle /> Reject
                  </button>
                </div>
              )}
              {donor.status && donor.status !== 'pending' && (
                <div className="status-message">
                  {donor.status === 'approved' ? (
                    <p className="approved-message">
                      <FaCheckCircle /> Approved as blood donor
                    </p>
                  ) : donor.status === 'rejected' ? (
                    <p className="rejected-message">
                      <FaTimesCircle /> Application rejected
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="requests-container">
          {receiverRequests.map((request) => (
            <div key={request.id} className={`request-card status-${request.status}`}>
              <div className="request-header">
                <h3>{request.full_name}</h3>
                <span className={`status-badge ${request.status}`}>
                  {request.status}
                </span>
              </div>
              
              <div className="request-details">
                <p><strong>Blood Type:</strong> {request.blood_type}</p>
                <p><strong>Age:</strong> {request.age}</p>
                <p><strong>Contact:</strong> {request.contact_number}</p>
                <p><strong>Location:</strong> {request.address}</p>
                <p><strong>Reason:</strong> {request.reason_for_request}</p>
                
                {request.prescription_path && (
                  <button 
                    className="view-prescription-btn"
                    onClick={() => viewPrescription(request.prescription_path)}
                  >
                    View Prescription
                  </button>
                )}
              </div>
              
              {(request.status || '').toLowerCase() === 'pending' && (
                <div className="action-buttons">
                  <button
                    className="approve-btn"
                    onClick={() => handleStatusUpdate(request.id, 'approved')}
                  >
                    <FaCheckCircle /> Approve
                  </button>
                  <button
                    className="reject-btn"
                    onClick={() => handleStatusUpdate(request.id, 'rejected')}
                  >
                    <FaTimesCircle /> Reject
                  </button>
                </div>
              )}

              {request.status === 'approved' && request.selected_donor && (
                <div className="donor-match">
                  <h4>Selected Donor</h4>
                  <p><strong>Name:</strong> {request.selected_donor.name}</p>
                  <p><strong>Contact:</strong> {request.selected_donor.contact}</p>
                  <p><strong>Status:</strong> {request.donation_status || 'Pending'}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 