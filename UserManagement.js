import React, { useEffect, useState } from 'react';
import axios from 'axios';
import UpdateUserForm from './UpdateUserForm';
import '../styles/UserManagement.css';
import { FaEdit, FaUserSlash } from 'react-icons/fa';
import { FaSearch } from 'react-icons/fa';


const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ id: '', firstName: '', lastName: '', email: '', password: '' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState(''); // ✅ New state for search

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:8081/all-users', { withCredentials: true });
      const entries = response.data?.list?.entries || [];
      const filteredUsers = entries
        .map(entry => entry.entry)
        .filter(user => user.id !== 'admin');
      setUsers(filteredUsers);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateUser = async () => {
    try {
      await axios.post('http://localhost:8081/create-user', newUser, { withCredentials: true });
      alert('User created successfully');
      fetchUsers();
      setNewUser({ id: '', firstName: '', lastName: '', email: '', password: '' });
    } catch (err) {
      alert('Failed to create user');
      console.error(err);
    }
  };

  const handleDisableUser = async (userId) => {
    try {
      await axios.put(`http://localhost:8081/disable-user/${userId}`, {}, { withCredentials: true });
      alert('User disabled');
      fetchUsers();
    } catch (err) {
      alert('Failed to disable user');
      console.error(err);
    }
  };

  const handleUpdateUser = (userId) => {
    const user = users.find(u => u.id === userId);
    setSelectedUser(user);
  };

  const updateUser = async (userId, formData) => {
    try {
      await axios.put(`http://localhost:8081/update-user/${userId}`, formData, { withCredentials: true });
      alert('User updated');
      fetchUsers();
    } catch (err) {
      alert('Failed to update user');
      console.error(err);
    }
  };

  const filteredUsers = users.filter(user =>
  (user.id?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
  (`${user.firstName || ''} ${user.lastName || ''}`.toLowerCase()).includes(searchTerm.toLowerCase()) ||
  (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
);


  return (
    <div className="user-management">
      <h2>Manage Users</h2>

      {/* Toggle Button */}
      <button className="toggle-create-btn" onClick={() => setShowCreateForm(!showCreateForm)}>
        {showCreateForm ? 'Cancel' : 'Create New User'}
      </button>

      {/* Create User Form */}
      {showCreateForm && (
        <div className="create-user-form">
          <input type="text" name="id" placeholder="Username" value={newUser.id} onChange={handleInputChange} />
          <input type="text" name="firstName" placeholder="First Name" value={newUser.firstName} onChange={handleInputChange} />
          <input type="text" name="lastName" placeholder="Last Name" value={newUser.lastName} onChange={handleInputChange} />
          <input type="email" name="email" placeholder="Email" value={newUser.email} onChange={handleInputChange} />
          <input type="password" name="password" placeholder="Password" value={newUser.password} onChange={handleInputChange} />
          <button onClick={handleCreateUser}>Create User</button>
        </div>
      )}

      {/* ✅ Search Bar */}
      <div className="search-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search by username, name, or email"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <FaSearch className="search-icon" />
      </div>

      {/* User Table */}
      <table className="user-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Full Name</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map(user => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.firstName} {user.lastName}</td>
              <td>{user.email}</td>
              <td>
                <button className="icon-btn edit" onClick={() => handleUpdateUser(user.id)} title="Edit">
                  <FaEdit />
                </button>
                <button className="icon-btn disable" onClick={() => handleDisableUser(user.id)} title="Disable">
                  <FaUserSlash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Update Modal */}
      {selectedUser && (
        <UpdateUserForm
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={updateUser}
        />
      )}
    </div>
  );
};

export default UserManagement;
