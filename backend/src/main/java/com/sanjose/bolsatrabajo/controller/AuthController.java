package com.sanjose.bolsatrabajo.controller;

import com.sanjose.bolsatrabajo.dto.LoginRequest;
import com.sanjose.bolsatrabajo.entity.User;
import com.sanjose.bolsatrabajo.provider.JwtProvider;
import com.sanjose.bolsatrabajo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtProvider jwtProvider;

    @Autowired
    private UserRepository userRepository;

    // SEC-13: Rate limiting — registro de intentos fallidos por IP
    private final ConcurrentHashMap<String, long[]> loginAttempts = new ConcurrentHashMap<>();
    private static final int MAX_ATTEMPTS = 5;
    private static final long BLOCK_DURATION_MS = 15 * 60 * 1000L; // 15 minutos

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, jakarta.servlet.http.HttpServletRequest httpRequest, jakarta.servlet.http.HttpServletResponse response) {
        // SEC-13: Verificar rate limiting por IP
        String clientIp = getClientIp(httpRequest);
        if (isBlocked(clientIp)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "DEMASIADOS_INTENTOS", "message", "Demasiados intentos fallidos. Intente nuevamente en 15 minutos."));
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(), request.getPassword())
            );
            User user = userRepository.findByUsername(request.getUsername())
                    .orElseThrow(() -> new BadCredentialsException("Usuario no encontrado"));
            if (!user.getUsername().equals(request.getUsername())) {
                throw new BadCredentialsException("Usuario no encontrado");
            }
            String token = jwtProvider.generateToken(user);

            // SEC-13: Limpiar intentos fallidos en login exitoso
            loginAttempts.remove(clientIp);
            
            // SEC-10/SEC-11: Cookie segura con SameSite=Lax (activa flag Secure automáticamente en HTTPS)
            boolean isSecure = "https".equalsIgnoreCase(httpRequest.getHeader("X-Forwarded-Proto")) || httpRequest.isSecure();
            ResponseCookie cookie = ResponseCookie.from("token", token)
                    .httpOnly(true)
                    .secure(isSecure)
                    .sameSite("Lax")
                    .path("/")
                    .maxAge(86400) // 1 día
                    .build();
            response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

            // SEC-17: No devolver token en el body — solo datos de perfil
            Map<String, Object> responseBody = Map.of(
                "username", user.getUsername(),
                "role", user.getRole(),
                "nombreCompleto", user.getNombreCompleto()
            );
            return ResponseEntity.ok(responseBody);
        } catch (BadCredentialsException e) {
            // SEC-13: Registrar intento fallido
            recordFailedAttempt(clientIp);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Credenciales incorrectas");
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe() {
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth.getPrincipal() instanceof String) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("No autenticado");
        }
        org.springframework.security.core.userdetails.UserDetails userDetails = (org.springframework.security.core.userdetails.UserDetails) auth.getPrincipal();
        User user = userRepository.findByUsername(userDetails.getUsername()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuario no encontrado");
        }
        user.setPassword(null);
        return ResponseEntity.ok(user);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(jakarta.servlet.http.HttpServletRequest httpRequest, jakarta.servlet.http.HttpServletResponse response) {
        // SEC-10/SEC-11: Cookie de logout con SameSite=Lax
        boolean isSecure = "https".equalsIgnoreCase(httpRequest.getHeader("X-Forwarded-Proto")) || httpRequest.isSecure();
        ResponseCookie cookie = ResponseCookie.from("token", "")
                .httpOnly(true)
                .secure(isSecure)
                .sameSite("Lax")
                .path("/")
                .maxAge(0)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        return ResponseEntity.ok(Map.of("message", "Sesión cerrada con éxito"));
    }

    // SEC-13: Helpers de rate limiting
    private boolean isBlocked(String ip) {
        long[] record = loginAttempts.get(ip);
        if (record == null) return false;
        int attempts = (int) record[0];
        long firstAttemptTime = record[1];
        if (attempts >= MAX_ATTEMPTS) {
            if (System.currentTimeMillis() - firstAttemptTime < BLOCK_DURATION_MS) {
                return true;
            } else {
                loginAttempts.remove(ip);
                return false;
            }
        }
        return false;
    }

    private void recordFailedAttempt(String ip) {
        loginAttempts.compute(ip, (key, record) -> {
            if (record == null) {
                return new long[]{1, System.currentTimeMillis()};
            }
            if (System.currentTimeMillis() - record[1] > BLOCK_DURATION_MS) {
                return new long[]{1, System.currentTimeMillis()};
            }
            record[0]++;
            return record;
        });
    }

    private String getClientIp(jakarta.servlet.http.HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}