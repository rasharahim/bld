import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import auth from "../../../utils/auth";  // Adjusted based on folder structure
import "../FormStyles.css";
import countryData from "/src/data/countryData.json";
import Gps from "@/components/Gps";
import axios from 'axios';


const DonorForm = () => {
  // Constants
  const restrictedConditions = [
    "HIV", "Hepatitis B", "Hepatitis C", "Cancer",
    "Heart Disease", "Kidney Disease", "Tuberculosis",
    "Diabetes (on insulin)", "Recent Surgery",
    "Malaria (in last 3 months)", "Pregnancy"
  ];

  // State
  const [donor, setDonor] = useState({
    fullName: "",
    dob: "",
    age: "",
    weight: "",
    bloodType: "",
    hasDonatedBefore: false,
    lastDonationDate: "",
    donationGap: "",
    healthCondition: [],
    availabilityStart: "",
    availabilityEnd: "",
    country: "",
    state: "",
    district: "",
    street: "",
    contactNumber: "",
    location: { lat: null, lng: null, address: "" },
  });

  const [errors, setErrors] = useState({});
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [locationMethod, setLocationMethod] = useState("address");
  const navigate = useNavigate(); // Add this line

  // Calculate age from DOB
  useEffect(() => {
    if (donor.dob) {
      const birthDate = new Date(donor.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      
      setDonor(prev => ({ ...prev, age: age.toString() }));
    }
  }, [donor.dob]);

  const handleDonationToggle = (e) => {
    const hasDonated = e.target.value === 'yes';
    setDonor(prev => ({ 
      ...prev, 
      hasDonatedBefore: hasDonated,
      lastDonationDate: hasDonated ? prev.lastDonationDate : "",
      donationGap: hasDonated ? prev.donationGap : ""
    }));
  };

  // Handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setDonor({ ...donor, [name]: value });

    if (name === "lastDonationDate") {
      const selectedDate = new Date(value);
      const today = new Date();
      const monthDiff =
        (today.getFullYear() - selectedDate.getFullYear()) * 12 +
        today.getMonth() - selectedDate.getMonth();
      setDonor((prev) => ({ ...prev, donationGap: monthDiff }));
    }
  };

  const handleHealthConditionChange = (e) => {
    const { value, checked } = e.target;

    if (value === "None of the Above") {
      setDonor((prev) => ({
        ...prev,
        healthCondition: checked ? ["None of the Above"] : [],
      }));
    } else {
      setDonor((prev) => {
        let updatedConditions = prev.healthCondition.filter(
          (c) => c !== "None of the Above"
        );

        if (checked) {
          updatedConditions.push(value);
        } else {
          updatedConditions = updatedConditions.filter((c) => c !== value);
        }

        return { ...prev, healthCondition: updatedConditions };
      });
    }
  };

  const handleLocationChange = (newLocation) => {
    setDonor((prev) => ({ 
      ...prev, 
      location: {
        lat: newLocation.lat,
        lng: newLocation.lng,
        address: newLocation.address || ""
      }
    }));
    setErrors(prev => ({ ...prev, location: undefined }));
  };

  const validateForm = () => {
    let validationErrors = {};

    if (!donor.fullName.trim()) validationErrors.fullName = "Full Name is required.";
    if (!donor.dob) validationErrors.dob = "Date of Birth is required.";
    if (!donor.age || isNaN(donor.age) || donor.age < 18 || donor.age > 65)
      validationErrors.age = "Age must be between 18 and 65.";
    if (!donor.weight || isNaN(donor.weight) || donor.weight < 45)
      validationErrors.weight = "Minimum weight requirement is 45kg.";
    if (!donor.bloodType) validationErrors.bloodType = "Please select a blood type.";
    if (donor.hasDonatedBefore) {
      if (!donor.lastDonationDate) {
        validationErrors.lastDonationDate = "Please provide your last donation date";
      }
      if (donor.donationGap < 3) {
        validationErrors.donationGap = "Minimum donation gap is 3 months.";
      }
    }

    const hasRestrictedCondition = donor.healthCondition.some((condition) =>
      restrictedConditions.includes(condition)
    );

    if (hasRestrictedCondition) {
      validationErrors.healthCondition = "You are not eligible to donate due to health conditions.";
    }

    if (!/^\d{10}$/.test(donor.contactNumber))
      validationErrors.contactNumber = "Enter a valid 10-digit phone number.";
    if (!donor.availabilityStart || !donor.availabilityEnd)
      validationErrors.availabilityTime = "Please select an availability time range.";

    if (locationMethod === "address") {
      if (!donor.country) validationErrors.country = "Country is required.";
      if (!donor.state) validationErrors.state = "State is required.";
      if (!donor.district) validationErrors.district = "District is required.";
      if (!donor.street) validationErrors.street = "Street address is required.";
    }
    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
        // 1. Authentication Check
        const token = auth.getToken(); // Using the auth helper
        
        // 2. Form Validation
        if (!validateForm()) {
            return; // Stop if validation fails
        }

        // 3. Prepare Request Data
        const requestData = {
            ...donor,
            location: {
                method: locationMethod,
                ...donor.location
            },
            userId: auth.getTokenPayload()?.id // Include user ID from token
        };

        console.log("Submitting donor data:", requestData);

        // 4. API Request using Axios
        const response = await axios.post(
            `http://localhost:5000/api/donors/createDonor `,  // Use Vite env variable
            requestData,
            {
                headers: { 
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        // 5. Success Handling
        console.log("Donor registration successful:", response.data);
        navigate('/donor-thanks', {
            state: {
                donorId: response.data.donorId,
                message: "Thank you for registering as a donor!"
            }
        });

    } catch (error) {
        console.error("Donor submission error:", {
            error: error.response ? error.response.data : error.message,
            status: error.response?.status,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        // Handle authentication error
        if (error.response?.status === 401) {
            auth.removeToken();
            navigate('/login', { state: { from: 'donor-form' } });
            return;
        }

        alert(
            error.response?.data?.message || 
            `Submission failed: ${error.message}`
        );

        if (error.message.includes("token")) {
            auth.removeToken();
            navigate('/login');
        }
    }
};


  // Effects for country/state/district
  useEffect(() => {
    if (donor.country) {
      const selectedCountry = countryData.find((c) => c.name === donor.country);
      setStates(selectedCountry ? selectedCountry.states : []);
      setDonor((prev) => ({ ...prev, state: "", district: "" }));
    }
  }, [donor.country]);

  useEffect(() => {
    if (donor.state) {
      const selectedState = states.find((s) => s.name === donor.state);
      setDistricts(selectedState ? selectedState.districts : []);
      setDonor((prev) => ({ ...prev, district: "" }));
    }
  }, [donor.state]);

  // Render
  return (
    <div className="form-container">
      <h2>Blood Donor Form</h2>
      <form onSubmit={handleSubmit}>
        {/* Personal Information */}
        <div className="form-section">
          <h3>Personal Information</h3>
          
          <label>Full Name:</label>
          <input type="text" name="fullName" value={donor.fullName} onChange={handleChange} required />
          {errors.fullName && <p className="error">{errors.fullName}</p>}

          <label>Date of Birth:</label>
          <input 
            type="date" 
            name="dob" 
            value={donor.dob} 
            onChange={handleChange} 
            required 
            max={new Date().toISOString().split('T')[0]}
          />
          {errors.dob && <p className="error">{errors.dob}</p>}

          <label>Age:</label>
          <input 
            type="number" 
            name="age" 
            value={donor.age} 
            readOnly 
            className="read-only"
          />
          {errors.age && <p className="error">{errors.age}</p>}

          <label>Weight (kg):</label>
          <input 
            type="number" 
            name="weight" 
            value={donor.weight} 
            onChange={handleChange} 
            required 
            min="45"
            step="0.1"
          />
          {errors.weight && <p className="error">{errors.weight}</p>}

          <label>Blood Type:</label>
          <select name="bloodType" value={donor.bloodType} onChange={handleChange} required>
            <option value="">Select Blood Type</option>
            {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          {errors.bloodType && <p className="error">{errors.bloodType}</p>}

          <div className="form-group">
            <label>Have you donated blood before?</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="hasDonatedBefore"
                  value="yes"
                  checked={donor.hasDonatedBefore === true}
                  onChange={handleDonationToggle}
                />
                Yes
              </label>
              <label>
                <input
                  type="radio"
                  name="hasDonatedBefore"
                  value="no"
                  checked={donor.hasDonatedBefore === false}
                  onChange={handleDonationToggle}
                />
                No
              </label>
            </div>
          </div>

          {donor.hasDonatedBefore && (
            <div className="form-group">
              <label>Last Donation Date:</label>
              <input 
                type="date" 
                name="lastDonationDate" 
                value={donor.lastDonationDate} 
                onChange={handleChange} 
                max={new Date().toISOString().split('T')[0]} 
              />
              {errors.lastDonationDate && (
                <p className="error">{errors.lastDonationDate}</p>
              )}
              {donor.lastDonationDate && (
                <p className="info-text">
                  Donation gap: {donor.donationGap} months
                </p>
              )}
            </div>
          )}
        </div>
       
        {/* Availability */}
        <div className="form-section">
          <h3>Availability</h3>
          
          <label>Availability Time:</label>
          <div className="time-inputs">
            <input type="time" name="availabilityStart" value={donor.availabilityStart} onChange={handleChange} required />
            <span>to</span>
            <input type="time" name="availabilityEnd" value={donor.availabilityEnd} onChange={handleChange} required />
          </div>
          {errors.availabilityTime && <p className="error">{errors.availabilityTime}</p>}
        </div>

        {/* Health Information */}
        <div className="form-section">
          <h3>Health Information</h3>
          
          <label>Health Condition:</label>
          <div className="checkbox-group">
            {[...restrictedConditions, "None of the Above"].map((condition, index) => (
              <div key={index} className="checkbox-item">
                <input
                  type="checkbox"
                  name="healthCondition"
                  value={condition}
                  checked={donor.healthCondition.includes(condition)}
                  onChange={handleHealthConditionChange}
                />
                <label>{condition}</label>
              </div>
            ))}
          </div>
          {errors.healthCondition && <p className="error">{errors.healthCondition}</p>}
        </div>

        {/* Contact Information */}
        <div className="form-section">
          <h3>Contact Information</h3>
          
          <label>Contact Number:</label>
          <input type="tel" name="contactNumber" value={donor.contactNumber} onChange={handleChange} required pattern="[0-9]{10}" />
          {errors.contactNumber && <p className="error">{errors.contactNumber}</p>}

          {/* Location Method */}
          <div className="location-method">
            <label>Location Method:</label>
            <div>
              <input
                type="radio"
                id="addressMethod"
                name="locationMethod"
                checked={locationMethod === 'address'}
                onChange={() => setLocationMethod('address')}
              />
              <label htmlFor="addressMethod">Address</label>
              
              <input
                type="radio"
                id="gpsMethod"
                name="locationMethod"
                checked={locationMethod === 'gps'}
                onChange={() => setLocationMethod('gps')}
              />
              <label htmlFor="gpsMethod">GPS Location</label>
            </div>
          </div>

          {/* Address Fields */}
          {locationMethod === 'address' && (
            <>
              <label>Country:</label>
              <select name="country" value={donor.country} onChange={handleChange} required>
                <option value="">Select Country</option>
                {countryData.map((country) => (
                  <option key={country.name} value={country.name}>{country.name}</option>
                ))}
              </select>
              {errors.country && <p className="error">{errors.country}</p>}

              <label>State:</label>
              <select name="state" value={donor.state} onChange={handleChange} required disabled={!donor.country}>
                <option value="">Select State</option>
                {states.map((state) => (
                  <option key={state.name} value={state.name}>{state.name}</option>
                ))}
              </select>
              {errors.state && <p className="error">{errors.state}</p>}

              <label>District:</label>
              <select name="district" value={donor.district} onChange={handleChange} required disabled={!donor.state}>
                <option value="">Select District</option>
                {districts.map((district, index) => (
                  <option key={index} value={district}>{district}</option>
                ))}
              </select>
              {errors.district && <p className="error">{errors.district}</p>}

              <label>Street Address:</label>
              <input 
                type="text" 
                name="street" 
                value={donor.street} 
                onChange={handleChange} 
                required 
                placeholder="House no, Building, Street name"
              />
              {errors.street && <p className="error">{errors.street}</p>}
            </>
          )}

          {/* GPS Location */}
          {locationMethod === 'gps' && (
            <div className="gps-section">
              <label>Current Location:</label>
              <Gps location={donor.location} setLocation={handleLocationChange} />
              
              {donor.location.lat && donor.location.lng ? (
                <>
                  <div className="location-details">
                    <p>Coordinates: {donor.location.lat.toFixed(6)}, {donor.location.lng.toFixed(6)}</p>
                    {donor.location.address && (
                      <p>Address: {donor.location.address}</p>
                    )}
                  </div>
                  {errors.location && <p className="error">{errors.location}</p>}
                </>
              ) : null}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button type="submit" className="submit-btn" disabled={Object.keys(errors).length > 0}>
          Register as Donor
        </button>
      </form>
    </div>
  );
};

export default DonorForm;