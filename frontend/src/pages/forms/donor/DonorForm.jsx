import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import auth from "../../../utils/auth";
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
    location: { 
      lat: null, 
      lng: null, 
      address: "" 
    },
    locationMethod: "address",
    isLocationLoading: false,
  });

  const [errors, setErrors] = useState({});
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("LOCATION STATE UPDATED TO:", donor.location);
  }, [donor.location]);

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

  const handleLocationFound = async (location) => {
    console.log("Raw location data received:", location);
    
    // Format the complete address
    const formattedAddress = location.address || [
      location.street,
      location.district,
      location.state,
      location.country
    ].filter(Boolean).join(', ');

    // Create the location object with proper type conversion
    const locationData = {
      lat: parseFloat(location.latitude || location.lat || 0),
      lng: parseFloat(location.longitude || location.lng || 0),
      address: formattedAddress,
      country: location.country || '',
      state: location.state || '',
      district: location.district || '',
      street: location.street || ''
    };

    console.log("Processing location data:", locationData);

    try {
      // First update the state immediately
      setDonor(prev => ({
        ...prev,
        location: {
          lat: locationData.lat,
          lng: locationData.lng,
          address: locationData.address
        },
        country: locationData.country,
        state: locationData.state,
        district: locationData.district,
        street: locationData.street,
        locationMethod: "gps",
        isLocationLoading: false
      }));

      // Then store in localStorage
      localStorage.setItem('donorLocation', JSON.stringify({
        lat: locationData.lat,
        lng: locationData.lng,
        address: locationData.address,
        country: locationData.country,
        state: locationData.state,
        district: locationData.district,
        street: locationData.street
      }));

      console.log("Location data stored and state updated:", locationData);

      // Verify the data
      const verifyData = {
        state: locationData,
        localStorage: JSON.parse(localStorage.getItem('donorLocation'))
      };
      console.log("Verification data:", verifyData);
    } catch (error) {
      console.error("Error handling location:", error);
      alert("There was an error saving your location. Please try again.");
    }
  };

  // Add useEffect to restore location data on component mount
  useEffect(() => {
    const savedLocation = localStorage.getItem('donorLocation');
    if (savedLocation && donor.locationMethod === "gps") {
      const parsedLocation = JSON.parse(savedLocation);
      setDonor(prev => ({
      ...prev, 
      location: {
          lat: parsedLocation.lat,
          lng: parsedLocation.lng,
          address: parsedLocation.address
        },
        country: parsedLocation.country,
        state: parsedLocation.state,
        district: parsedLocation.district,
        street: parsedLocation.street
      }));
    }
  }, []);

  const handleLocationError = (error) => {
    console.error("GPS Error:", error);
    setDonor(prev => ({ ...prev, isLocationLoading: false }));
    alert("Failed to get location. Please try again or use manual address.");
  };

  const validateForm = () => {
    const newErrors = {};
    console.log('Starting form validation...');

    // Basic field validation
    if (!donor.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!donor.dob) newErrors.dob = 'Date of birth is required';
    if (!donor.age) newErrors.age = 'Age is required';
    if (!donor.weight) newErrors.weight = 'Weight is required';
    if (!donor.bloodType) newErrors.bloodType = 'Blood type is required';
    if (!donor.contactNumber) newErrors.contactNumber = 'Contact number is required';
    if (!donor.availabilityStart) newErrors.availabilityStart = 'Availability start time is required';
    if (!donor.availabilityEnd) newErrors.availabilityEnd = 'Availability end time is required';

    // Location validation
    if (donor.locationMethod === "gps") {
      console.log('Validating GPS location:', donor.location);
      
      // Check current state first
      const hasValidStateLocation = donor.location && 
        typeof donor.location.lat === 'number' && 
        donor.location.lat !== 0 &&
        typeof donor.location.lng === 'number' && 
        donor.location.lng !== 0 &&
        donor.location.address;

      // Also check localStorage as backup
      const savedLocation = localStorage.getItem('donorLocation');
      let locationData = null;
      try {
        locationData = savedLocation ? JSON.parse(savedLocation) : null;
      } catch (error) {
        console.error('Error parsing saved location:', error);
      }

      const hasValidSavedLocation = locationData && 
        typeof locationData.lat === 'number' && 
        locationData.lat !== 0 &&
        typeof locationData.lng === 'number' && 
        locationData.lng !== 0 &&
        locationData.address;

      console.log('Location validation:', {
        stateValid: hasValidStateLocation,
        savedValid: hasValidSavedLocation,
        stateLocation: donor.location,
        savedLocation: locationData
      });

      if (!hasValidStateLocation && !hasValidSavedLocation) {
        newErrors.location = 'Please get your current location';
        console.log('GPS location validation failed - invalid or missing data');
      } else {
        console.log('GPS location validation passed');
      }
    } else {
      // Address validation
      if (!donor.country) newErrors.country = 'Country is required';
      if (!donor.state) newErrors.state = 'State is required';
      if (!donor.district) newErrors.district = 'District is required';
      if (!donor.street) newErrors.street = 'Street address is required';
    }

    // Health condition validation
    if (donor.healthCondition.length === 0) {
      newErrors.healthCondition = 'Please select at least one health condition';
    }

    // Previous donation validation
    if (donor.hasDonatedBefore) {
      if (!donor.lastDonationDate) newErrors.lastDonationDate = 'Last donation date is required';
      if (!donor.donationGap) newErrors.donationGap = 'Donation gap is required';
    }

    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log('Validation result:', isValid ? 'Valid' : 'Invalid', newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submission started');

    try {
      // Get the latest location data if using GPS
      if (donor.locationMethod === "gps") {
        const savedLocation = localStorage.getItem('donorLocation');
        if (savedLocation) {
          const locationData = JSON.parse(savedLocation);
          console.log('Retrieved saved location data:', locationData);
          
          // Update donor state with saved location data and wait for it to complete
          await new Promise(resolve => {
            setDonor(prev => {
              const updatedDonor = {
                ...prev,
                location: {
                  lat: locationData.lat,
                  lng: locationData.lng,
                  address: locationData.address
                },
                country: locationData.country,
                state: locationData.state,
                district: locationData.district,
                street: locationData.street
              };
              console.log("Updated donor state before validation:", updatedDonor);
              return updatedDonor;
            });
            resolve();
          });
        }
      }

      // Wait for state update to complete before validation
      await new Promise(resolve => setTimeout(resolve, 0));

      console.log('Current donor state before validation:', donor);
      
      // Validate form
      if (!validateForm()) {
        console.log('Form validation failed');
        return;
      }

      setIsSubmitting(true);
      console.log('Form validation passed, proceeding with submission');

      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to register as a donor.');
        navigate('/login');
      return;
    }
  
      // Get the final location data for the request
      const locationData = donor.locationMethod === "gps" 
        ? JSON.parse(localStorage.getItem('donorLocation'))
        : null;

      console.log('Location data for request:', locationData);

      const requestData = {
        fullName: donor.fullName,
        bloodType: donor.bloodType,
        availabilityStart: donor.availabilityStart,
        availabilityEnd: donor.availabilityEnd,
        contactNumber: donor.contactNumber,
        dob: donor.dob,
        age: donor.age,
        weight: donor.weight,
        lastDonation: donor.lastDonationDate || '',
        medicalConditions: donor.healthCondition.join(', '),
        hasDonatedBefore: donor.hasDonatedBefore,
        donationGap: donor.donationGap || '',
        healthCondition: donor.healthCondition.join(', '),
        isAvailable: true,
        isVerified: false,
        status: 'pending',
        country: locationData ? locationData.country : donor.country,
        state: locationData ? locationData.state : donor.state,
        district: locationData ? locationData.district : donor.district,
        address: locationData ? locationData.street : donor.street,
        locationAddress: locationData ? locationData.address : `${donor.street}, ${donor.district}, ${donor.state}, ${donor.country}`,
        location_lat: locationData ? locationData.lat : null,
        location_lng: locationData ? locationData.lng : null
      };

      console.log('Final request data:', requestData);

      const response = await axios.post('http://localhost:5000/api/donors/createDonor', requestData, {
          headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Server response:', response.data);
      
      if (response.data.success) {
        navigate('/donor-thanks');
      } else {
        alert(response.data.message || 'Failed to submit form. Please try again.');
      }
    } catch (error) {
      console.error('Submission error:', error);
      if (error.response?.data?.missingFields) {
        alert(`Missing required fields: ${error.response.data.missingFields.join(', ')}`);
      } else {
        alert(error.response?.data?.message || 'Failed to submit form. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
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
              {errors.lastDonation && (
                <p className="error">{errors.lastDonation}</p>
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
                checked={donor.locationMethod === 'address'}
                onChange={() => setDonor(prev => ({ ...prev, locationMethod: 'address' }))}
              />
              <label htmlFor="addressMethod">Address</label>
              
              <input
                type="radio"
                id="gpsMethod"
                name="locationMethod"
                checked={donor.locationMethod === 'gps'}
                onChange={() => setDonor(prev => ({ ...prev, locationMethod: 'gps' }))}
              />
              <label htmlFor="gpsMethod">GPS Location</label>
            </div>
          </div>

          {/* Address Fields */}
          {donor.locationMethod === 'address' && (
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
          {donor.locationMethod === 'gps' && (
  <div className="gps-section">
    <label>Current Location:</label>
    <Gps 
                onLocationFound={handleLocationFound}
                onError={handleLocationError}
              />
              {donor.isLocationLoading ? (
                <p>Loading location...</p>
              ) : donor.location?.lat ? (
                <div style={{ marginTop: '10px' }}>
                  <p>📍 <strong>Coordinates:</strong> {donor.location.lat}, {donor.location.lng}</p>
                  <p>�� <strong>Address:</strong> {donor.location.address}</p>
        <p>🌍 <strong>Country:</strong> {donor.country}</p>
        <p>🏛️ <strong>State:</strong> {donor.state}</p>
        <p>🏘️ <strong>District:</strong> {donor.district}</p>
        <p>🛣️ <strong>Street:</strong> {donor.street}</p>
      </div>
              ) : null}
  </div>
)}
</div>

        {/* Submit Button */}
        <button type="submit" className="submit-btn" disabled={Object.keys(errors).length > 0 || isSubmitting}>
          {isSubmitting ? 'Processing...' : 'Register as Donor'}
        </button>
      </form>
    </div>
  );
};

export default DonorForm;