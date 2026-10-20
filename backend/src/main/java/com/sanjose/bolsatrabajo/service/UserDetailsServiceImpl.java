package com.sanjose.bolsatrabajo.service;

import com.sanjose.bolsatrabajo.entity.User;
import com.sanjose.bolsatrabajo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + username));

        // Verificación sensible a mayúsculas y minúsculas
        if (!user.getUsername().equals(username)) {
            throw new UsernameNotFoundException("Usuario no encontrado: " + username);
        }

        // SEC-16: Verificar si el usuario está activo y no eliminado
        if (user.getActivo() == null || !user.getActivo() || user.getDeletedAt() != null) {
            throw new UsernameNotFoundException("Usuario inactivo o eliminado: " + username);
        }

        return org.springframework.security.core.userdetails.User
                .withUsername(user.getUsername())
                .password(user.getPassword())
                .roles(user.getRole().replace("ROLE_", ""))
                .build();
    }
}