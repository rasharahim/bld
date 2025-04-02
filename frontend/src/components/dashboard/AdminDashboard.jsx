import { Link, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { Bar, Pie } from "react-chartjs-2";
import "chart.js/auto";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [donors, setDonors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({
    totalDonors: 0,
    activeDonors: 0,
    totalRequests: 0,
    pendingRequests: 0,
    bloodTypeDistribution: {}
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const response = await fetch("https://your-backend-api.com/admin-dashboard");
      const data = await response.json();
      
      setDonors(data.donors);
      setRequests(data.requests);
      setStats({
        totalDonors: data.donors?.length || 0,
        activeDonors: data.donors?.filter(d => d.status === "approved").length || 0,
        totalRequests: data.requests?.length || 0,
        pendingRequests: data.requests?.filter(r => r.status === "pending").length || 0,
        bloodTypeDistribution: data.bloodTypeDistribution || {}
      });
      
    } catch (error) {
      console.error("Error fetching admin data:", error);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await fetch(`https://your-backend-api.com/donors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      setDonors((prev) =>
        prev.map((donor) =>
          donor.id === id ? { ...donor, status } : donor
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <div className="dashboard">
      <aside className="sidebar">
        <h2>Blood Bank Admin</h2>
        <nav>
          <Link to="/admin" className={activeTab === "dashboard" ? "active" : ""} onClick={() => setActiveTab("dashboard")}>Dashboard</Link>
          <Link to="/admin/donors" className={activeTab === "donors" ? "active" : ""} onClick={() => setActiveTab("donors")}>Donors</Link>
          <Link to="/admin/requests" className={activeTab === "requests" ? "active" : ""} onClick={() => setActiveTab("requests")}>Requests</Link>
          <Link to="/admin/reports" className={activeTab === "reports" ? "active" : ""} onClick={() => setActiveTab("reports")}>Reports</Link>
          <button className="logout-btn" onClick={() => navigate("/login")}>Logout</button>
        </nav>
      </aside>
      <main className="content">
        {activeTab === "dashboard" && (
          <div className="dashboard-overview">
            <h1>Admin Dashboard</h1>
            <div className="stats-cards">
              <div className="stat-card"><h3>Total Donors</h3><p>{stats.totalDonors}</p></div>
              <div className="stat-card"><h3>Active Donors</h3><p>{stats.activeDonors}</p></div>
              <div className="stat-card"><h3>Total Requests</h3><p>{stats.totalRequests}</p></div>
              <div className="stat-card"><h3>Pending Requests</h3><p>{stats.pendingRequests}</p></div>
            </div>
            <div className="charts-row">
              <div className="chart-container"><h3>Blood Type Distribution</h3><Pie data={{ labels: Object.keys(stats.bloodTypeDistribution), datasets: [{ label: "Blood Type Distribution", data: Object.values(stats.bloodTypeDistribution), backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF", "#FF9F40", "#8AC24A", "#607D8B"] }] }} /></div>
              <div className="chart-container"><h3>Request Status</h3><Bar data={{ labels: ["Approved", "Pending"], datasets: [{ label: "Request Status", data: [requests.filter(r => r.status === "approved").length, requests.filter(r => r.status === "pending").length], backgroundColor: ["#4CAF50", "#FFC107"] }] }} /></div>
            </div>
          </div>
        )}
        {activeTab === "donors" && (
          <div className="donors-list">
            <h2>Donor Applications</h2>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Blood Type</th>
                  <th>Contact</th>
                  <th>Health Status</th>
                  <th>Approval</th>
                </tr>
              </thead>
              <tbody>
                {donors.map((donor) => (
                  <tr key={donor.id}>
                    <td>{donor.fullName}</td>
                    <td>{donor.bloodType}</td>
                    <td>{donor.contactNumber}</td>
                    <td>{donor.healthCondition.join(", ")}</td>
                    <td>
                      {donor.status === "pending" && (
                        <>
                          <button onClick={() => updateStatus(donor.id, "approved")}>Approve</button>
                          <button onClick={() => updateStatus(donor.id, "rejected")}>Reject</button>
                        </>
                      )}
                      {donor.status === "approved" && <span>✅ Approved</span>}
                      {donor.status === "rejected" && <span>❌ Rejected</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
