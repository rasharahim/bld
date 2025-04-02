import React, { useState, useEffect } from "react";
import "../FormStyles.css";
import MapComponent from '../../../components/MapComponent';
import Gps from "@/components/Gps";
import countryData from "/src/data/countryData.json";

const ReceiverForm = () => {
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
    location: { lat: null, lng: null, address: "" },
  });

  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [locationMethod, setLocationMethod] = useState("address");
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    if (e.target.name === "prescription") {
      setReceiver({ ...receiver, prescription: e.target.files[0] });
    } else {
      setReceiver({ ...receiver, [e.target.name]: e.target.value });
    }
  };

  const handleLocationChange = (newLocation) => {
    setReceiver(prev => ({ 
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

    if (!receiver.fullName.trim()) validationErrors.fullName = "Full Name is required.";
    if (!receiver.age || isNaN(receiver.age) || receiver.age < 1) 
      validationErrors.age = "Please enter a valid age.";
    if (!receiver.bloodType) validationErrors.bloodType = "Please select a blood type.";
    if (!receiver.contactNumber) validationErrors.contactNumber = "Contact number is required.";
    if (!receiver.reasonForRequest) validationErrors.reasonForRequest = "Please provide reason for request.";
    if (!receiver.prescription) validationErrors.prescription = "Doctor's prescription is required.";

    if (locationMethod === "address") {
      if (!receiver.country) validationErrors.country = "Country is required.";
      if (!receiver.state) validationErrors.state = "State is required.";
      if (!receiver.district) validationErrors.district = "District is required.";
      if (!receiver.address) validationErrors.address = "Address is required.";
    } else {
      if (!receiver.location.lat || !receiver.location.lng) {
        validationErrors.location = "Please select your location on the map";
      }
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log("Receiver Details:", receiver);
      alert("Receiver request submitted successfully!");
    }
  };

  useEffect(() => {
    if (receiver.country) {
      const selectedCountry = countryData.find((c) => c.name === receiver.country);
      setStates(selectedCountry ? selectedCountry.states : []);
      setReceiver(prev => ({ ...prev, state: "", district: "" }));
    }
  }, [receiver.country]);

  useEffect(() => {
    if (receiver.state) {
      const selectedState = states.find((s) => s.name === receiver.state);
      setDistricts(selectedState ? selectedState.districts : []);
      setReceiver(prev => ({ ...prev, district: "" }));
    }
  }, [receiver.state]);

  return (
    <div className="form-container">
      <h2>Blood Receiver Form</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Personal Information</h3>
          
          <label>Full Name:</label>
          <input type="text" name="fullName" value={receiver.fullName} onChange={handleChange} required />
          {errors.fullName && <p className="error">{errors.fullName}</p>}

          <label>Age:</label>
          <input type="number" name="age" value={receiver.age} onChange={handleChange} required />
          {errors.age && <p className="error">{errors.age}</p>}

          <label>Blood Type:</label>
          <select name="bloodType" value={receiver.bloodType} onChange={handleChange} required>
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

          {locationMethod === 'address' ? (
            <>
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

              <label>Country:</label>
              <select name="country" value={receiver.country} onChange={handleChange} required>
                <option value="">Select</option>
                {countryData.map((country, index) => (
                  <option key={index} value={country.name}>{country.name}</option>
                ))}
              </select>
              {errors.country && <p className="error">{errors.country}</p>}

              <label>State:</label>
              <select name="state" value={receiver.state} onChange={handleChange} required disabled={!receiver.country}>
                <option value="">Select</option>
                {states.map((state, index) => (
                  <option key={index} value={state.name}>{state.name}</option>
                ))}
              </select>
              {errors.state && <p className="error">{errors.state}</p>}

              <label>District:</label>
              <select name="district" value={receiver.district} onChange={handleChange} required disabled={!receiver.state}>
                <option value="">Select</option>
                {districts.map((district, index) => (
                  <option key={index} value={district}>{district}</option>
                ))}
              </select>
              {errors.district && <p className="error">{errors.district}</p>}
            </>
          ) : (
            <div className="gps-section">
              <label>Current Location:</label>
              <Gps location={receiver.location} setLocation={handleLocationChange} />
              
              {receiver.location.lat && receiver.location.lng ? (
                <>
                  <div className="location-details">
                    <p>Coordinates: {receiver.location.lat.toFixed(6)}, {receiver.location.lng.toFixed(6)}</p>
                    {receiver.location.address && (
                      <p>Address: {receiver.location.address}</p>
                    )}
                  </div>
                  {errors.location && <p className="error">{errors.location}</p>}
                </>
              ) : (
                <p className="instruction">Please select your location on the map</p>
              )}
            </div>
          )}
        </div>

        <div className="form-section">
          <h3>Request Details</h3>
          
          <label>Contact Number:</label>
          <input type="text" name="contactNumber" value={receiver.contactNumber} onChange={handleChange} required />
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
            required 
          />
          {errors.prescription && <p className="error">{errors.prescription}</p>}
        </div>

        <button type="submit" className="submit-btn">Submit Request</button>
      </form>
    </div>
  );
};

export default ReceiverForm;