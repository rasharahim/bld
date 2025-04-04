import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCheck, FaTimes, FaSpinner } from 'react-icons/fa';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [receiverRequests, setReceiverRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReceiverRequests();
  }, []);

  const fetchReceiverRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/receiver-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReceiverRequests(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError('Failed to load receiver requests');
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/receivers/${requestId}/status`, 
        { status },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      
      // Refresh the requests list
      fetchReceiverRequests();
      
      alert(`Request ${status} successfully`);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update request status');
    }
  };

  const viewPrescription = (prescriptionPath) => {
    if (prescriptionPath) {
      window.open(`http://localhost:5000/uploads/prescriptions/${prescriptionPath}`, '_blank');
    } else {
      alert('No prescription uploaded');
    }
  };

  if (loading) return <div className="admin-loading">Loading...</div>;
  if (error) return <div className="admin-error">{error}</div>;

  return (
    <div className="admin-dashboard">
      <h2>Blood Request Management</h2>
      
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
            
            {request.status === 'pending' && (
              <div className="action-buttons">
                <button
                  className="approve-btn"
                  onClick={() => handleStatusUpdate(request.id, 'approved')}
                >
                  <FaCheck /> Approve
                </button>
                <button
                  className="reject-btn"
                  onClick={() => handleStatusUpdate(request.id, 'rejected')}
                >
                  <FaTimes /> Reject
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
    </div>
  );
};

export default AdminDashboard; 