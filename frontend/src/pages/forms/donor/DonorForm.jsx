import React, { useState, useEffect } from "react";
import "../FormStyles.css";
import MapComponent from '../../../components/MapComponent';
import countryData from "/src/data/countryData.json";

const DonorForm = () => {
  const [donor, setDonor] = useState({
    fullName: "",
    age: "",
    weight: "",
    bloodType: "",
    hasDonatedBefore: "", // Changed to string for radio buttons
    lastDonationDate: "",
    donationGap: "",
    healthCondition: [],
    country: "",
    state: "",
    district: "",
    address: "",
    contactNumber: "",
    location: { lat: null, lng: null },
  });

  const [errors, setErrors] = useState({});
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [locationConfirmed, setLocationConfirmed] = useState(false);

  


  const restrictedConditions = [
    "HIV",
    "Hepatitis B",
    "Hepatitis C",
    "Cancer",
    "Heart Disease",
    "Kidney Disease",
    "Tuberculosis",
    "Diabetes (on insulin)",
    "Recent Surgery",
    "Malaria (in last 3 months)",
    "Pregnancy",
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setDonor(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

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
        let updatedConditions = prev.healthCondition.filter((c) => c !== "None of the Above");

        if (checked) {
          updatedConditions.push(value);
        } else {
          updatedConditions = updatedConditions.filter((c) => c !== value);
        }

        return { ...prev, healthCondition: updatedConditions };
      });
    }
  };

  const handleLocationSelect = (newLocation) => {
    setDonor(prev => ({ ...prev, location: newLocation }));
    setLocationConfirmed(false); // Reset confirmation when location changes
  };

  const confirmLocation = () => {
    if (donor.location.lat && donor.location.lng) {
      setLocationConfirmed(true);
    }
  };


  const validateForm = () => {
    let validationErrors = {};

    if (!donor.fullName.trim()) validationErrors.fullName = "Full Name is required.";
    if (!donor.age || isNaN(donor.age) || donor.age < 18)
      validationErrors.age = "Minimum age requirement is 18 years.";
    if (!donor.weight || isNaN(donor.weight) || donor.weight < 45)
      validationErrors.weight = "Minimum weight requirement is 45kg.";
    if (!donor.bloodType) validationErrors.bloodType = "Please select a blood type.";
    if (!donor.hasDonatedBefore) 
      validationErrors.hasDonatedBefore = "Please select an option";
    
    if (donor.hasDonatedBefore === "yes" && donor.donationGap < 3) {
      validationErrors.donationGap = "Minimum donation gap is 3 months.";
    }

    const hasRestrictedCondition = donor.healthCondition.some((condition) =>
      restrictedConditions.includes(condition)
    );

    if (hasRestrictedCondition) {
      validationErrors.healthCondition = "You are not eligible to donate due to health conditions.";
    }

    if (!/^\d{10}$/.test(donor.contactNumber))
      validationErrors.contactNumber = "Enter a valid 10-digit phone number.";

    if (!locationConfirmed) {
        validationErrors.location = "Please confirm your selected location";
      }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  // ... (keep the existing useEffect hooks for country/state/district)

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log("Donor Details:", donor);
      alert("Thank you for registering as a donor!");
    }
  };

  return (
    <div className="form-container">
      <h2>Blood Donor Form</h2>
      <form onSubmit={handleSubmit}>
        <label>Full Name:</label>
        <input type="text" name="fullName" value={donor.fullName} onChange={handleChange} required />
        {errors.fullName && <p className="error">{errors.fullName}</p>}

        <label>Age (Minimum 18 years):</label>
        <input 
          type="number" 
          name="age" 
          value={donor.age} 
          onChange={handleChange} 
          min="18"
          required 
        />
        {errors.age && <p className="error">{errors.age}</p>}

        <label>Weight (Minimum 45kg):</label>
        <input 
          type="number" 
          name="weight" 
          value={donor.weight} 
          onChange={handleChange} 
          min="45"
          required 
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

        <div className="radio-group">
          <label>Have you donated blood before?</label>
          <div className="radio-options">
            <label>
              <input
                type="radio"
                name="hasDonatedBefore"
                value="yes"
                checked={donor.hasDonatedBefore === "yes"}
                onChange={handleChange}
                required
              />
              Yes
            </label>
            <label>
              <input
                type="radio"
                name="hasDonatedBefore"
                value="no"
                checked={donor.hasDonatedBefore === "no"}
                onChange={handleChange}
              />
              No
            </label>
          </div>
          {errors.hasDonatedBefore && <p className="error">{errors.hasDonatedBefore}</p>}
        </div>

        {donor.hasDonatedBefore === "yes" && (
          <>
            <label>Last Donation Date:</label>
            <input 
              type="date" 
              name="lastDonationDate" 
              value={donor.lastDonationDate} 
              onChange={handleChange} 
              required
            />
            <label>Donation Gap (months):</label>
            <input 
              type="number" 
              name="donationGap" 
              value={donor.donationGap} 
              readOnly 
            />
            {errors.donationGap && <p className="error">{errors.donationGap}</p>}
          </>
        )}

        <label>Health Conditions:</label>
        <div className="checkbox-group">
          {restrictedConditions.concat(["None of the Above"]).map((condition, index) => (
            <div key={index} className="checkbox-item">
              <input
                type="checkbox"
                value={condition}
                checked={donor.healthCondition.includes(condition)}
                onChange={handleHealthConditionChange}
              />
              <label>{condition}</label>
            </div>
          ))}
        </div>
        {errors.healthCondition && <p className="error">{errors.healthCondition}</p>}

        <label>Contact Number:</label>
        <input type="text" name="contactNumber" value={donor.contactNumber} onChange={handleChange} required />

        <label>Address:</label>
        <textarea 
          name="address" 
          value={donor.address} 
          onChange={handleChange} 
          required 
          rows="3"
          placeholder="Enter your full address"
        />

        <label>Location:</label>
        <div className="map-container">
            <MapComponent 
              location={donor.location} 
              setLocation={handleLocationSelect} 
            />
          </div>
          {donor.location.lat && donor.location.lng ? (
            <div className="location-confirmation">
              <p>Selected Location: 
                <span className="coordinates">
                  {donor.location.lat.toFixed(4)}, {donor.location.lng.toFixed(4)}
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
                  {errors.location && <p className="error">{errors.location}</p>}
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
          


        {/*<MapComponent location={donor.location} setLocation={(newLocation) => setDonor({ ...donor, location: newLocation })} />*/}

        <button type="submit">Register as Donor</button>
      </form>
    </div>
  );
};

export default DonorForm;