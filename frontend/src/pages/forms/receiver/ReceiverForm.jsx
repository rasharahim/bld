import React, { useState, useEffect } from "react";
import "../FormStyles.css";
import MapComponent from '../../../components/MapComponent';
import countryData from "/src/data/countryData.json";

const ReceiverForm = () => {
  const [receiver, setReceiver] = useState({
    fullName: "",
    age: "",
    bloodType: "",
    country: "",
    state: "",
    district: "",
    address: "", // Added address field
    contactNumber: "",
    reasonForRequest: "",
    prescription: null,
    location: { lat: null, lng: null },
  });

  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [locationConfirmed, setLocationConfirmed] = useState(false);

  const handleChange = (e) => {
    if (e.target.name === "prescription") {
      setReceiver({ ...receiver, prescription: e.target.files[0] });
    } else {
      setReceiver({ ...receiver, [e.target.name]: e.target.value });
    }
  };

  const handleLocationSelect = (newLocation) => {
    setReceiver(prev => ({ ...prev, location: newLocation }));
    setLocationConfirmed(false);
  };

  const confirmLocation = () => {
    if (receiver.location.lat && receiver.location.lng) {
      setLocationConfirmed(true);
    }
  };

  // ... (keep existing useEffect hooks for country/state/district)

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!locationConfirmed) {
      alert("Please confirm your location on the map");
      return;
    }

    if (!receiver.prescription) {
      alert("Please upload a doctor's prescription.");
      return;
    }

    console.log("Receiver Details:", receiver);
    alert("Receiver request submitted successfully!");
  };

  return (
    <div className="form-container">
      <h2>Blood Receiver Form</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <label>Full Name:</label>
          <input type="text" name="fullName" value={receiver.fullName} onChange={handleChange} required />

          <label>Age:</label>
          <input type="number" name="age" value={receiver.age} onChange={handleChange} required />

          <label>Blood Type:</label>
          <select name="bloodType" value={receiver.bloodType} onChange={handleChange} required>
            <option value="">Select</option>
            {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="form-section">
          <h3>Location Details</h3>
          <label>Address:</label>
          <textarea 
            name="address" 
            value={receiver.address} 
            onChange={handleChange} 
            required 
            rows="3"
            placeholder="Enter your full address"
          />

          <label>Country:</label>
          <select name="country" value={receiver.country} onChange={handleChange} required>
            <option value="">Select</option>
            {countryData.map((country, index) => (
              <option key={index} value={country.name}>{country.name}</option>
            ))}
          </select>

          <label>State:</label>
          <select name="state" value={receiver.state} onChange={handleChange} required disabled={!receiver.country}>
            <option value="">Select</option>
            {states.map((state, index) => (
              <option key={index} value={state.name}>{state.name}</option>
            ))}
          </select>

          <label>District:</label>
          <select name="district" value={receiver.district} onChange={handleChange} required disabled={!receiver.state}>
            <option value="">Select</option>
            {districts.map((district, index) => (
              <option key={index} value={district}>{district}</option>
            ))}
          </select>
        </div>

        <div className="form-section">
          <label>Map Location:</label>
          <div className="map-container">
            <MapComponent 
              location={receiver.location} 
              setLocation={handleLocationSelect} 
            />
          </div>
          
          {receiver.location.lat && receiver.location.lng ? (
            <div className="location-confirmation">
              <p>Selected Location: 
                <span className="coordinates">
                  {receiver.location.lat.toFixed(4)}, {receiver.location.lng.toFixed(4)}
                </span>
              </p>
              
              {!locationConfirmed ? (
                <>
                  <button 
                    type="button" 
                    onClick={confirmLocation}
                    className="confirm-location-btn"
                  >
                    Confirm This Location
                  </button>
                </>
              ) : (
                <p className="confirmation-success">
                  ✓ Location confirmed
                </p>
              )}
            </div>
          ) : (
            <p className="instruction">Please select your location on the map</p>
          )}
        </div>

        <div className="form-section">
          <label>Contact Number:</label>
          <input type="text" name="contactNumber" value={receiver.contactNumber} onChange={handleChange} required />

          <label>Reason for Blood Request:</label>
          <textarea name="reasonForRequest" value={receiver.reasonForRequest} onChange={handleChange} required></textarea>

          <label>Doctor's Prescription (PDF or Image):</label>
          <input type="file" name="prescription" accept=".pdf, .jpg, .jpeg, .png" onChange={handleChange} required />
        </div>

        <button type="submit">Submit Request</button>
      </form>
    </div>
  );
};

export default ReceiverForm;