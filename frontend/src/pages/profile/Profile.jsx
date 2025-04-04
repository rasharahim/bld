import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Gps from "../../components/Gps";
import "./ProfileStyles.css";

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState({
    fullName: "",
    age: "",
    bloodType: "",
    contactNumber: "",
    dateOfBirth: "",
    isAvailable: false,
    location_lat: null,
    location_lng: null,
    address: "",
    email: "",
    profilePicture: null
  });

  const [editMode, setEditMode] = useState(false);
  const [passwords, setPasswords] = useState({ oldPassword: "", newPassword: "" });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    if (date.getTime() === 0 || isNaN(date.getTime())) return 'Not set';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  // Fetch user profile and activities
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('Token from localStorage:', token); // Debug log

        if (!token) {
          console.log('No token found, redirecting to login'); // Debug log
          navigate('/login');
          return;
        }

        console.log('Making profile request with token:', token.substring(0, 20) + '...'); // Debug log

        const response = await fetch('http://localhost:5000/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('Profile response status:', response.status); // Debug log

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Profile response error:', errorData); // Debug log
          throw new Error(errorData.message || 'Failed to fetch profile');
        }

        const data = await response.json();
        console.log('Profile data received:', data); // Debug log
        
        if (data.success) {
          setUser(prevUser => ({
            ...prevUser,
            ...data.profile,
            location_lat: data.profile.location_lat || null,
            location_lng: data.profile.location_lng || null,
            address: data.profile.address || "",
            bloodType: data.profile.bloodType || "",
            age: data.profile.age || "",
            contactNumber: data.profile.contactNumber || "",
            dateOfBirth: data.profile.dateOfBirth || "",
            email: data.profile.email || "",
            profilePicture: data.profile.profilePicture || null
          }));
          setActivities(data.profile.activities || []);
        } else {
          throw new Error(data.message || 'Failed to fetch profile');
        }
      } catch (err) {
        setError(err.message);
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser(prev => ({
      ...prev,
      [name]: value || "" // Ensure empty string instead of undefined
    }));
  };

  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleLocationUpdate = (locationData) => {
    setUser(prev => ({
      ...prev,
      location_lat: locationData.lat || null,
      location_lng: locationData.lng || null,
      address: locationData.address || ""
    }));
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profile/update', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName: user.fullName || "",
          contactNumber: user.contactNumber || "",
          dateOfBirth: user.dateOfBirth || "",
          bloodType: user.bloodType || "",
          isAvailable: Boolean(user.isAvailable),
          location_lat: user.location_lat || null,
          location_lng: user.location_lng || null,
          address: user.address || ""
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const data = await response.json();
      if (data.success) {
        setUser(prev => ({
          ...prev,
          ...data.profile
        }));
        setEditMode(false);
        alert('Profile updated successfully!');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      alert(err.message || 'Failed to update profile');
    }
  };

  const handlePasswordUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profile/update-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(passwords)
      });

      if (!response.ok) {
        throw new Error('Failed to update password');
      }

      const data = await response.json();
      if (data.success) {
        alert('Password updated successfully!');
        setPasswords({ oldPassword: "", newPassword: "" });
      }
    } catch (err) {
      console.error('Error updating password:', err);
      alert('Failed to update password');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const toggleAvailability = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/profile/toggle-availability', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to toggle availability');
      }

      const data = await response.json();
      if (data.success) {
        setUser(prev => ({ ...prev, isAvailable: data.isAvailable }));
        alert(data.message);
      }
    } catch (err) {
      console.error('Error toggling availability:', err);
      alert('Failed to update availability status');
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (window.confirm("Are you sure you want to cancel this request?")) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/requests/${requestId}/cancel`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to cancel request');
        }

        const data = await response.json();
        if (data.success) {
          setActivities(activities.map(activity => 
            activity.id === requestId 
              ? { ...activity, status: "Cancelled", isPending: false }
              : activity
          ));
          alert('Request cancelled successfully');
        }
      } catch (err) {
        console.error('Error cancelling request:', err);
        alert('Failed to cancel request');
      }
    }
  };

  if (loading) {
    return <div className="loading-spinner">Loading profile...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

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
                <p>{user.age || 'Not set'}</p>
              </div>

              <div className="detail-group">
                <label>Blood Type</label>
                {editMode ? (
                  <select 
                    name="bloodType" 
                    value={user.bloodType || ''} 
                    onChange={handleInputChange}
                  >
                    <option value="">Select Blood Type</option>
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
                  <p>{user.bloodType || 'Not set'}</p>
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

              <div className="detail-group">
                <label>Location:</label>
                {editMode ? (
                  <div className="location-update">
                    <Gps onLocationUpdate={handleLocationUpdate} />
                    <div className="current-location">
                      {user.address ? (
                        <p>Current Address: {user.address}</p>
                      ) : (
                        <p>No location set</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <span>{user.address || 'No location set'}</span>
                )}
              </div>

              <div className="detail-group">
                <label>Availability Status:</label>
                <div className="availability-toggle">
                  <button
                    className={`toggle-button ${user.isAvailable ? 'available' : 'unavailable'}`}
                    onClick={toggleAvailability}
                  >
                    {user.isAvailable ? 'Available' : 'Unavailable'}
                  </button>
                </div>
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
                                  {formatDate(activity.date)}
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
                                
                                {activity.type === "Request" && activity.isPending && (
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
                              {formatDate(activity.date)}
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
                            {activity.isPending && (
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