import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Status.css';

const Status = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const [statusData, setStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [donors, setDonors] = useState([]);

  // Simulate fetching status data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data based on type
      if (type === 'donation') {
        setStatusData({
          id,
          type: 'Donation',
          date: '2023-06-15',
          status: 'Pending',
          bloodType: 'O+',
          location: 'City Blood Bank',
          notes: 'Your donation is being processed. We will notify you when someone requests your blood type.'
        });
      } else if (type === 'request') {
        setStatusData({
          id,
          type: 'Request',
          date: '2023-06-15',
          status: 'Pending',
          bloodType: 'B-',
          urgency: 'High',
          quantity: '2 units',
          hospital: 'City General Hospital'
        });

        // Mock donor list for request
        setDonors([
          {
            id: 'd1',
            name: 'John Smith',
            bloodType: 'B-',
            distance: '2.5 km',
            lastDonation: '2023-05-20',
            availability: 'Available this week',
            contact: '+1 (555) 987-6543'
          },
          {
            id: 'd2',
            name: 'Sarah Johnson',
            bloodType: 'B-',
            distance: '3.1 km',
            lastDonation: '2023-04-15',
            availability: 'Available tomorrow',
            contact: '+1 (555) 123-4567'
          },
          {
            id: 'd3',
            name: 'Michael Brown',
            bloodType: 'B-',
            distance: '5.7 km',
            lastDonation: '2023-06-01',
            availability: 'Available today',
            contact: '+1 (555) 789-0123'
          }
        ]);
      }
      
      setLoading(false);
    };

    fetchData();
  }, [type, id]);

  const handleDonorSelect = (donorId) => {
    setSelectedDonor(donorId);
  };

  const handleConfirmSelection = () => {
    if (selectedDonor) {
      // In a real app, this would call an API to confirm the donor selection
      alert(`Donor ${selectedDonor} has been selected. They will be notified.`);
      navigate('/profile');
    }
  };

  const handleCancelRequest = () => {
    // In a real app, this would call an API to cancel the request
    if (window.confirm('Are you sure you want to cancel this request?')) {
      alert('Request has been cancelled.');
      navigate('/profile');
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="status-container">
        <div className="loading-spinner">Loading status...</div>
      </div>
    );
  }

  return (
    <div className="status-container">
      <div className="status-header">
        <h2>{statusData.type} Status</h2>
        <span className={`status-badge ${statusData.status.toLowerCase()}`}>
          {statusData.status}
        </span>
      </div>

      <div className="status-details">
        <div className="detail-group">
          <label>Date:</label>
          <p>{formatDate(statusData.date)}</p>
        </div>
        <div className="detail-group">
          <label>Blood Type:</label>
          <p>{statusData.bloodType}</p>
        </div>

        {type === 'donation' && (
          <>
            <div className="detail-group">
              <label>Location:</label>
              <p>{statusData.location}</p>
            </div>
            <div className="status-message">
              <h3>Current Status</h3>
              <p>{statusData.notes}</p>
              <div className="status-timeline">
                <div className={`timeline-step ${statusData.status === 'Pending' ? 'active' : ''}`}>
                  <div className="step-marker">1</div>
                  <div className="step-info">
                    <h4>Donation Submitted</h4>
                    <p>Your donation information has been received</p>
                  </div>
                </div>
                <div className={`timeline-step ${statusData.status === 'Processing' ? 'active' : ''}`}>
                  <div className="step-marker">2</div>
                  <div className="step-info">
                    <h4>Waiting for Match</h4>
                    <p>We'll notify you when someone needs your blood type</p>
                  </div>
                </div>
                <div className={`timeline-step ${statusData.status === 'Completed' ? 'active' : ''}`}>
                  <div className="step-marker">3</div>
                  <div className="step-info">
                    <h4>Donation Completed</h4>
                    <p>Your blood has helped save a life!</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {type === 'request' && (
          <>
            <div className="detail-group">
              <label>Hospital:</label>
              <p>{statusData.hospital}</p>
            </div>
            <div className="detail-group">
              <label>Urgency:</label>
              <p>{statusData.urgency}</p>
            </div>
            <div className="detail-group">
              <label>Quantity Needed:</label>
              <p>{statusData.quantity}</p>
            </div>

            <div className="donor-selection">
              <h3>Available Donors in Your Area</h3>
              {donors.length > 0 ? (
                <>
                  <div className="donor-list">
                    {donors.map(donor => (
                      <div 
                        key={donor.id} 
                        className={`donor-card ${selectedDonor === donor.id ? 'selected' : ''}`}
                        onClick={() => handleDonorSelect(donor.id)}
                      >
                        <div className="donor-info">
                          <h4>{donor.name}</h4>
                          <p><strong>Distance:</strong> {donor.distance}</p>
                          <p><strong>Last Donation:</strong> {formatDate(donor.lastDonation)}</p>
                          <p><strong>Availability:</strong> {donor.availability}</p>
                          <p><strong>Contact:</strong> {donor.contact}</p>
                        </div>
                        <div className="donor-actions">
                          <button 
                            className="contact-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              alert(`Contacting ${donor.name} at ${donor.contact}`);
                            }}
                          >
                            Contact
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="selection-actions">
                    <button 
                      className="confirm-btn"
                      onClick={handleConfirmSelection}
                      disabled={!selectedDonor}
                    >
                      Confirm Donor Selection
                    </button>
                    <button 
                      className="cancel-btn"
                      onClick={handleCancelRequest}
                    >
                      Cancel Request
                    </button>
                  </div>
                </>
              ) : (
                <div className="no-donors">
                  <p>We're currently searching for donors matching your blood type.</p>
                  <p>You'll be notified as soon as we find potential matches.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <button 
        className="back-btn"
        onClick={() => navigate('/profile')}
      >
        Back to Profile
      </button>
    </div>
  );
};

export default Status;