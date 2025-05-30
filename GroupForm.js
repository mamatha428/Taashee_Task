// CreateGroupForm.jsx
import { useState } from 'react';
import axios from 'axios';
import '../styles/GroupForm.css';

function GroupForm({ onClose }) {
  const [id, setId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState('');

  const handleGroupCreation = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        'http://localhost:8081/create-group',
        { id, displayName },
        { withCredentials: true }
      );
      setMessage("Group created successfully");
      onClose(); // close the form
    } catch (error) {
      setMessage("Error creating group: " + error.response?.data || error.message);
    }
  };

  return (
  <div className="group-form-container">
    <h3>Create New Group</h3>
    <form onSubmit={handleGroupCreation}>
      <div>
        <label>Group ID: </label>
        <input value={id} onChange={(e) => setId(e.target.value)} required />
      </div>
      <div>
        <label>Display Name: </label>
        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
      </div>
      <button className="add-btn" type="submit">Create Group</button>
      <button type="button" onClick={onClose}>Cancel</button>
    </form>
    {message && <p>{message}</p>}
  </div>
);

}

export default GroupForm;


