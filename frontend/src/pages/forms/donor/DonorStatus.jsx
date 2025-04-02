import React, { useState, useEffect } from "react";
import "./DonorStatus.css";

const DonorStatusPage = () => {
  const [donorStatus, setDonorStatus] = useState("pending");
  const [bloodRequests, setBloodRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Fetch donor status from backend
    fetch("http://localhost:5000/api/donor/status")
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
    alert(`You have accepted the request from ${request.name}`);
    setBloodRequests(bloodRequests.filter((r) => r.id !== id));

    // Notify backend to send email & SMS
    await fetch("http://localhost:5000/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: id }),
    });
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