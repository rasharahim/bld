import React, { useState } from "react";
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import "../FormStyles.css";
import Gps from "@/components/Gps";

const ReceiverForm = () => {
  const navigate = useNavigate();
  const [receiver, setReceiver] = useState({
    fullName: "",
    age: "",
    bloodType: "",
    country: "",
    state: "",
    district: "",
    address: "",
    contactNumber: "",
    reasonForRequest: "",
    prescription: null,
    locationMethod: "address",
    latitude: null,
    longitude: null
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    if (e.target.name === "prescription") {
      setReceiver({ ...receiver, prescription: e.target.files[0] });
    } else {
      setReceiver({ ...receiver, [e.target.name]: e.target.value });
    }
  };

  const handleLocationUpdate = (location) => {
    setReceiver(prev => ({ 
      ...prev, 
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address || prev.address,
      country: location.country || prev.country,
      state: location.state || prev.state,
      district: location.district || prev.district
    }));
  };

  const validateForm = () => {
    let validationErrors = {};
    
    if (!receiver.fullName.trim()) {
      validationErrors.fullName = "Full Name is required.";
    }

    if (!receiver.age || isNaN(receiver.age) || receiver.age < 1) {
      validationErrors.age = "Please enter a valid age.";
    }

    if (!receiver.bloodType) {
      validationErrors.bloodType = "Please select a blood type.";
    }

    if (!receiver.contactNumber) {
      validationErrors.contactNumber = "Contact number is required.";
    }

    if (!receiver.reasonForRequest) {
      validationErrors.reasonForRequest = "Please provide reason for request.";
    }

    if (!receiver.country) validationErrors.country = "Country is required.";
    if (!receiver.state) validationErrors.state = "State is required.";
    if (!receiver.district) validationErrors.district = "District is required.";
    if (!receiver.address) validationErrors.address = "Address is required.";

    if (receiver.locationMethod === "gps" && (!receiver.latitude || !receiver.longitude)) {
      validationErrors.location = "Please get your current location.";
    }

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      const errorMessage = Object.values(validationErrors).join('\n');
      alert('Please fix the following errors:\n\n' + errorMessage);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
  
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to submit a blood request.');
        navigate('/login');
        return;
      }
  
      const formData = new FormData();
      // Use EXACTLY these field names that match your backend
      formData.append('full_name', receiver.fullName);
      formData.append('age', receiver.age);
      formData.append('blood_type', receiver.bloodType);
      formData.append('contact_number', receiver.contactNumber);
      formData.append('country', receiver.country);
      formData.append('state', receiver.state);
      formData.append('district', receiver.district);
      formData.append('address', receiver.address);
      formData.append('location_address', receiver.address); // Add this line
      formData.append('location_lat', receiver.latitude || '');
      formData.append('location_lng', receiver.longitude || '');
      formData.append('reason_for_request', receiver.reasonForRequest);
      
      if (receiver.prescription) {
        formData.append('prescription', receiver.prescription);
      }
  
      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }
  
      const response = await axios.post(
        'http://localhost:5000/api/receivers/create-request', 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        }
      );
  
      if (response.data.success) {
        const requestId = response.data.data.id;
        if (!requestId) {
          throw new Error('Server response missing request ID');
        }
        navigate(`/receiver-thanks?requestId=${requestId}`);
      } else {
        throw new Error(response.data.message || 'Submission failed');
      }
  
    } catch (error) {
      console.error('Submission error:', {
        error: error,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = 'Submission failed: ';
      if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please login again.';
        navigate('/login');
      } else if (error.response?.data?.error) {
        errorMessage += error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Blood Receiver Form</h2>
      <form onSubmit={handleSubmit} noValidate>
        {/* Personal Information Section */}
        <div className="form-section">
          <h3>Personal Information</h3>
          
          <label>Full Name:</label>
          <input 
            type="text" 
            name="fullName" 
            value={receiver.fullName} 
            onChange={handleChange} 
            required 
          />
          {errors.fullName && <p className="error">{errors.fullName}</p>}

          <label>Age:</label>
          <input 
            type="number" 
            name="age" 
            value={receiver.age} 
            onChange={handleChange} 
            required 
          />
          {errors.age && <p className="error">{errors.age}</p>}

          <label>Blood Type:</label>
          <select 
            name="bloodType" 
            value={receiver.bloodType} 
            onChange={handleChange} 
            required
          >
            <option value="">Select</option>
            {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {errors.bloodType && <p className="error">{errors.bloodType}</p>}
        </div>

        {/* Location Details Section */}
        <div className="form-section">
          <h3>Location Details</h3>
          
          <div className="location-method">
            <label>
              <input
                type="radio"
                name="locationMethod"
                value="address"
                checked={receiver.locationMethod === "address"}
                onChange={handleChange}
              />
              Address
            </label>
            <label>
              <input
                type="radio"
                name="locationMethod"
                value="gps"
                checked={receiver.locationMethod === "gps"}
                onChange={handleChange}
              />
              Current Location
            </label>
          </div>

          {receiver.locationMethod === "gps" ? (
            <div className="gps-container">
              <Gps onLocationUpdate={handleLocationUpdate} />
              {errors.location && <p className="error">{errors.location}</p>}
            </div>
          ) : (
            <>
              <label>Country:</label>
              <input 
                type="text" 
                name="country" 
                value={receiver.country} 
                onChange={handleChange} 
                required 
              />
              {errors.country && <p className="error">{errors.country}</p>}

              <label>State:</label>
              <input 
                type="text" 
                name="state" 
                value={receiver.state} 
                onChange={handleChange} 
                required 
              />
              {errors.state && <p className="error">{errors.state}</p>}

              <label>District:</label>
              <input 
                type="text" 
                name="district" 
                value={receiver.district} 
                onChange={handleChange} 
                required 
              />
              {errors.district && <p className="error">{errors.district}</p>}

              <label>Address:</label>
              <textarea 
                name="address" 
                value={receiver.address} 
                onChange={handleChange} 
                required 
                rows="3"
              />
              {errors.address && <p className="error">{errors.address}</p>}
            </>
          )}
        </div>

        {/* Request Details Section */}
        <div className="form-section">
          <h3>Request Details</h3>
          
          <label>Contact Number:</label>
          <input 
            type="text" 
            name="contactNumber" 
            value={receiver.contactNumber} 
            onChange={handleChange} 
            required 
          />
          {errors.contactNumber && <p className="error">{errors.contactNumber}</p>}

          <label>Reason for Blood Request:</label>
          <textarea 
            name="reasonForRequest" 
            value={receiver.reasonForRequest} 
            onChange={handleChange} 
            required
            rows="4"
          />
          {errors.reasonForRequest && <p className="error">{errors.reasonForRequest}</p>}

          <label>Doctor's Prescription (PDF or Image):</label>
          <input 
            type="file" 
            name="prescription" 
            accept=".pdf,.jpg,.jpeg,.png" 
            onChange={handleChange} 
          />
        </div>

        <button 
          type="submit" 
          className="submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
};

export default ReceiverForm;