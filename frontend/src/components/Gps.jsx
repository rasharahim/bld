import { useState, useEffect } from "react";

const Gps = () => {
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);
    const [userAddress, setUserAddress] = useState("");
    const [error, setError] = useState(null);

    useEffect(() => {
        const geo = navigator.geolocation;
        if (geo) {
            geo.getCurrentPosition(
                (position) => {
                    setLatitude(position.coords.latitude);
                    setLongitude(position.coords.longitude);
                },
                (err) => {
                    setError("Unable to retrieve location. Please allow location access.");
                    console.error("Geolocation error:", err);
                }
            );
        } else {
            setError("Geolocation is not supported by this browser.");
        }
    }, []); // Runs only once on component mount

    const getUserAddress = async () => {
        if (!latitude || !longitude) {
            console.error("Latitude and longitude are not available.");
            return;
        }

        const apiKey = import.meta.env.VITE_OPENCAGE_API_KEY; // Use Vite's environment variable
        if (!apiKey) {
            console.error("API key is missing. Please check your .env file.");
            setError("API key is missing.");
            return;
        }

        const url = `https://api.opencagedata.com/geocode/v1/json?key=${apiKey}&q=${latitude},${longitude}&pretty=1&no_annotations=1`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            console.log("API Response:", data); // Debugging log
            if (data.results && data.results.length > 0) {
                setUserAddress(data.results[0].formatted);
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
        <>
            <h1>Current Location</h1>
            {error ? (
                <p style={{ color: "red" }}>{error}</p>
            ) : (
                <>
                    <h2>Latitude: {latitude || "Loading..."}</h2>
                    <h2>Longitude: {longitude || "Loading..."}</h2>
                    <h2>User Address: {userAddress || "Not fetched yet"}</h2>
                    <button
                        type="button"
                        onClick={getUserAddress}
                        disabled={!latitude || !longitude}
                    >
                        Get User Address
                    </button>
                </>
            )}
        </>
    );
};

export default Gps;