import React,{useEffect,useState} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from 'axios';


const Sites = () =>{
    const[sites,setSites]=useState([]);
    const navigate=useNavigate();
    useEffect(()=>{
        fetchSites();
    },[]);

  const fetchSites = async ()=>{
    try{
        const res=await axios.get('http://localhost:8081/sites',{withCredentials:true});
       const siteList=res.data?.list?.entries?.map(entry=>entry.entry)||[];
       setSites(siteList);
    }
    catch(err){
        console.error("Failed to fetch sites :",err);
    }
  };
    return(
        <div>
            <h2>Available Sites</h2>
            <ul>
                {sites.map(site =>(
                    <li key={site.id} style={{cursor:"pointer" , marginBottom:"8px"}} onClick={()=> navigate(`/sites/${site.id}`)}>
                        {site.title}({site.id})
                    </li>
                ))

                }
            </ul>
        </div>
    );
};

export default Sites;