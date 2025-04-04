import { useState, useEffect } from "react";

const Gps = ({ onLocationUpdate }) => {
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);
    const [userAddress, setUserAddress] = useState("");
    const [error, setError] = useState(null);

    useEffect(() => {
        const geo = navigator.geolocation;
        if (geo) {
            geo.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    setLatitude(latitude);
                    setLongitude(longitude);
                    
                    // Pass location to parent component
                    if (onLocationUpdate) {
                        onLocationUpdate({
                            latitude,
                            longitude,
                            address: userAddress
                        });
                    }
                },
                (err) => {
                    setError("Unable to retrieve location. Please allow location access.");
                    console.error("Geolocation error:", err);
                }
            );
        } else {
            setError("Geolocation is not supported by this browser.");
        }
    }, [onLocationUpdate]); // Add onLocationUpdate to dependencies

    const getUserAddress = async () => {
        if (!latitude || !longitude) {
            console.error("Latitude and longitude are not available.");
            return;
        }

        const apiKey = import.meta.env.VITE_OPENCAGE_API_KEY;
        if (!apiKey) {
            console.error("API key is missing. Please check your .env file.");
            setError("API key is missing.");
            return;
        }

        const url = `https://api.opencagedata.com/geocode/v1/json?key=${apiKey}&q=${latitude},${longitude}&pretty=1&no_annotations=1`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            console.log("API Response:", data);
            if (data.results && data.results.length > 0) {
                const result = data.results[0];
                const components = result.components;
                const address = result.formatted;
                setUserAddress(address);
                
                // Extract address components
                const locationData = {
                    latitude,
                    longitude,
                    address,
                    country: components.country || "",
                    state: components.state || components.region || "",
                    district: components.state_district || components.county || components.city || "",
                };
                
                console.log("Extracted location data:", locationData);
                
                // Pass updated location with address components to parent component
                if (onLocationUpdate) {
                    onLocationUpdate(locationData);
                }
            } else {
                console.error("No address found for the given coordinates.");
                setError("No address found for the given coordinates.");
            }
        } catch (err) {
            console.error("Error fetching user address:", err);
            setError("Error fetching user address.");
        }
    };

    return (
        <div className="gps-component">
            {error ? (
                <p style={{ color: "red" }}>{error}</p>
            ) : (
                <>
                    <div className="coordinates">
                        <p>Latitude: {latitude || "Loading..."}</p>
                        <p>Longitude: {longitude || "Loading..."}</p>
                    </div>
                    <div className="address">
                        <p>Address: {userAddress || "Not fetched yet"}</p>
                        <button
                            type="button"
                            onClick={getUserAddress}
                            disabled={!latitude || !longitude}
                            className="get-address-btn"
                        >
                            Get Address
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default Gps;