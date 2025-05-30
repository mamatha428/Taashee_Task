import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {handleLogout} from "./Logout";
import { useNavigate } from 'react-router-dom';
import '../styles/Documents.css';

function Documents() {
  const [documents, setDocuments] = useState([]);
  const [username, setUsername] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
const navigate = useNavigate();

  // Fetch username and documents on component mount
  useEffect(() => {
    // Fetch logged-in username
    axios.get('http://localhost:8081/me', { withCredentials: true })
      .then(res => {
        setUsername(res.data);
      })
      .catch(err => {
        console.error("Failed to get username", err);
      });

    // Fetch user documents
    fetchDocuments();
  }, []);

  // Get documents from backend
  const fetchDocuments = () => {
    axios.get('http://localhost:8081/documents', { withCredentials: true })
      .then((res) => {
        const json = res.data;
        setDocuments(json.list.entries.map(e => e.entry));
      })
      .catch((err) => {
        alert("Unauthorized or Error fetching documents");
        console.error(err);
      });
  };

  // Handle file input change
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // Upload file
  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      await axios.post('http://localhost:8081/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });

      alert("File uploaded successfully!");
      fetchDocuments(); // Refresh document list
    } catch (error) {
      console.error("Upload failed", error);
      alert("Upload failed: " + (error.response?.data || error.message));
    }
  };

  return (
    <div className="documents-container">
      <div className="documents-header">
        <h2>{username ? `${username}'s Documents` : 'Your Documents'}</h2>
        <div style={{display:'flex',justifyContent:'flex-end',padding:'5px'}}>
                 <button onClick={() => handleLogout(navigate)}>Logout</button>
        </div>
      <div className="upload-section">
  <label htmlFor="file-upload" className="file-label">
    Choose File
  </label>
  <input
    id="file-upload"
    type="file"
    onChange={handleFileChange}
    className="hidden-file-input"
  />
  {selectedFile && <span className="file-name">{selectedFile.name}</span>}
  <button onClick={handleUpload}>Upload</button>
</div>

      </div>

      <table className="documents-table">
  <thead>
    <tr>
      <th>Name</th>
      <th>Type</th>
      <th>MIME Type</th>
      <th>Action</th>
    </tr>
  </thead>
  <tbody>
    {documents.map(doc => (
      <tr key={doc.id}>
        <td>{doc.name}</td>
        <td>{doc.nodeType}</td>
        <td>{doc.content?.mimeType || 'N/A'}</td>
        <td>
          <a
            href={`http://localhost:8081/download?nodeId=${doc.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="download-link"
          >
            Download
          </a>
        </td>
      </tr>
    ))}
  </tbody>
</table>

    </div>
  );
}

export default Documents;
