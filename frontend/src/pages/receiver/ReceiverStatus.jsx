import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './ReceiverStatus.css';

const ReceiverStatus = () => {
  const { requestId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestDetails, setRequestDetails] = useState(null);
  const [donors, setDonors] = useState([]);

  useEffect(() => {
    fetchRequestAndDonors();
  }, [requestId]);

  const fetchRequestAndDonors = async () => {
    try {
      setLoading(true);
      setError(null);

      // First fetch request details
      console.log('Fetching request details...');
      const requestResponse = await axios.get(`http://localhost:5000/api/receivers/request/${requestId}`);
      console.log('Request details response:', requestResponse.data);
      
      if (!requestResponse.data.success) {
        throw new Error(requestResponse.data.message || 'Failed to fetch request details');
      }
      
      setRequestDetails(requestResponse.data.request);

      // Then fetch matching donors
      console.log('Fetching matching donors...');
      const donorsResponse = await axios.get(`http://localhost:5000/api/receivers/${requestId}/location-donors`);
      console.log('Matching donors response:', donorsResponse.data);
      
      if (!donorsResponse.data.success) {
        throw new Error(donorsResponse.data.message || 'Failed to fetch matching donors');
      }

      setDonors(donorsResponse.data.donors || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || err.message || 'An error occurred while fetching data');
      setLoading(false);
    }
  };

  const handleDonorSelection = async (donorId) => {
    try {
      const response = await axios.post(`http://localhost:5000/api/receivers/select-donor`, {
        requestId,
        donorId
      });

      if (response.data.success) {
        // Refresh the data to show updated status
        fetchRequestAndDonors();
      } else {
        setError(response.data.message || 'Failed to select donor');
      }
    } catch (err) {
      console.error('Error selecting donor:', err);
      setError(err.response?.data?.message || err.message || 'Failed to select donor');
    }
  };

  const getStatusClass = (status) => {
    return `status ${status.toLowerCase()}`;
  };

  if (loading) {
    return <div className="loading">Loading request details...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="donor-list-container">
      <div className="request-details">
        <h2>Blood Request #{requestId}</h2>
        <div className="request-info">
          <p><strong>Receiver Name:</strong> {requestDetails?.fullName || 'Loading...'}</p>
          <p><strong>Blood Type Needed:</strong> {requestDetails?.bloodType || 'Loading...'}</p>
          <p><strong>Status:</strong> <span className={`status ${requestDetails?.status?.toLowerCase()}`}>{requestDetails?.status || 'Loading...'}</span></p>
        </div>
      </div>

      <h2>Available Donors in Your Area</h2>
      {loading ? (
        <div className="loading">Loading donors...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : donors.length === 0 ? (
        <div className="no-donors">No matching donors found in your area.</div>
      ) : (
        <div className="donor-list">
          {donors.map((donor) => (
            <div key={donor.id} className="donor-card">
              <h3>{donor.name}</h3>
              <p><strong>Blood Type:</strong> {donor.blood_type}</p>
              <p><strong>Contact:</strong> {donor.phone}</p>
              <p><strong>Location:</strong> {donor.district}, {donor.state}</p>
              <button
                onClick={() => handleDonorSelection(donor.id)}
                disabled={requestDetails?.status !== 'PENDING'}
              >
                Select Donor
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReceiverStatus;