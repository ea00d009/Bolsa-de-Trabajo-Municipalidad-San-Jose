package com.sanjose.bolsatrabajo;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sanjose.bolsatrabajo.dto.AuthResponse;
import com.sanjose.bolsatrabajo.dto.LoginRequest;
import com.sanjose.bolsatrabajo.entity.User;
import com.sanjose.bolsatrabajo.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String generatedUsername;

    @AfterEach
    void tearDown() {
        if (generatedUsername != null) {
            Optional<User> userOpt = userRepository.findByUsername(generatedUsername);
            userOpt.ifPresent(user -> userRepository.delete(user));
        }
    }

    @Test
    void login_IntegrationFlow_Success() throws Exception {
        // Arrange
        generatedUsername = "integration_test_" + System.currentTimeMillis();
        User user = new User();
        user.setUsername(generatedUsername);
        user.setPassword(passwordEncoder.encode("securePassword123"));
        user.setNombreCompleto("Integration Test User");
        user.setRole("Entrevistador");
        user.setActivo(true);
        userRepository.save(user);

        // Act & Assert: Login with the created user
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setUsername(generatedUsername);
        loginRequest.setPassword("securePassword123");

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(generatedUsername))
                .andExpect(jsonPath("$.role").value("Entrevistador"))
                .andExpect(jsonPath("$.nombreCompleto").value("Integration Test User"))
                .andReturn();

        jakarta.servlet.http.Cookie cookie = loginResult.getResponse().getCookie("token");
        assertNotNull(cookie);
        assertNotNull(cookie.getValue());
        assertTrue(cookie.isHttpOnly());
    }
}
