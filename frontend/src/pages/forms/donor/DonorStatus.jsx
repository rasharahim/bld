import React, { useState, useEffect } from "react";
import "./DonorStatus.css";

const DonorStatusPage = () => {
  const [donorStatus, setDonorStatus] = useState("pending");
  const [bloodRequests, setBloodRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Fetch donor status from backend
    fetch("http://localhost:5000/api/donors/status")
      .then((res) => res.json())
      .then((data) => setDonorStatus(data.status));
  }, []);

  useEffect(() => {
    if (donorStatus === "approved") {
      fetch("http://localhost:5000/api/blood-requests")
        .then((res) => res.json())
        .then((data) => {
          setBloodRequests(data);
          setNotifications(["New blood request received!"]);
        });
    }
  }, [donorStatus]);

  const handleAcceptRequest = async (id) => {
    const request = bloodRequests.find((r) => r.id === id);
  
    const response = await fetch("http://localhost:5000/api/donors/accept-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ donorId: user.id, requestId: id }),
    });
  
    if (response.ok) {
      const data = await response.json();
      alert(`Request accepted! Contact the receiver at: ${request.contact_number}`);
      setBloodRequests(bloodRequests.filter((r) => r.id !== id));
    } else {
      alert("Error accepting request");
    }
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