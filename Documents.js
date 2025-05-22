import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/Documents.css'; // Ensure your CSS path is correct

function Documents() {
  const [documents, setDocuments] = useState([]);
  const [username, setUsername] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

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

      <ul className="documents-list">
        {documents.map(doc => (
          <li key={doc.id} className="document-item">
            <div className="doc-name">{doc.name}</div>
            <div className="doc-type">{doc.nodeType}</div>
            <div className="doc-mime">{doc.content?.mimeType || 'N/A'}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Documents;
