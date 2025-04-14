import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, List, ListItem, ListItemText } from '@mui/material';
import api from '@/utils/axios';

const Profile = () => {
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchUserRequests = async () => {
      try {
        const response = await api.get('/api/receivers/my-requests');
        if (response.data.success) {
          setRequests(response.data.requests || []);
        }
      } catch (error) {
        console.error('Error fetching requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRequests();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Your Blood Requests</h2>
      
      {requests.length === 0 ? (
        <p>No requests found</p>
      ) : (
        <List>
          {requests.map(request => (
            <ListItem key={request.id} divider>
              <ListItemText
                primary={`Request #${request.id}`}
                secondary={`Status: ${request.status.toUpperCase()} | Blood Type: ${request.blood_type}`}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate(`/receiver/request-status/${request.id}`)}
              >
                View Details
              </Button>
            </ListItem>
          ))}
        </List>
      )}
    </div>
  );
};

export default Profile;