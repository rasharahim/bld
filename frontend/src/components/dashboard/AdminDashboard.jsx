import { useNavigate } from "react-router-dom";
import React, { useState, useEffect, useCallback } from "react";
import { FaCheck, FaTimes, FaEye } from "react-icons/fa";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("donors");
  const [donors, setDonors] = useState([]);
  const [receivers, setReceivers] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [isAdmin, setIsAdmin] = useState(true);

  const checkAdminStatus = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsAuthenticated(false);
      return false;
    }

    try {
      // Decode the JWT token (just the payload part)
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.is_admin) {
        setIsAdmin(false);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
      return false;
    }
  }, []);

  useEffect(() => {
    const isAdminUser = checkAdminStatus();
    if (!isAdminUser) {
      alert("Access denied. Admin rights required.");
      navigate("/");
      return;
    }
  }, [checkAdminStatus, navigate]);

  const fetchDashboardData = useCallback(async () => {
    if (!checkAdminStatus()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("token");
      
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      if (activeTab === "donors") {
        const response = await fetch("http://localhost:5000/api/admin/donors", { 
          headers, 
          credentials: "include" 
        });
        const data = await response.json();
        console.log("Donors data received:", data);
        
        if (!response.ok) {
          if (response.status === 403) {
            setIsAdmin(false);
            throw new Error("Access denied. Admin rights required.");
          }
          throw new Error(data.message || 'Failed to fetch donors');
        }
        
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch donors');
        }
        
        setDonors(data.data || []);
      } else {
        const response = await fetch("http://localhost:5000/api/admin/receiver-requests", { 
          headers, 
          credentials: "include" 
        });
        const data = await response.json();
        console.log("Receivers data received:", data);
        
        if (!response.ok) {
          if (response.status === 403) {
            setIsAdmin(false);
            throw new Error("Access denied. Admin rights required.");
          }
          throw new Error(data.message || 'Failed to fetch receivers');
        }
        
        if (!data.success) {
          throw new Error(data.message || 'Failed to fetch receivers');
        }
        
        setReceivers(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.message.includes('Access denied') || error.message.includes('401')) {
        setIsAdmin(false);
      } else {
        setError(error.message || "Failed to load data");
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, checkAdminStatus]);

  useEffect(() => {
    console.log("AdminDashboard mounted or activeTab changed:", activeTab);
    fetchDashboardData();
  }, [activeTab, fetchDashboardData]);

  useEffect(() => {
    console.log("Current donors state:", donors);
    console.log("Current receivers state:", receivers);
  }, [donors, receivers]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else if (!isAdmin) {
      navigate("/");
    }
  }, [isAuthenticated, isAdmin, navigate]);

  const updateStatus = async (id, status, type) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/admin/${type}/${id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 403) {
          setIsAdmin(false);
          throw new Error("Access denied. Admin rights required.");
        }
        throw new Error(data.message || `Failed to update ${type} status`);
      }

      if (type === 'receiver-requests' && status === 'approved' && data.data.nearbyDonors) {
        const nearbyDonorsText = data.data.nearbyDonors.length > 0
          ? `Found ${data.data.nearbyDonors.length} potential donors within 20km:\n\n` +
            data.data.nearbyDonors.map(donor => 
              `${donor.donor_name} (${donor.blood_type}) - ${donor.distance}km away`
            ).join('\n')
          : 'No matching donors found within 20km.';
        
        alert(`Request approved successfully!\n\n${nearbyDonorsText}`);
      } else {
        alert(`${type === 'donors' ? 'Donor' : 'Request'} ${status} successfully`);
      }

      fetchDashboardData();
      setSelectedItem(null);
    } catch (error) {
      console.error(`Error updating ${type} status:`, error);
      if (error.message.includes('401')) {
        setIsAuthenticated(false);
      } else {
        alert(`Error updating status: ${error.message}`);
      }
    }
  };

  const viewPrescription = (prescriptionPath) => {
    if (prescriptionPath) {
      window.open(`http://localhost:5000/uploads/prescriptions/${prescriptionPath}`, '_blank');
    } else {
      alert('No prescription uploaded');
    }
  };

  const renderDonorDetails = (donor, key) => (
    <div key={key} className="details-card">
      <h3>{donor.user_name}</h3>
      <div className="status-badge" data-status={donor.status.toLowerCase()}>{donor.status}</div>
      <div className="details-content">
        <p><strong>Blood Type:</strong> {donor.blood_type}</p>
        <p><strong>Age:</strong> {donor.age}</p>
        <p><strong>Contact:</strong> {donor.user_phone}</p>
        <p><strong>Location:</strong> {donor.address}</p>
        <p><strong>Last Donation:</strong> {donor.last_donation || 'Never'}</p>
        <p><strong>Health Status:</strong> {donor.health_conditions || 'Healthy'}</p>
        
        {donor.status === "pending" && (
          <div className="action-buttons">
            <button 
              className="approve-btn"
              onClick={() => updateStatus(donor.id, "approved", "donors")}
            >
              <FaCheck /> Approve
            </button>
            <button 
              className="reject-btn"
              onClick={() => updateStatus(donor.id, "rejected", "donors")}
            >
              <FaTimes /> Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderReceiverDetails = (receiver, key) => (
    <div key={key} className="details-card">
      <h3>{receiver.user_name}</h3>
      <div className="status-badge" data-status={receiver.status.toLowerCase()}>{receiver.status}</div>
      <div className="details-content">
        <p><strong>Blood Type:</strong> {receiver.blood_type}</p>
        <p><strong>Age:</strong> {receiver.age}</p>
        <p><strong>Contact:</strong> {receiver.user_phone}</p>
        <p><strong>Location:</strong> {receiver.address}</p>
        <p><strong>Reason:</strong> {receiver.reason}</p>
        
        {receiver.prescription_path && (
          <button 
            className="view-btn"
            onClick={() => viewPrescription(receiver.prescription_path)}
          >
            <FaEye /> View Prescription
          </button>
        )}
        
        {receiver.status === "pending" && (
          <div className="action-buttons">
            <button 
              className="approve-btn"
              onClick={() => updateStatus(receiver.id, "approved", "receiver-requests")}
            >
              <FaCheck /> Approve
            </button>
            <button 
              className="reject-btn"
              onClick={() => updateStatus(receiver.id, "rejected", "receiver-requests")}
            >
              <FaTimes /> Reject
            </button>
          </div>
        )}

        {receiver.status === "approved" && receiver.nearby_donors && (
          <div className="donor-matches">
            <h4>Nearby Donors</h4>
            {JSON.parse(receiver.nearby_donors).length > 0 ? (
              <div className="donor-list">
                {JSON.parse(receiver.nearby_donors).map((donor, index) => (
                  <div key={index} className="donor-item">
                    <p><strong>Name:</strong> {donor.donor_name}</p>
                    <p><strong>Blood Type:</strong> {donor.blood_type}</p>
                    <p><strong>Distance:</strong> {donor.distance}km</p>
                    <p><strong>Contact:</strong> {donor.donor_phone}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No matching donors found within 20km</p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>Admin Dashboard</h2>
        <div className="tab-buttons">
          <button 
            className={activeTab === "donors" ? "active" : ""}
            onClick={() => setActiveTab("donors")}
            disabled={loading}
          >
            Donor Applications
          </button>
          <button 
            className={activeTab === "receivers" ? "active" : ""}
            onClick={() => setActiveTab("receivers")}
            disabled={loading}
          >
            Blood Requests
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={fetchDashboardData}>Try Again</button>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="dashboard-content">
          {activeTab === "donors" ? (
            <div className="cards-grid">
              {donors.length === 0 ? (
                <div className="no-data">No donor applications found</div>
              ) : (
                donors.map(donor => renderDonorDetails(donor, donor.id))
              )}
            </div>
          ) : (
            <div className="cards-grid">
              {receivers.length === 0 ? (
                <div className="no-data">No blood requests found</div>
              ) : (
                receivers.map(receiver => renderReceiverDetails(receiver, receiver.id))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
