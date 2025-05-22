import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const [folders, setFolders] = useState([]);
  const [uploading, setUploading] = useState({}); // track uploading state

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      //const response = await axios.get('/admin-documents');
      const response = await axios.get('http://localhost:8081/admin-documents', {
  withCredentials: true,
});

      const entries = response.data?.list?.entries || [];
      const folderList = entries
        .filter(entry => entry.entry.isFolder)
        .map(entry => ({
          name: entry.entry.name,
          id: entry.entry.id
        }));
      setFolders(folderList);
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    }
  };

  const handleUpload = async (folderId) => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '*/*';
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('folderId', folderId);

      setUploading(prev => ({ ...prev, [folderId]: true }));

      try {
       const response = await axios.post('http://localhost:8081/admin-upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
  withCredentials: true, // ✅ include session cookies (JSESSIONID)
});

        alert(`Uploaded to ${folderId} successfully`);
      } catch (err) {
        alert('Upload failed');
        console.error(err);
      } finally {
        setUploading(prev => ({ ...prev, [folderId]: false }));
      }
    };

    // Trigger the file picker
    fileInput.click();
  };

  return (
    <div className="admin-container">
  {folders.map(folder => (
    <div key={folder.id} className="folder-card">
      <h2 className="folder-title">{folder.name}</h2>
      <button
        onClick={() => handleUpload(folder.id)}
        disabled={uploading[folder.id]}
        className="upload-button"
      >
        {uploading[folder.id] ? 'Uploading...' : 'Upload'}
      </button>
    </div>
  ))}
</div>
  );
};

export default AdminDashboard;
