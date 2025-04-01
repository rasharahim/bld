import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
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
  const [receiverLocation, setReceiverLocation] = useState({ lat: 37.7749, lng: -122.4194 }); // Default to SF

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setReceiverLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (error) => {
        console.error("Error getting location:", error);
      }
    );

    const fetchRequestStatus = async () => {
      try {
        const response = await mockApiGetRequestStatus();
        setRequestStatus(response.status);
        
        if (response.status === 'approved') {
          const donorResponse = await mockApiGetDonors();
          const updatedDonors = donorResponse.map(donor => ({
            ...donor,
            distance: calculateDistance(receiverLocation.lat, receiverLocation.lng, donor.location.lat, donor.location.lng)
          }));
          setDonors(updatedDonors);
        }
      } catch (error) {
        console.error('Error fetching request status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequestStatus();
  }, [receiverLocation]);

  const mockApiGetRequestStatus = () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ status: 'approved' });
      }, 1000);
    });
  };

  const mockApiGetDonors = () => {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve([
          { id: 1, name: 'John Doe', bloodType: 'A+', location: { lat: 37.779, lng: -122.418 }, lastDonation: '3 months ago', contact: 'john@example.com' },
          { id: 2, name: 'Jane Smith', bloodType: 'A+', location: { lat: 37.772, lng: -122.414 }, lastDonation: '4 months ago', contact: 'jane@example.com' }
        ]);
      }, 1000);
    });
  };

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

  if (loading) {
    return <div className="loading-container">Loading request status...</div>;
  }

  return (
    <div className="request-status-container">
      <h1 className="request-title">Your Blood Request Status</h1>
      
      <div className="status-card">
        <h2 className="status-title">Request Status</h2>
        
        {requestStatus === 'pending' && (
          <div className="status-alert pending">
            <p>Your request is under review. Please check back later.</p>
          </div>
        )}

        {requestStatus === 'rejected' && (
          <div className="status-alert rejected">
            <p>Your request has been rejected. Please contact support.</p>
          </div>
        )}

        {requestStatus === 'approved' && (
          <div className="status-alert approved">
            <p>Your request has been approved! See matching donors below.</p>
          </div>
        )}
      </div>

      {requestStatus === 'approved' && (
        <>
          {/* Map View */}
          <div className="map-container">
            <h2>Available Donors Nearby</h2>
            <MapContainer center={[receiverLocation.lat, receiverLocation.lng]} zoom={13} style={{ height: '400px', width: '100%', borderRadius: '10px', boxShadow: '0px 4px 10px rgba(0,0,0,0.2)' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[receiverLocation.lat, receiverLocation.lng]} icon={donorIcon}>
                <Popup>You are here</Popup>
              </Marker>
              {donors.map(donor => (
                <Marker key={donor.id} position={[donor.location.lat, donor.location.lng]} icon={donorIcon}>
                  <Popup>
                    {donor.name} - {donor.bloodType}
                    <br /> Last Donation: {donor.lastDonation}
                    <br /> Distance: {donor.distance} km
                    <br /> Contact: {donor.contact}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Donor List */}
          <div className="donors-container">
            <h2 className="donors-title">Available Donors</h2>
            
            {donors.length > 0 ? (
              <div className="donors-list">
                {donors.map(donor => (
                  <div key={donor.id} className="donor-card">
                    <div className="donor-info">
                      <h3 className="donor-name">{donor.name}</h3>
                      <p className="donor-detail">Blood Type: {donor.bloodType}</p>
                      <p className="donor-detail">Last Donation: {donor.lastDonation}</p>
                      <p className="donor-detail">Distance: {donor.distance} km</p>
                    </div>
                    <button
                      onClick={() => alert(`You've selected donor ${donor.id}. Contact details will be shared.`)}
                      className="select-donor-btn"
                    >
                      Select Donor
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-donors">No donors available at the moment.</p>
            )}
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
