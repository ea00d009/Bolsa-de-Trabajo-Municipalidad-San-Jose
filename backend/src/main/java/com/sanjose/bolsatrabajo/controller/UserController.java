package com.sanjose.bolsatrabajo.controller;

import com.sanjose.bolsatrabajo.entity.User;
import com.sanjose.bolsatrabajo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@RestController
@RequestMapping("/api/users")
public class UserController {

    // SEC-15: Lista blanca de roles válidos del sistema
    private static final Set<String> VALID_ROLES = Set.of(
            "ROLE_SuperAdmin", "ROLE_Entrevistador", "ROLE_Administrativo",
            "SuperAdmin", "Entrevistador", "Administrativo"
    );

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // SEC-14: Validación de complejidad de contraseñas
    private String validatePasswordComplexity(String password) {
        if (password.length() < 8) {
            return "La contraseña debe tener al menos 8 caracteres.";
        }
        if (!password.matches(".*[A-Z].*")) {
            return "La contraseña debe contener al menos una letra mayúscula.";
        }
        if (!password.matches(".*[0-9].*")) {
            return "La contraseña debe contener al menos un número.";
        }
        if (!password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*")) {
            return "La contraseña debe contener al menos un carácter especial.";
        }
        return null; // válida
    }

    @GetMapping
    public ResponseEntity<?> listUsers() {
        List<User> users = userRepository.findByDeletedAtIsNull();
        // Ocultar contraseñas hash en la respuesta
        users.forEach(u -> u.setPassword(null));
        return ResponseEntity.ok(users);
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody User newUser) {
        if (newUser.getUsername() == null || newUser.getUsername().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("El nombre de usuario es obligatorio.");
        }
        if (newUser.getPassword() == null || newUser.getPassword().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("La contraseña es obligatoria.");
        }
        // SEC-14: Validar complejidad de contraseña
        String passwordError = validatePasswordComplexity(newUser.getPassword().trim());
        if (passwordError != null) {
            return ResponseEntity.badRequest().body(passwordError);
        }
        if (userRepository.findByUsername(newUser.getUsername().trim()).isPresent()) {
            return ResponseEntity.badRequest().body("El nombre de usuario ya existe.");
        }

        // SEC-15: Validar rol contra lista blanca
        String role = newUser.getRole() != null && !newUser.getRole().trim().isEmpty() ? newUser.getRole().trim() : "Entrevistador";
        if (!VALID_ROLES.contains(role)) {
            return ResponseEntity.badRequest().body("Rol inválido. Los roles permitidos son: SuperAdmin, Entrevistador, Administrativo.");
        }

        User user = new User();
        user.setUsername(newUser.getUsername().trim());
        user.setPassword(passwordEncoder.encode(newUser.getPassword().trim()));
        user.setRole(role);
        user.setNombreCompleto(newUser.getNombreCompleto() != null ? newUser.getNombreCompleto().trim() : "Entrevistador");
        user.setActivo(true);

        User saved = userRepository.save(user);
        saved.setPassword(null);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}/password")
    public ResponseEntity<?> changePassword(@PathVariable Integer id, @RequestBody Map<String, String> request) {
        String newPassword = request.get("password");
        if (newPassword == null || newPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("La nueva contraseña no puede estar vacía.");
        }
        // SEC-14: Validar complejidad de contraseña
        String passwordError = validatePasswordComplexity(newPassword.trim());
        if (passwordError != null) {
            return ResponseEntity.badRequest().body(passwordError);
        }

        Optional<User> optUser = userRepository.findById(id);
        if (optUser.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = optUser.get();
        user.setPassword(passwordEncoder.encode(newPassword.trim()));
        userRepository.save(user);

        return ResponseEntity.ok().body(Map.of("message", "Contraseña actualizada con éxito."));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> toggleStatus(@PathVariable Integer id, @RequestBody Map<String, Boolean> request) {
        Boolean active = request.get("activo");
        if (active == null) {
            return ResponseEntity.badRequest().body("El estado activo es obligatorio.");
        }

        Optional<User> optUser = userRepository.findById(id);
        if (optUser.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = optUser.get();
        if (user.getUsername().equals("superadmin")) {
            return ResponseEntity.badRequest().body("No se puede desactivar la cuenta principal del superadmin.");
        }

        user.setActivo(active);
        userRepository.save(user);

        return ResponseEntity.ok().body(Map.of("message", "Estado de cuenta actualizado con éxito."));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Integer id) {
        Optional<User> optUser = userRepository.findById(id);
        if (optUser.isEmpty() || optUser.get().getDeletedAt() != null) {
            return ResponseEntity.notFound().build();
        }

        User user = optUser.get();
        if (user.getUsername().equals("superadmin")) {
            return ResponseEntity.badRequest().body("No se puede eliminar la cuenta principal del superadmin.");
        }

        user.setDeletedAt(java.time.LocalDateTime.now());
        user.setActivo(false);
        userRepository.save(user);

        return ResponseEntity.ok().body(Map.of("message", "Usuario eliminado con éxito."));
    }
}
