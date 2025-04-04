// Authentication helper functions
const auth = {
    // Get token from localStorage
    getToken: () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        return token;
      } catch (error) {
        console.error('Error getting token:', error);
        throw error;
      }
    },
  
    // Store token in localStorage
    setToken: (token) => {
      try {
        localStorage.setItem('token', token);
      } catch (error) {
        console.error('Error storing token:', error);
        throw error;
      }
    },
  
    // Remove token (logout)
    removeToken: () => {
      try {
        localStorage.removeItem('token');
      } catch (error) {
        console.error('Error removing token:', error);
        throw error;
      }
    },
  
    // Verify token exists and is valid (basic check)
    isAuthenticated: () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return false;
        
        // Optional: Add JWT verification logic here if needed
        return true;
      } catch (error) {
        console.error('Authentication check failed:', error);
        return false;
      }
    },
  
    // Get token payload (if using JWT)
    getTokenPayload: () => {
      try {
        const token = auth.getToken();
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload;
      } catch (error) {
        console.error('Error decoding token:', error);
        return null;
      }
    }
  };
  
  export default auth;