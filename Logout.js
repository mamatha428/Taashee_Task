import axios from 'axios';
import { toast } from 'react-toastify';

export const handleLogout = async (navigate) => {
  try {
    await axios.get('http://localhost:8081/logout', { withCredentials: true });
    toast.success("Logged out successfully!");
navigate("/login", { state: { message: "Logged out successfully" } });
  } catch (error) {
    toast.error("Logout failed: " + error.message);
    console.error(error);
  }
};
