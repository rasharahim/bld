import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfileStyles.css";

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log("Retrieved Token in Profile:", token);

    if (!token) {
      console.error("No token found. Redirecting to login...");
      navigate("/login");
      return;
    }
    fetchUserProfile(token);
  }, [navigate]);

  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch("http://localhost:5000/api/profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }
      
      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("Error loading profile. Please try again.");
    }
    setLoading(false);
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUser((prevUser) => ({
        ...prevUser,
        profilePicture: URL.createObjectURL(file),
      }));
    }
  };

  const handleInputChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSaveProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("Unauthorized: No token found.");
      navigate("/login");
      return;
    }

    const formData = new FormData();
    formData.append("fullName", user.fullName);
    formData.append("phoneNumber", user.phoneNumber);
    formData.append("date_of_birth", user.date_of_birth);
    formData.append("blood_type", user.blood_type);
    if (selectedFile) {
      formData.append("profilePicture", selectedFile);
    }

    try {
      const response = await fetch("http://localhost:5000/api/profile/update", {
        method: "PUT",
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        throw new Error("Failed to update profile");
      }
      
      const data = await response.json();
      alert("Profile updated successfully");
      setUser({ ...user, profilePicture: data.profilePicture });
      setEditMode(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile. Please try again.");
    }
  };

  if (loading) return <div>Loading profile...</div>;
  if (error) return <div>{error}</div>;
  if (!user) return <div>Error loading profile</div>;

  return (
    <div className="profile-layout">
      <div className="profile-container">
        <h2>My Profile</h2>
        <div className="profile-picture-container">
          <img src={user.profilePicture || "/default-avatar.png"} alt="Profile" />
          <input type="file" accept="image/*" onChange={handleProfilePictureChange} />
        </div>
        <div className="profile-details">
          <label>Full Name:</label>
          {editMode ? <input type="text" name="fullName" value={user.fullName} onChange={handleInputChange} /> : <p>{user.fullName}</p>}
          <label>Date of Birth:</label>
          {editMode ? <input type="date" name="date_of_birth" value={user.date_of_birth} onChange={handleInputChange} /> : <p>{user.date_of_birth}</p>}
          <label>Blood Type:</label>
          {editMode ? (
            <select name="blood_type" value={user.blood_type} onChange={handleInputChange}>
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
            <p>{user.blood_type}</p>
          )}
          <label>Phone Number:</label>
          {editMode ? <input type="text" name="phoneNumber" value={user.phoneNumber} onChange={handleInputChange} /> : <p>{user.phoneNumber}</p>}
          {editMode ? (
            <>
              <button onClick={handleSaveProfile}>Save</button>
              <button onClick={() => setEditMode(false)}>Cancel</button>
            </>
          ) : (
            <button onClick={() => setEditMode(true)}>Edit</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
