import React, { useState, useEffect } from "react";
import "./DonorStatus.css";

const DonorStatusPage = () => {
  const [donorStatus, setDonorStatus] = useState("pending"); // Change to "approved" for testing
  const [bloodRequests, setBloodRequests] = useState([]);

  useEffect(() => {
    if (donorStatus === "approved") {
      setBloodRequests([
        { id: 1, name: "John Doe", bloodType: "O+", distance: "2km", hospital: "City Hospital" },
        { id: 2, name: "Jane Smith", bloodType: "A-", distance: "3.5km", hospital: "Metro Clinic" }
      ]);
    }
  }, [donorStatus]);

  const handleAcceptRequest = (id) => {
    alert(`You have accepted the request from ${bloodRequests.find(r => r.id === id).name}`);
    setBloodRequests(bloodRequests.filter(r => r.id !== id));
  };

  return (
    <div className="status-container">
      <h2>Donor Status</h2>
      {donorStatus === "pending" ? (
        <div className="status-message pending">
          <p>Your donation approval is still pending. Please wait for admin approval.</p>
        </div>
      ) : (
        <div className="status-message approved">
          <p>Your donor status is <strong>Approved</strong>. You can now accept blood requests.</p>
          <h3>Nearby Blood Requests</h3>
          {bloodRequests.length > 0 ? (
            <ul className="request-list">
              {bloodRequests.map(request => (
                <li key={request.id} className="request-card">
                  <p><strong>Name:</strong> {request.name}</p>
                  <p><strong>Blood Type:</strong> {request.bloodType}</p>
                  <p><strong>Distance:</strong> {request.distance}</p>
                  <p><strong>Hospital:</strong> {request.hospital}</p>
                  <button onClick={() => handleAcceptRequest(request.id)}>Accept Request</button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="no-requests">No available blood requests nearby.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default DonorStatusPage;
