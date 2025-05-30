import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/GroupManagement.css';
import { FaSearch } from 'react-icons/fa';

const GroupManagement = () => {
  const [groups, setGroups] = useState([]);
  const [userInputs, setUserInputs] = useState({});
  const [showInputs, setShowInputs] = useState({});
  const [message, setMessage] = useState('');
  const [searchTerm,setSearchTerm]=useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await axios.get('http://localhost:8081/group', { withCredentials: true });
      const groupList = res.data?.list?.entries?.map(entry => entry.entry) || [];
      setGroups(groupList);
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    }
  };

  const handleInputChange = (groupId, value) => {
    setUserInputs(prev => ({ ...prev, [groupId]: value }));
  };

  const handleAddUser = async (groupId) => {
    const userName = userInputs[groupId]?.trim();
    if (!userName) {
      setMessage('⚠️ Username cannot be empty.');
      return;
    }

    try {
      await axios.post('http://localhost:8081/add-user-to-group', {
        id: groupId,
        userName
      }, { withCredentials: true });

      setMessage(`✅ User "${userName}" added to group "${groupId}"`);
      setUserInputs(prev => ({ ...prev, [groupId]: '' }));
      setShowInputs(prev => ({ ...prev, [groupId]: false }));
    } catch (err) {
      console.error(err);
      setMessage(`❌ Error adding user: ${err.response?.data || err.message}`);
    }
  };

  const toggleInput = (groupId) => {
    setShowInputs(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };
const capitalizeWords = (str) => {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const filteredGroups=groups.filter(group => group.displayName.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="group-container">
      <div className="search-container">
        <input
           type="text"
           className="search-input"
           placeholder="Search Groups"
           value={searchTerm}
           onChange={(e)=>setSearchTerm(e.target.value)}
        />
        <FaSearch className="search-icon"/>
      </div>
      <h3>Manage Group Members</h3>
      {filteredGroups.length === 0 ? <p>No matching groups found.</p> : (
        filteredGroups.map(group => (
          <div key={group.id} className="group-card">
            <div className="group-header">
             <strong>{capitalizeWords(group.displayName)}</strong>
              <button className="manage-btn" onClick={() => toggleInput(group.id)}>
                {showInputs[group.id] ? 'Cancel' : 'Manage Users'}
              </button>
            </div>

            {showInputs[group.id] && (
              <div className="input-row">
                <input
                  type="text"
                  placeholder="Enter username"
                  value={userInputs[group.id] || ''}
                  onChange={(e) => handleInputChange(group.id, e.target.value)}
                />
                <button onClick={() => handleAddUser(group.id)}>Add</button>
              </div>
            )}
          </div>
        ))
      )}
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default GroupManagement;
