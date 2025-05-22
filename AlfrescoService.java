
package com.taashee.alfreso_backend.service;

import java.io.IOException;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taashee.alfreso_backend.model.AlfrescoDocument;

@Service
public class AlfrescoService {

	  private final WebClient webClient;

	    public AlfrescoService(WebClient webClient) {
	        this.webClient = webClient;
	    }

    public List<AlfrescoDocument> getAllDocuments(String ticket, String username) {
        String homeFolderId = getUserHomeFolderId(username, ticket);
        if (homeFolderId == null || homeFolderId.isEmpty()) {
            return Collections.emptyList();
        }

        String url = "/nodes/" + homeFolderId + "/children?alf_ticket=" + ticket;

        String response = webClient.get()
            .uri("http://localhost:8080/alfresco/api/-default-/public/alfresco/versions/1" + url)
            .retrieve()
            .bodyToMono(String.class)
            .block();

        System.out.println("Requesting children of home folder: " + url);
        System.out.println("Response: " + response);


        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            var jsonNode = mapper.readTree(response);

            if (jsonNode == null) {
                System.out.println("jsonNode is null");
                return java.util.Collections.emptyList();
            }

            var listNode = jsonNode.get("list");
            if (listNode == null) {
                System.out.println("'list' node is missing in response");
                return java.util.Collections.emptyList();
            }

            var entries = listNode.get("entries");
            if (entries == null) {
                System.out.println("'entries' node is missing in response");
                return java.util.Collections.emptyList();
            }

            return java.util.stream.StreamSupport.stream(entries.spliterator(), false)
                    .map(node -> node.get("entry"))
                  //  .filter(entry -> entry != null && "cm:content".equals(entry.get("nodeType").asText(""))) // filter documents only
                    .map(entry -> {
                        AlfrescoDocument doc = new AlfrescoDocument();
                        doc.setId(entry.get("id").asText(""));
                        doc.setName(entry.get("name").asText(""));
                        doc.setNodeType(entry.get("nodeType").asText(""));
                        // 'content' node may be null, check before accessing 'mimeType'
                        var contentNode = entry.get("content");
                        doc.setMimeType(contentNode != null ? contentNode.get("mimeType").asText("") : "");
                        return doc;
                    })
                    .collect(Collectors.toList());

        } catch (Exception e) {
            e.printStackTrace();
            return java.util.Collections.emptyList();
        }
    }
    
    public String getUserHomeFolderId(String username, String ticket) {
        String url = "http://localhost:8080/alfresco/service/api/people/" + username + "?alf_ticket=" + ticket;

        String response = webClient.get()
            .uri(url)
            .retrieve()
            .bodyToMono(String.class)
            .block();

        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode json = mapper.readTree(response);
            String homeFolderId = "ac1dbf44-90a8-42b1-86a4-20a81f820e0c";
            //json.path("homeFolderId").asText(); // assign to variable
            System.out.println("HomeFolderId for user " + username + ": " + homeFolderId); // now log it
            return homeFolderId;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
        
    }

    public String getUserFolderId(String username, String ticket) {
    	 if ("admin".equalsIgnoreCase(username)) {
    	        // Return -root- node ID directly
    	        return "-root-";
    	    }
        // This is the root folder under which all user folders exist
        String parentFolderId = "ac1dbf44-90a8-42b1-86a4-20a81f820e0c";
        String url = "http://localhost:8080/alfresco/api/-default-/public/alfresco/versions/1/nodes/"
                    + parentFolderId + "/children?alf_ticket=" + ticket;

        String response = webClient.get()
            .uri(url)
            .retrieve()
            .bodyToMono(String.class)
            .block();

        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(response);
            JsonNode entries = root.path("list").path("entries");

            for (JsonNode entryNode : entries) {
                JsonNode entry = entryNode.path("entry");
                String folderName = entry.path("name").asText();
                String nodeId = entry.path("id").asText();

                if (folderName.equals(username)) {
                    System.out.println("Found home folder for " + username + ": " + nodeId);
                    return nodeId;
                }
            }

            System.err.println("User folder not found for " + username);
            return null;

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }
    public String getUserDocumentsJson(String userFolderId, String ticket) {
        String childrenUrl = "http://localhost:8080/alfresco/api/-default-/public/alfresco/versions/1/nodes/"
                + userFolderId + "/children?alf_ticket=" + ticket;

        return webClient.get()
                .uri(childrenUrl)
                .retrieve()
                .bodyToMono(String.class)
                .block();
    }

	public String getAllUsers(String ticket) {
		String url="http://localhost:8080/alfresco/api/-default-/public/alfresco/versions/1/people?alf_ticket="+ticket;
		return webClient.get()
				.uri(url)
				.retrieve()
				.bodyToMono(String.class)
				.block();
	}

	public String uploadFileToAlfresco(MultipartFile file, String parentFolderId, String ticket) throws IOException {
		byte[] fileBytes = file.getBytes();
	    String fileName = file.getOriginalFilename();

	    MultipartBodyBuilder builder = new MultipartBodyBuilder();
	    builder.part("filedata", new ByteArrayResource(fileBytes) {
	        @Override
	        public String getFilename() {
	            return fileName;
	        }
	    }).header("Content-Type", file.getContentType());

	    builder.part("name", fileName);
	    builder.part("nodeType", "cm:content");
	    builder.part("relativePath", "/"); // optional
	    builder.part("overwrite", "true"); // optional
	    builder.part("majorVersion", "false");

	    String uploadUrl = "http://localhost:8080/alfresco/api/-default-/public/alfresco/versions/1/nodes/"
	            + parentFolderId + "/children?alf_ticket=" + ticket;

	    return webClient.post()
	            .uri(uploadUrl)
	            .contentType(MediaType.MULTIPART_FORM_DATA)
	            .bodyValue(builder.build())
	            .retrieve()
	            .bodyToMono(String.class)
	            .block();
	}
	public String getFoldersUnderRoot(String ticket) {
	    String url = "http://localhost:8080/alfresco/api/-default-/public/alfresco/versions/1/nodes/-root-/children?alf_ticket=" + ticket;
	    return webClient.get()
	            .uri(url)
	            .retrieve()
	            .bodyToMono(String.class)
	            .block();
	}

}