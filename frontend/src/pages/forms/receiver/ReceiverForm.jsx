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
    locationMethod: "address", // Default to address
    latitude: null,
    longitude: null
  });

  const [errors, setErrors] = useState({});

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
      // Set address fields from GPS location
      country: location.country || prev.country,
      state: location.state || prev.state,
      district: location.district || prev.district
    }));
  };

  const validateForm = () => {
    let validationErrors = {};
    console.log('Validating form with data:', receiver);

    // Basic information validation
    if (!receiver.fullName.trim()) {
      validationErrors.fullName = "Full Name is required.";
      console.log('Full name validation failed');
    }

    if (!receiver.age || isNaN(receiver.age) || receiver.age < 1) {
      validationErrors.age = "Please enter a valid age.";
      console.log('Age validation failed');
    }

    if (!receiver.bloodType) {
      validationErrors.bloodType = "Please select a blood type.";
      console.log('Blood type validation failed');
    }

    if (!receiver.contactNumber) {
      validationErrors.contactNumber = "Contact number is required.";
      console.log('Contact number validation failed');
    }

    if (!receiver.reasonForRequest) {
      validationErrors.reasonForRequest = "Please provide reason for request.";
      console.log('Reason validation failed');
    }

    // Location validation - required fields for both methods
    if (!receiver.country) {
      validationErrors.country = "Country is required.";
      console.log('Country validation failed');
    }
    if (!receiver.state) {
      validationErrors.state = "State is required.";
      console.log('State validation failed');
    }
    if (!receiver.district) {
      validationErrors.district = "District is required.";
      console.log('District validation failed');
    }
    if (!receiver.address) {
      validationErrors.address = "Address is required.";
      console.log('Address validation failed');
    }

    // Additional GPS validation if using GPS method
    if (receiver.locationMethod === "gps" && (!receiver.latitude || !receiver.longitude)) {
      validationErrors.location = "Please get your current location.";
      console.log('GPS location validation failed');
    }

    console.log('Validation errors:', validationErrors);
    setErrors(validationErrors);

    // Show alert if there are validation errors
    if (Object.keys(validationErrors).length > 0) {
      const errorMessage = Object.values(validationErrors).join('\n');
      alert('Please fix the following errors:\n\n' + errorMessage);
    }

    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted'); // Debug log
    
    if (!validateForm()) {
      console.log('Form validation failed'); // Debug log
      return;
    }
  
    try {
      const token = localStorage.getItem('token');
      console.log('Token:', token ? 'Present' : 'Missing'); // Debug log
      
      if (!token) {
        alert('Please login to submit a blood request.');
        navigate('/login');
        return;
      }

      const formData = new FormData();
      
      // Add all the fields to FormData
      formData.append('fullName', receiver.fullName || '');
      formData.append('age', receiver.age || '');
      formData.append('bloodType', receiver.bloodType || '');
      formData.append('contactNumber', receiver.contactNumber || '');
      formData.append('country', receiver.country || '');
      formData.append('state', receiver.state || '');
      formData.append('district', receiver.district || '');
      formData.append('address', receiver.address || '');
      formData.append('lat', receiver.latitude || '');
      formData.append('lng', receiver.longitude || '');
      formData.append('locationAddress', receiver.address || '');
      formData.append('reasonForRequest', receiver.reasonForRequest || '');
      
      // Add prescription file if it exists
      if (receiver.prescription) {
        formData.append('prescription', receiver.prescription);
      } else {
        // Add an empty file to satisfy the multer requirement
        const emptyFile = new File([], 'empty.txt', { type: 'text/plain' });
        formData.append('prescription', emptyFile);
      }

      console.log('Sending request with data:', Object.fromEntries(formData)); // Debug log

      const response = await axios.post('http://localhost:5000/api/receivers/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response received:', response.data); // Debug log

      if (response.data.success) {
        navigate('/receiver/thanks'); // Redirect to thanks page
      } else {
        throw new Error(response.data.message || 'Submission failed');
      }
      
      // Reset form
      setReceiver({
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
  
    } catch (error) {
      console.error('Submission error details:', {
        error: error,
        response: error.response,
        data: error.response?.data,
        status: error.response?.status,
        message: error.message
      });
      
      let errorMessage = 'Failed to submit blood request. ';
      if (error.response) {
        console.log('Error response:', error.response);
        console.log('Error details:', error.response.data);
        if (error.response.status === 401) {
          errorMessage += 'Please login again.';
          navigate('/login');
        } else {
          errorMessage += error.response.data?.message || error.response.data?.error || error.message;
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        errorMessage += 'No response received from server. Please check your connection.';
      } else {
        console.error('Error setting up request:', error.message);
        errorMessage += 'Error setting up request: ' + error.message;
      }
      
      alert(errorMessage);
    }
  };

  return (
    <div className="form-container">
      <h2>Blood Receiver Form</h2>
      <form onSubmit={handleSubmit} noValidate>
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
                placeholder="Enter your full address"
              />
              {errors.address && <p className="error">{errors.address}</p>}
            </>
          )}
        </div>

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
          ></textarea>
          {errors.reasonForRequest && <p className="error">{errors.reasonForRequest}</p>}

          <label>Doctor's Prescription (PDF or Image):</label>
          <input 
            type="file" 
            name="prescription" 
            accept=".pdf, .jpg, .jpeg, .png" 
            onChange={handleChange} 
          />
        </div>

        <button 
          type="submit" 
          className="submit-btn"
          onClick={(e) => {
            e.preventDefault();
            console.log('Button clicked');
            handleSubmit(e);
          }}
        >
          Submit Request
        </button>
      </form>
    </div>
  );
};

export default ReceiverForm;