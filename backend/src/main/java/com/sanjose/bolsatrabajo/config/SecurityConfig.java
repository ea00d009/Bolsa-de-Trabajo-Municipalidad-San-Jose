package com.sanjose.bolsatrabajo.config;

import com.sanjose.bolsatrabajo.filter.JwtFilter;
import com.sanjose.bolsatrabajo.service.UserDetailsServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtFilter jwtFilter;

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @org.springframework.beans.factory.annotation.Value("${app.security.cors.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                
                // Estadísticas y Gestión de usuarios
                .requestMatchers("/api/stats").hasRole("SuperAdmin")
                .requestMatchers("/api/users/**").hasRole("SuperAdmin")
                
                // Catálogos: Lectura permitida a SuperAdmin/Entrevistador. Escritura restringida a SuperAdmin.
                .requestMatchers(HttpMethod.GET, "/api/barrios/**").hasAnyRole("SuperAdmin", "Entrevistador")
                .requestMatchers("/api/barrios/**").hasRole("SuperAdmin")
                
                .requestMatchers(HttpMethod.GET, "/api/rubros/**").hasAnyRole("SuperAdmin", "Entrevistador")
                .requestMatchers("/api/rubros/**").hasRole("SuperAdmin")

                .requestMatchers(HttpMethod.GET, "/api/catalogos-config/**").hasAnyRole("SuperAdmin", "Entrevistador")
                .requestMatchers("/api/catalogos-config/**").hasRole("SuperAdmin")
                
                // Postulantes (Ciudadanos) y Entrevistas: Lectura/Escritura a SuperAdmin/Entrevistador. Borrado a SuperAdmin.
                .requestMatchers(HttpMethod.DELETE, "/api/ciudadanos/**").hasRole("SuperAdmin")
                .requestMatchers("/api/ciudadanos/**").hasAnyRole("SuperAdmin", "Entrevistador")
                .requestMatchers("/api/entrevistas/**").hasAnyRole("SuperAdmin", "Entrevistador")
                
                // Empresas: Alta/edición/lectura a SuperAdmin/Entrevistador. Baja (lógica) a SuperAdmin.
                .requestMatchers(HttpMethod.DELETE, "/api/empresas/**").hasRole("SuperAdmin")
                .requestMatchers("/api/empresas/**").hasAnyRole("SuperAdmin", "Entrevistador")
                
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        java.util.List<String> patterns = new java.util.ArrayList<>(Arrays.asList(
            "http://localhost:*",
            "http://127.0.0.1:*",
            "http://192.168.*:*",
            "http://10.*:*",
            "http://172.*:*",
            "http://*.local:*",
            "http://sistema:*",
            "http://SISTEMA:*",
            "http://DESKTOP-OB5FKHB:*",
            "http://desktop-ob5fkhb:*",
            "http://*:5173"
        ));
        for (String origin : allowedOrigins.split(",")) {
            String trimmed = origin.trim();
            if (!trimmed.isEmpty() && !patterns.contains(trimmed)) {
                patterns.add(trimmed);
            }
        }
        configuration.setAllowedOriginPatterns(patterns);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Cache-Control", "Cookie"));
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Set-Cookie"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }
}