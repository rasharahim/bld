import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./ProfileStyles.css";

const ProfilePage = () => {
  const [user, setUser] = useState({
    fullName: "Alex Johnson",
    age: "28",
    bloodType: "O+",
    contactNumber: "+1 (555) 123-4567",
    dateOfBirth: "1995-01-15",
    profilePicture: null,
    isAvailable: true // Added donor availability status
  });

  const [editMode, setEditMode] = useState(false);
  const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "" });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setActivities([
        { 
          id: 1, 
          type: "Donation", 
          date: "2023-05-15", 
          location: "City Blood Bank", 
          status: "Completed", 
          isPending: false 
        },
        { 
          id: 2, 
          type: "Request", 
          date: "2023-04-22", 
          status: "Completed", 
          isPending: false 
        },
        { 
          id: 3, 
          type: "Request", 
          date: "2023-03-10", 
          location: "Community Center", 
          status: "Pending Approval", 
          isPending: true,
          hospital: "Metropolitan Hospital",
          bloodType: "O+",
          quantity: "1 unit"
        },
        { 
          id: 4, 
          type: "Donation", 
          date: "2023-06-01", 
          location: "Central Blood Bank",
          status: "Available for Donation", 
          isPending: true
        }
      ]);
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setUser({ ...user, profilePicture: imageUrl });
    }
  };

  const handleInputChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = () => {
    setEditMode(false);
    alert("Profile updated successfully!");
  };

  const handlePasswordUpdate = () => {
    alert("Password updated successfully!");
    setPasswords({ oldPassword: "", newPassword: "" });
  };

  const handleLogout = () => {
    alert("Logged out successfully!");
  };

  const toggleAvailability = () => {
    const newStatus = !user.isAvailable;
    setUser({ ...user, isAvailable: newStatus });
    alert(`You are now ${newStatus ? 'available' : 'unavailable'} as a donor`);
  };

  const handleCancelRequest = (requestId) => {
    if (window.confirm("Are you sure you want to cancel this request?")) {
      setActivities(activities.map(activity => 
        activity.id === requestId 
          ? { ...activity, status: "Cancelled", isPending: false }
          : activity
      ));
      alert("Request cancelled successfully");
    }
  };

  return (
    <div className="profile-layout">
      <div className="profile-container">
        <div className="profile-header">
          <h2>My Profile</h2>
          <div className="profile-status">
            <span className="status-badge active">Active Donor</span>
            {user.isAvailable && (
              <span className="availability-badge available">Available to Donate</span>
            )}
          </div>
        </div>

        <div className="profile-content">
          <div className="profile-section">
            <div className="profile-picture-container">
              <div className="profile-picture">
                <img 
                  src={user.profilePicture || "https://via.placeholder.com/150"} 
                  alt="Profile" 
                />
                <label className="picture-upload-btn">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleProfilePictureChange} 
                  />
                  <i className="fas fa-camera"></i>
                </label>
              </div>
            </div>

            <div className="profile-details">
              <div className="detail-group">
                <label>Full Name</label>
                {editMode ? (
                  <input 
                    type="text" 
                    name="fullName" 
                    value={user.fullName} 
                    onChange={handleInputChange} 
                  />
                ) : (
                  <p>{user.fullName}</p>
                )}
              </div>

              <div className="detail-group">
                <label>Date of Birth</label>
                {editMode ? (
                  <input 
                    type="date" 
                    name="dateOfBirth" 
                    value={user.dateOfBirth} 
                    onChange={handleInputChange} 
                  />
                ) : (
                  <p>{formatDate(user.dateOfBirth)}</p>
                )}
              </div>

              <div className="detail-group">
                <label>Age</label>
                {editMode ? (
                  <input 
                    type="number" 
                    name="age" 
                    value={user.age} 
                    onChange={handleInputChange} 
                  />
                ) : (
                  <p>{user.age}</p>
                )}
              </div>

              <div className="detail-group">
                <label>Blood Type</label>
                {editMode ? (
                  <select 
                    name="bloodType" 
                    value={user.bloodType} 
                    onChange={handleInputChange}
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                ) : (
                  <p>{user.bloodType}</p>
                )}
              </div>

              <div className="detail-group">
                <label>Contact Number</label>
                {editMode ? (
                  <input 
                    type="text" 
                    name="contactNumber" 
                    value={user.contactNumber} 
                    onChange={handleInputChange} 
                  />
                ) : (
                  <p>{user.contactNumber}</p>
                )}
              </div>

              <div className="action-buttons">
                {editMode ? (
                  <>
                    <button className="save-btn" onClick={handleSaveProfile}>
                      Save Changes
                    </button>
                    <button className="cancel-btn" onClick={() => setEditMode(false)}>
                      Cancel
                    </button>
                  </>
                ) : (
                  <button className="edit-btn" onClick={() => setEditMode(true)}>
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="security-section">
            <h3>Account Security</h3>
            <div className="password-form">
              <div className="form-group">
                <label>Current Password</label>
                <input 
                  type="password" 
                  name="oldPassword" 
                  value={passwords.oldPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter current password" 
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input 
                  type="password" 
                  name="newPassword" 
                  value={passwords.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="Enter new password" 
                />
              </div>
              <button 
                className="update-btn"
                onClick={handlePasswordUpdate}
                disabled={!passwords.oldPassword || !passwords.newPassword}
              >
                Update Password
              </button>
            </div>
          </div>

          <div className="activities-section">
            <h3>My Activities</h3>
            {loading ? (
              <div className="loading-spinner">Loading activities...</div>
            ) : (
              <>
                {activities.filter(a => a.isPending).length > 0 && (
                  <div className="pending-section">
                    <h4>Pending Actions</h4>
                    <div className="activities-list">
                      {activities
                        .filter(activity => activity.isPending)
                        .map(activity => (
                          <div key={`pending-${activity.id}`} className={`activity-card pending ${activity.type.toLowerCase()}`}>
                            <div className="activity-icon">
                              {activity.type === "Donation" ? (
                                <i className="fas fa-tint"></i>
                              ) : (
                                <i className="fas fa-hand-holding-medical"></i>
                              )}
                            </div>
                            <div className="activity-details">
                              <div className="activity-header">
                                <h4>{activity.type}</h4>
                                <span className="activity-date">
                                  {new Date(activity.date).toLocaleDateString()}
                                </span>
                              </div>
                              {activity.location && <p>Location: {activity.location}</p>}
                              {activity.hospital && <p>Hospital: {activity.hospital}</p>}
                              {activity.bloodType && <p>Blood Type: {activity.bloodType}</p>}
                              {activity.quantity && <p>Quantity: {activity.quantity}</p>}
                              <div className="activity-footer">
                                <span className={`status ${activity.status.toLowerCase().replace(' ', '-')}`}>
                                  {activity.status}
                                </span>
                                
                                {activity.type === "Donation" && (
                                  <button 
                                    className={`availability-btn ${user.isAvailable ? 'available' : 'unavailable'}`}
                                    onClick={toggleAvailability}
                                  >
                                    {user.isAvailable ? 'Make Unavailable' : 'Make Available'}
                                  </button>
                                )}
                                
                                {activity.type === "Request" && (
                                  <button 
                                    className="cancel-request-btn"
                                    onClick={() => handleCancelRequest(activity.id)}
                                  >
                                    Cancel Request
                                  </button>
                                )}
                                
                                <Link
                                  to={activity.type === "Request" ? 
                                      `/request-status/${activity.id}` : 
                                      `/donation-status/${activity.id}`}
                                  className="status-btn"
                                >
                                  Check Status
                                </Link>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                <h4>All Activities</h4>
                {activities.length > 0 ? (
                  <div className="activities-list">
                    {activities.map(activity => (
                      <div key={activity.id} className={`activity-card ${activity.type.toLowerCase()}`}>
                        <div className="activity-icon">
                          {activity.type === "Donation" ? (
                            <i className="fas fa-tint"></i>
                          ) : (
                            <i className="fas fa-hand-holding-medical"></i>
                          )}
                        </div>
                        <div className="activity-details">
                          <div className="activity-header">
                            <h4>{activity.type}</h4>
                            <span className="activity-date">
                              {new Date(activity.date).toLocaleDateString()}
                            </span>
                          </div>
                          {activity.location && <p>Location: {activity.location}</p>}
                          {activity.hospital && <p>Hospital: {activity.hospital}</p>}
                          <div className="activity-footer">
                            <span className={`status ${activity.status.toLowerCase().replace(' ', '-')}`}>
                              {activity.status}
                            </span>
                            {activity.status.includes("Pending") && (
                              <Link
                                to={activity.type === "Request" ? 
                                    `/request-status/${activity.id}` : 
                                    `/donation-status/${activity.id}`}
                                className="status-btn"
                              >
                                Check Status
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-activities">No activities found</p>
                )}
              </>
            )}
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;