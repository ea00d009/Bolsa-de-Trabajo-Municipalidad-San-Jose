package com.sanjose.bolsatrabajo.provider;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component
public class JwtProvider {

    @org.springframework.beans.factory.annotation.Value("${app.security.jwt.secret:}")
    private String secretKey;
    private final String fallbackRuntimeSecret = java.util.UUID.randomUUID().toString() + java.util.UUID.randomUUID().toString();
    private final long EXPIRATION_MS = 86400000L;

    public String generateToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_MS))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateToken(com.sanjose.bolsatrabajo.entity.User user) {
        String cleanRole = user.getRole() != null ? user.getRole().replace("ROLE_", "") : null;
        return Jwts.builder()
                .setSubject(user.getUsername())
                .claim("role", cleanRole)
                .claim("nombreCompleto", user.getNombreCompleto())
                .claim("userId", user.getId())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRATION_MS))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String getUsernameFromToken(String token) {
        return getClaims(token).getSubject();
    }

    public boolean validateToken(String token) {
        try {
            getClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims getClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSigningKey() {
        String effectiveSecret = (secretKey != null && secretKey.trim().length() >= 32)
                ? secretKey.trim()
                : fallbackRuntimeSecret;
        byte[] keyBytes = effectiveSecret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}