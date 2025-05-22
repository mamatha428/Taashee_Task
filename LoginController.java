package com.taashee.alfreso_backend.controller;

import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.http.HttpSession;

@RestController
public class LoginController {
	private final WebClient webClient = WebClient.create();

	@PostMapping("/login")
	public ResponseEntity<String> login(@RequestBody Map<String, String> credentials, HttpSession session) {
		String username = credentials.get("username");
		String password = credentials.get("password");

		String response = webClient.post().uri("http://localhost:8080/alfresco/s/api/login")
				.header(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
				.bodyValue(Map.of("username", username, "password", password)).retrieve().bodyToMono(String.class)
				.block();

		try {
			ObjectMapper mapper = new ObjectMapper();
			JsonNode json = mapper.readTree(response);
			String ticket = json.path("data").path("ticket").asText();

			session.setAttribute("ticket", ticket); // store ticket in session
			session.setAttribute("username", username);


			return ResponseEntity.ok("Logged in with ticket: " + ticket);
		} catch (Exception e) {
			return ResponseEntity.status(500).body("Login failed");
		}
	}
}
