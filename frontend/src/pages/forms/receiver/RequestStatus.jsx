import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '@/utils/axios';
import './RequestStatus.css';

const donorIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const RequestStatus = () => {
  const [requestStatus, setRequestStatus] = useState('pending');
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [receiverLocation, setReceiverLocation] = useState(null);
  const [requestDetails, setRequestDetails] = useState(null);

  const token = localStorage.getItem('token');

  const fetchNearbyDonors = async (bloodType, location) => {
    try {
      if (!location || !location.lat || !location.lng) {
        console.error('Invalid receiver location:', location);
        setError('Invalid receiver location. Please try again later.');
        return;
      }

      const response = await api.get('/api/receivers/nearby-donors', {
        params: {
          bloodType,
          latitude: location.lat,
          longitude: location.lng
        }
      });

      if (response.data.success) {
        setDonors(response.data.data || []);
      } else {
        setError(response.data.message || 'Failed to fetch nearby donors');
      }
    } catch (error) {
      console.error('Error fetching nearby donors:', error);
      setError(error.response?.data?.message || 'Failed to fetch nearby donors');
    }
  };

  useEffect(() => {
    const fetchRequestStatus = async () => {
      try {
        const response = await api.get('/api/receivers/my-requests');
        console.log('Full response data:', response.data);
        
        if (response.data.success && response.data.requests.length > 0) {
          const latestRequest = response.data.requests[0];
          console.log('Latest request details:', latestRequest);
          
          setRequestStatus(latestRequest.status);
          setRequestDetails(latestRequest);
          
          // Parse coordinates from the latest request
          const latitude = parseFloat(latestRequest.latitude);
          const longitude = parseFloat(latestRequest.longitude);
          console.log('Parsed coordinates:', { latitude, longitude });
          
          if (!isNaN(latitude) && !isNaN(longitude)) {
            const location = { lat: latitude, lng: longitude };
            console.log('Setting receiver location:', location);
            setReceiverLocation(location);
            
            // Only fetch nearby donors if request is approved
            if (latestRequest.status === 'approved') {
              await fetchNearbyDonors(latestRequest.blood_type, location);
            }
          } else {
            console.error('Invalid coordinates in request:', { latitude, longitude });
            setError('Invalid location coordinates in request');
          }
          
          // Set selected donor if available
          if (latestRequest.selected_donor_id) {
            setSelectedDonor(latestRequest.selected_donor_id);
          }
        } else {
          setError('No requests found');
        }
      } catch (error) {
        console.error('Error fetching request status:', error);
        setError(error.response?.data?.message || 'Failed to fetch request status');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchRequestStatus();
    } else {
      setLoading(false);
    }
  }, [token]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2); // Distance in km
  };

  const handleSelectDonor = async (donor) => {
    try {
      await api.post('/api/receivers/select-donor', {
        requestId: requestDetails.id,
        donorId: donor.id
      });

      setSelectedDonor(donor);
      alert('Donor selected successfully! You can now contact them.');
    } catch (error) {
      console.error('Error selecting donor:', error);
      alert('Failed to select donor. Please try again.');
    }
  };

  const handleCompleteDonation = async () => {
    try {
      await api.post('/api/receivers/complete-donation', {
        requestId: requestDetails.id,
        donorId: selectedDonor.id
      });

      setRequestStatus('completed');
      alert('Donation marked as completed! Thank you for using our service.');
    } catch (error) {
      console.error('Error completing donation:', error);
      alert('Failed to mark donation as completed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="request-status-container">
        <div className="loading-container">
          <p>Loading request status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="request-status-container">
        <div className="error-container">
          <p>{error}</p>
          <Link to="/" className="home-link">← Return to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="request-status-container">
      <h1 className="request-title">Your Blood Request Status</h1>
      
      <div className="status-card">
        <h2 className="status-title">Request Status: {requestStatus.toUpperCase()}</h2>
        
        {requestStatus === 'pending' && (
          <div className="status-alert pending">
            <p>Your request is under review. Please check back later.</p>
          </div>
        )}

        {requestStatus === 'rejected' && (
          <div className="status-alert rejected">
            <p>Your request has been rejected. Please contact support for more information.</p>
          </div>
        )}

        {requestStatus === 'approved' && !selectedDonor && (
          <div className="status-alert approved">
            <p>Your request has been approved! Please select a donor from the list below.</p>
          </div>
        )}

        {requestStatus === 'approved' && selectedDonor && (
          <div className="status-alert matched">
            <h3>Selected Donor Information</h3>
            <p><strong>Name:</strong> {selectedDonor.full_name}</p>
            <p><strong>Contact:</strong> {selectedDonor.contact_number}</p>
            <p><strong>Blood Type:</strong> {selectedDonor.blood_type}</p>
            <p><strong>Distance:</strong> {selectedDonor.distance} km</p>
            
            <button 
              className="complete-btn"
              onClick={handleCompleteDonation}
            >
              Mark Donation as Completed
            </button>
          </div>
        )}

        {requestStatus === 'completed' && (
          <div className="status-alert completed">
            <p>Blood donation has been completed. Thank you for using our service!</p>
          </div>
        )}
      </div>

      {requestStatus === 'approved' && !selectedDonor && (
        <>
          <div className="map-container">
            <h2>Available Donors Nearby</h2>
            <MapContainer 
              center={[receiverLocation.lat, receiverLocation.lng]} 
              zoom={13} 
              style={{ height: '400px', width: '100%' }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              
              <Marker position={[receiverLocation.lat, receiverLocation.lng]}>
                <Popup>Your Location</Popup>
              </Marker>

              {donors.map(donor => (
                <Marker 
                  key={donor.id} 
                  position={[donor.latitude, donor.longitude]} 
                  icon={donorIcon}
                >
                  <Popup>
                    <div>
                      <h3>{donor.donor_name}</h3>
                      <p>Blood Type: {donor.blood_type}</p>
                      <p>Distance: {donor.distance} km</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className="donors-container">
            <h2>Available Donors</h2>
            <div className="donors-list">
              {donors.length === 0 ? (
                <div className="no-donors-message">
                  <p>No donors available at the moment for blood type {requestDetails?.blood_type}.</p>
                  <p>Please check back later or contact the hospital for immediate assistance.</p>
                </div>
              ) : (
                donors.map(donor => (
                  <div key={donor.id} className="donor-card">
                    <div className="donor-info">
                      <h3>{donor.donor_name}</h3>
                      <p><strong>Blood Type:</strong> {donor.blood_type}</p>
                      <p><strong>Distance:</strong> {donor.distance} km</p>
                      <p><strong>Contact:</strong> {donor.donor_phone}</p>
                    </div>
                    <button
                      className="select-donor-btn"
                      onClick={() => handleSelectDonor(donor)}
                    >
                      Select Donor
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      <div className="return-home">
        <Link to="/" className="home-link">← Return to Home</Link>
      </div>
    </div>
  );
};

export default RequestStatus;
