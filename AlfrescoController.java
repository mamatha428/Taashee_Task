package com.taashee.alfreso_backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.taashee.alfreso_backend.service.AlfrescoService;

import jakarta.servlet.http.HttpSession;

@RestController
public class AlfrescoController {

	@Autowired
	private AlfrescoService alfrescoService;

	@GetMapping("/test")
	public String testEndpoint() {
		return "Test endpoint is working!";
	}

	@GetMapping("/documents")
	public ResponseEntity<?> getUserDocuments(HttpSession session) {
	    String username = (String) session.getAttribute("username");
	    String ticket = (String) session.getAttribute("ticket");

	    if (username == null || ticket == null) {
	        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not logged in");
	    }

	    String userFolderId = alfrescoService.getUserFolderId(username, ticket);

	    if (userFolderId == null) {
	        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User folder not found");
	    }

	    String response = alfrescoService.getUserDocumentsJson(userFolderId, ticket);

	    try {
	        ObjectMapper mapper = new ObjectMapper();
	        JsonNode jsonNode = mapper.readTree(response); // ✅ convert String to JSON
	        return ResponseEntity.ok(jsonNode);            // ✅ return as real JSON
	    } catch (Exception e) {
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error parsing JSON");
	    }
	}
	
	
  
	@GetMapping("/all-users")
	public ResponseEntity<?> getAllUsers(HttpSession session) {
	    String ticket = (String) session.getAttribute("ticket");

	    if (ticket == null) {
	        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not logged in");
	    }

	    return ResponseEntity.ok(alfrescoService.getAllUsers(ticket));
	}
	@GetMapping("/me")
	public ResponseEntity<String> getLoggedInUsername(HttpSession session) {
	    String username = (String) session.getAttribute("username");
	    if (username == null) {
	        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Not logged in");
	    }
	    return ResponseEntity.ok(username);
	}
	@GetMapping("/admin-documents")
	public ResponseEntity<?> getAdminFolders(HttpSession session) {
	    String username = (String) session.getAttribute("username");
	    String ticket = (String) session.getAttribute("ticket");

	    if (username == null || ticket == null) {
	        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not logged in");
	    }

	    if (!username.equals("admin")) {
	        return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access denied. Only admin can access this.");
	    }

	    try {
	        String response = alfrescoService.getFoldersUnderRoot(ticket);
	        ObjectMapper mapper = new ObjectMapper();
	        JsonNode json = mapper.readTree(response);

	        return ResponseEntity.ok(json);
	    } catch (Exception e) {
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to fetch admin folders");
	    }
	}


	@PostMapping("/upload")
	public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file, HttpSession session) {
	    String ticket = (String) session.getAttribute("ticket");
	    String username = (String) session.getAttribute("username");

	    if (ticket == null || username == null) {
	        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not logged in");
	    }

	    String userFolderId = alfrescoService.getUserFolderId(username, ticket);
	    if (userFolderId == null) {
	        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User folder not found");
	    }

	    try {
	        String result = alfrescoService.uploadFileToAlfresco(file, userFolderId, ticket);
	        return ResponseEntity.ok(result);
	    } catch (Exception e) {
	        e.printStackTrace();
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Upload failed: " + e.getMessage());
	    }
	}
	@PostMapping("/admin-upload")
	public ResponseEntity<?> uploadToAnyFolder(
	    @RequestParam("file") MultipartFile file,
	    @RequestParam("folderId") String folderId,
	    HttpSession session
	) {
	    String ticket = (String) session.getAttribute("ticket");
	    String username = (String) session.getAttribute("username");

	    if (ticket == null || username == null || !username.equals("admin")) {
	        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Only admin can upload here.");
	    }

	    try {
	        String result = alfrescoService.uploadFileToAlfresco(file, folderId, ticket);
	        return ResponseEntity.ok(result);
	    } catch (Exception e) {
	        e.printStackTrace();
	        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Upload failed: " + e.getMessage());
	    }
	}


}
