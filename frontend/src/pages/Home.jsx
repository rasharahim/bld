import React from 'react';
import { Link } from 'react-router-dom';
import auth from '../utils/auth';

const Home = () => {
  const isLoggedIn = auth.isAuthenticated();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-pink-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Welcome to BloodConnect</h1>
            <p className="text-xl mb-8">Connecting blood donors with those in need</p>
            <div className="flex justify-center space-x-4">
              {!isLoggedIn && (
                <>
                  <Link
                    to="/register"
                    className="bg-white text-pink-600 px-6 py-3 rounded-md font-medium hover:bg-gray-100"
                  >
                    Sign Up
                  </Link>
                  <Link
                    to="/login"
                    className="border border-white text-white px-6 py-3 rounded-md font-medium hover:bg-pink-700"
                  >
                    Login
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Donate Blood Card */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Donate Blood</h2>
            <p className="text-gray-600 mb-4">
              Register as a blood donor and help save lives in your community.
            </p>
            <Link
              to={isLoggedIn ? "/donor/register" : "/login"}
              className="inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Become a Donor
            </Link>
          </div>

          {/* Request Blood Card */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Request Blood</h2>
            <p className="text-gray-600 mb-4">
              Submit a blood request and connect with potential donors.
            </p>
            <Link
              to={isLoggedIn ? "/receiver/request" : "/login"}
              className="inline-block bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700"
            >
              Request Blood
            </Link>
          </div>

          {/* Track Status Card */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Track Status</h2>
            <p className="text-gray-600 mb-4">
              Check the status of your blood donations and requests.
            </p>
            <Link
              to={isLoggedIn ? "/profile" : "/login"}
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Check Status
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 