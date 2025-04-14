import { useState, useEffect } from "react";

const Gps = ({ onLocationFound, onError }) => {
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);
    const [userAddress, setUserAddress] = useState("");
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const extractLocationComponents = (components, formatted) => {
        console.log("Raw components from API:", components);
        console.log("Formatted address:", formatted);
        
        // For Kerala locations, ensure we get the correct state
        const state = "Kerala";
        
        // For district, prioritize the city/town name
        const district = components.city || 
                        components.town || 
                        components.county || 
                        components.district || 
                        components.municipality || 
                        components.suburb || 
                        "";
                        
        console.log("Extracted state and district:", {
            state,
            district,
            allComponents: components
        });
        
        return { state, district };
    };

    const handleGetLocation = () => {
        setError(null);
        setIsLoading(true);
        
        const geo = navigator.geolocation;
        if (!geo) {
            const error = "Geolocation is not supported by this browser.";
            setError(error);
            setIsLoading(false);
            if (onError) onError(new Error(error));
            return;
        }

        // Options for high accuracy
        const geoOptions = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        geo.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    console.log("Raw GPS coordinates:", { latitude, longitude });
                    setLatitude(latitude);
                    setLongitude(longitude);
                    
                    const apiKey = import.meta.env.VITE_OPENCAGE_API_KEY;
                    if (!apiKey) {
                        throw new Error("API key is missing. Please check your .env file.");
                    }

                    // Add language and limit parameters for more precise results
                    const url = `https://api.opencagedata.com/geocode/v1/json?key=${apiKey}&q=${latitude},${longitude}&pretty=1&no_annotations=1&language=en&limit=1&countrycode=in`;

                    const response = await fetch(url);
                    const data = await response.json();
                    console.log("OpenCage API Full Response:", data);
                    
                    if (!data.results || data.results.length === 0) {
                        throw new Error("No location data found");
                    }

                    const result = data.results[0];
                    const components = result.components;
                    const formatted = result.formatted;
                    setUserAddress(formatted);
                    
                    // Extract location components
                    const { state, district } = extractLocationComponents(components, formatted);
                    
                    // Create location data object
                    const locationData = {
                        latitude,
                        longitude,
                        address: formatted,
                        country: "India",
                        state,
                        district,
                        street: components.road || components.street || "",
                        postal_code: components.postcode || "",
                        city: components.city || components.town || "",
                        suburb: components.suburb || components.neighbourhood || "",
                    };
                    
                    console.log("Final location data being sent:", locationData);
                    
                    if (onLocationFound) {
                        onLocationFound(locationData);
                    }
                } catch (err) {
                    console.error("Error in location process:", err);
                    setError(err.message || "Error fetching location details");
                    if (onError) onError(err);
                } finally {
                    setIsLoading(false);
                }
            },
            (err) => {
                console.error("Geolocation error:", err);
                setError("Unable to retrieve location. Please allow location access and ensure GPS is enabled.");
                setIsLoading(false);
                if (onError) onError(err);
            },
            geoOptions
        );
    };

    return (
        <div className="gps-component">
            <button 
                onClick={handleGetLocation}
                className="get-location-btn"
                disabled={isLoading}
                style={{
                    padding: '10px 20px',
                    backgroundColor: isLoading ? '#cccccc' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    marginBottom: '10px'
                }}
            >
                {isLoading ? 'Getting Location...' : 'Get Current Location'}
            </button>
            
            {error ? (
                <p style={{ color: "red" }}>{error}</p>
            ) : (
                <>
                    {(latitude && longitude) ? (
                        <div className="location-info">
                            <div className="coordinates">
                                <p>Latitude: {latitude}</p>
                                <p>Longitude: {longitude}</p>
                            </div>
                            <div className="address">
                                <p>Address: {userAddress || "Fetching address..."}</p>
                            </div>
                        </div>
                    ) : (
                        <p>Click the button to get your current location</p>
                    )}
                </>
            )}
        </div>
    );
};

export default Gps;