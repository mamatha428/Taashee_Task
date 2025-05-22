package com.taashee.alfreso_backend.model;

public class AlfrescoDocument {
	  private String id;
	    private String name;
	    private String nodeType;
	    private String mimeType;

	    public String getId() { return id; }
	    public void setId(String id) { this.id = id; }

	    public String getName() { return name; }
	    public void setName(String name) { this.name = name; }

	    public String getNodeType() { return nodeType; }
	    public void setNodeType(String nodeType) { this.nodeType = nodeType; }

	    public String getMimeType() { return mimeType; }
	    public void setMimeType(String mimeType) { this.mimeType = mimeType; }
	
}
