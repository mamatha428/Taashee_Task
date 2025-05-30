import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { handleLogout } from './Logout';
import GroupForm from './GroupForm';
import GroupManagement from './GroupManagement';
import UserManagement from './UserManagement';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
  const [folders, setFolders] = useState([]);
  const [uploading, setUploading] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [activeSection, setActiveSection] = useState('folders');
  const [folderName, setFolderName] = useState('');
  const [folderContents, setFolderContents] = useState([]);
  const [selectedFolderDetails, setSelectedFolderDetails] = useState(null);
  const [showCreateFolderForm, setShowCreateFolderForm] = useState(false);
  const [siteShowForm,setSiteShowForm]=useState(false);
  const [sites, setSites] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [siteContents, setSiteContents] = useState([]);
const [siteId, setSiteId] = useState('');
const [siteTitle, setSiteTitle] = useState('');
const [siteVisibility, setSiteVisibility] = useState('PRIVATE');


  const navigate = useNavigate();

  useEffect(() => {
    fetchFolders();
  }, []);

  useEffect(() => {
    if (activeSection === 'sites') {
      fetchSites();
    }
  }, [activeSection]);

  const fetchFolders = async () => {
    try {
      const response = await axios.get('http://localhost:8081/admin-documents', { withCredentials: true });
      const entries = response.data?.list?.entries || [];
      const folderList = entries
        .filter(entry => entry.entry.isFolder)
        .map(entry => ({ name: entry.entry.name, id: entry.entry.id }));
      setFolders(folderList);
    } catch (error) {
      console.error('Failed to fetch folders:', error);
    }
  };

  const fetchSites = async () => {
    try {
      const res = await axios.get('http://localhost:8081/sites', { withCredentials: true });
      const siteList = res.data?.list?.entries?.map(entry => entry.entry) || [];
      setSites(siteList);
    } catch (err) {
      console.error("Failed to fetch sites:", err);
    }
  };

  const handleSiteClick = async (siteId) => {
    setSelectedSiteId(siteId);
    try {
      const res = await axios.get(`http://localhost:8081/sites/${siteId}/documentLibrary`, {
        withCredentials: true,
      });
      const itemList = res.data?.list?.entries?.map(entry => entry.entry) || [];
      setSiteContents(itemList);
    } catch (error) {
      console.error("Failed to fetch site contents:", error);
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
        await axios.post('http://localhost:8081/admin-upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          withCredentials: true,
        });
        const folder = folders.find(f => f.id === folderId);
        alert(`Uploaded to ${folder?.name || folderId} successfully`);
      } catch (err) {
        alert('Upload failed');
        console.error(err);
      } finally {
        setUploading(prev => ({ ...prev, [folderId]: false }));
      }
    };
    fileInput.click();
  };

  const handleCreateFolderSubmit = async () => {
    if (!folderName.trim()) {
      alert("Folder name cannot be empty");
      return;
    }
    try {
      const response = await axios.post(
        'http://localhost:8081/create-folder',
        { folderName },
        { withCredentials: true }
      );
      if (response.status === 200) {
        alert('Folder created successfully');
        setFolderName('');
        fetchFolders();
      } else {
        alert('Failed to create folder: ' + response.data);
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      alert('An error occurred while creating the folder');
    }
  };

  const handleFolderClick = async (folder) => {
    setSelectedFolderDetails(folder);
    try {
      const response = await axios.get(`http://localhost:8081/folders/${folder.id}`, { withCredentials: true });
      const entries = response.data?.list?.entries || [];
      setFolderContents(entries);
    } catch (error) {
      console.error('Failed to fetch folder contents:', error);
    }
  };

  const handleCreateSite = async () => {
  if (!siteId.trim() || !siteTitle.trim()) {
    alert('Site ID and Title cannot be empty.');
    return;
  }

  try {
    const response = await axios.post(
      'http://localhost:8081/sites',
      {
        id: siteId,
        title: siteTitle,
        visibility: siteVisibility
      },
      { withCredentials: true }
    );

    if (response.status === 200) {
      alert('Site created successfully!');
      setSiteShowForm(false);
      setSiteId('');
      setSiteTitle('');
      setSiteVisibility('PRIVATE');
      fetchSites(); // Refresh the list after creation
    } else {
      alert('Failed to create site.');
    }
  } catch (error) {
    console.error('Error creating site:', error);
    alert('An error occurred while creating the site.');
  }
};


  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h2>Admin Panel</h2>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <button onClick={() => setActiveSection('folders')}>Folders</button>
          <button onClick={() => setActiveSection('groups')}>Groups</button>
          <button onClick={() => setActiveSection('users')}>Users</button>
          <button onClick={() => setActiveSection('sites')}>Sites</button>
          <button onClick={() => handleLogout(navigate)}>Logout</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <h1>Admin Dashboard</h1>
        </header>

        {activeSection === 'folders' && (
          <>
            {!selectedFolderDetails ? (
              <>
                <div className="create-folder-form">
                  {!showCreateFolderForm ? (
                    <button onClick={() => setShowCreateFolderForm(true)}>Create Folder</button>
                  ) : (
                    <>
                      <input
                        type="text"
                        placeholder="Enter folder name"
                        value={folderName}
                        onChange={(e) => setFolderName(e.target.value)}
                      />
                      <button onClick={handleCreateFolderSubmit}>Submit</button>
                      <button onClick={() => setShowCreateFolderForm(false)}>Cancel</button>
                    </>
                  )}
                </div>

                <div className="folders-grid">
                  {folders.map(folder => (
                    <div key={folder.id} className="folder-card">
                      <img
                        src="https://th.bing.com/th/id/OIP.j7ZoENwfqXhLB9nNXGfWwgHaHa?w=199&h=198&c=7&r=0&o=7&cb=iwp2&pid=1.7&rm=3"
                        alt="Folder Icon"
                        className="folder-image"
                        onClick={() => handleFolderClick(folder)}
                      />
                      <h3>{folder.name}</h3>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="folder-contents-section">
                <h3>Contents of: {selectedFolderDetails.name}</h3>
                <button className="upload-button" onClick={() => handleUpload(selectedFolderDetails.id)}>
                  {uploading[selectedFolderDetails.id] ? 'Uploading...' : 'Upload File'}
                </button>
                <button className="cancel-btn" onClick={() => setSelectedFolderDetails(null)}>Back to Folders</button>

                <table className="folder-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {folderContents.map(item => (
                      <tr key={item.entry.id}>
                        <td>{item.entry.name}</td>
                        <td>{item.entry.nodeType === 'cm:folder' ? 'Folder' : 'File'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeSection === 'groups' && (
          <section className="group-section">
            <div className="group-header">
              <h2>Group Management</h2>
              <button className="add-btn" onClick={() => setShowForm(true)}>Create Group</button>
            </div>
            {showForm && <GroupForm onClose={() => setShowForm(false)} />}
            <GroupManagement />
          </section>
        )}

        {activeSection === 'users' && (
          <section className="user-section">
            <UserManagement />
          </section>
        )}

        {activeSection === 'sites' && (
          <>
            {!selectedSiteId ? (
              <div className="sites-list">
                <h2>Available Sites</h2>
                <button className="add-btn" onClick={()=>setSiteShowForm(true)}>Create Site</button>
                 
                  {siteShowForm && (
  <div className="create-site-form">
    <h3>Create New Site</h3>
    <div style={{ marginBottom: '10px' }}>
      <label>Site ID:</label><br />
      <input
        type="text"
        placeholder="Enter site ID"
        value={siteId}
        onChange={(e) => setSiteId(e.target.value)}
      />
    </div>

    <div style={{ marginBottom: '10px' }}>
      <label>Site Title:</label><br />
      <input
        type="text"
        placeholder="Enter site title"
        value={siteTitle}
        onChange={(e) => setSiteTitle(e.target.value)}
      />
    </div>

    <div style={{ marginBottom: '10px' }}>
      <label>Visibility:</label><br />
      <select value={siteVisibility} onChange={(e) => setSiteVisibility(e.target.value)}>
        <option value="PRIVATE">Private</option>
        <option value="MODERATED">Moderated</option>
        <option value="PUBLIC">Public</option>
      </select>
    </div>

    <button onClick={handleCreateSite}>Submit</button>
    <button onClick={() => setSiteShowForm(false)}>Cancel</button>
  </div>
)}

<div className="sites-grid">
  {sites.map(site => (
    <div
      key={site.id}
      className="site-card"
      onClick={() => handleSiteClick(site.id)}
    >
      <img
        src="https://th.bing.com/th/id/OIP.rcUAn8KRQ8iGkJ_MRVZx4gAAAA?pid=ImgDet&w=191&h=129&c=7"
        alt="Site Icon"
        className="site-image"
      />
      <div className="site-info">
        <h3>{site.title}</h3>
        <p>{site.id}</p>
      </div>
    </div>
  ))}
</div>

              </div>
            ) : (
              <div className="site-detail-view">
                <h2>Contents of Site: {selectedSiteId}</h2>
                <button onClick={() => setSelectedSiteId(null)} className="cancel-btn">Back to Sites</button>

                <div className="folders-grid">
                  {siteContents.filter(item => item.isFolder).map(folder => (
                    <div key={folder.id} className="folder-card">
                      <img
                        src="https://th.bing.com/th/id/OIP.j7ZoENwfqXhLB9nNXGfWwgHaHa?w=199&h=198&c=7&r=0&o=7&cb=iwp2&pid=1.7&rm=3"
                        alt="Folder Icon"
                        className="folder-image"
                      />
                      <h3>{folder.name}</h3>
                    </div>
                  ))}
                </div>

                <table className="folder-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {siteContents.filter(item => !item.isFolder).map(file => (
                      <tr key={file.id}>
                        <td>{file.name}</td>
                        <td>File</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;