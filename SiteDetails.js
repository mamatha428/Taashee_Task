// src/components/SiteDetail.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const SiteDetails = () => {
  const { siteId } = useParams();
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems();
  },[]);

  const fetchItems= async ()=>{
    const res=await axios.get(`http://localhost:8081/sites/${siteId}/documentLibrary`,{withCredentials:true});
    const itemList=res.data?.list?.entries?.map(entry=>entry.entry)||[];
    setItems(itemList);
  };
  return (
    <div>
      <h2>Site: {siteId}</h2>
      <ul>
        {items.map(item => (
          <li
            key={item.id}
            style={{ cursor: 'pointer', marginBottom: '6px' }}
            onClick={() => {
              if (item.isFolder) {
                navigate(`/folders/${item.id}`);
              }
            }}
          >
            📁 {item.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SiteDetails;
