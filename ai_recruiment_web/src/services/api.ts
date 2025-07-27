import axios from 'axios';

const api = axios.create({
  baseURL: '/api/v1',
});

export const checkApiHealth = async () => {
  try {
    const response = await axios.get('/health');
    console.log('API Health Check Response:', response); // Log the full response
    // The health check endpoint for this API returns HTML, not JSON.
    // A successful health check will return a 200 OK status.
    const isOk = response.status === 200;
    console.log('Is API healthy?', isOk);
    return isOk;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

export default api; 