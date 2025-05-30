import React, { useState } from 'react';
import '../styles/UpdateUserForm.css'; // create this new CSS file

const UpdateUserForm = ({ user, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    onUpdate(user.id, formData);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Update User</h2>
        <input name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First Name" />
        <input name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last Name" />
        <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" />
        <div className="modal-buttons">
          <button className="update-btn" onClick={handleSubmit}>Update</button>
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export default UpdateUserForm;
