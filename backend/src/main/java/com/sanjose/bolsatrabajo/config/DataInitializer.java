package com.sanjose.bolsatrabajo.config;

import com.sanjose.bolsatrabajo.entity.User;
import com.sanjose.bolsatrabajo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${app.security.superadmin.password:}")
    private String envSuperAdminPassword;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.findByUsername("superadmin").isEmpty()) {
            String password = envSuperAdminPassword;
            boolean isRandom = false;
            if (password == null || password.trim().isEmpty()) {
                password = java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 12);
                isRandom = true;
            }
            User superAdmin = new User();
            superAdmin.setUsername("superadmin");
            superAdmin.setPassword(passwordEncoder.encode(password));
            superAdmin.setRole("ROLE_SuperAdmin");
            superAdmin.setNombreCompleto("Super Administrador");
            superAdmin.setActivo(true);
            userRepository.save(superAdmin);
            
            if (isRandom) {
                System.out.println("************************************************************");
                System.out.println("⚠️  WARNING: NO SUPERADMIN PASSWORD PROVIDED IN CONFIGURATION.");
                System.out.println("🔑  GENERATED RANDOM SUPERADMIN PASSWORD: " + password);
                System.out.println("👉  PLEASE SAVE THIS PASSWORD OR SET app.security.superadmin.password");
                System.out.println("************************************************************");
            } else {
                System.out.println(">>>>> [DataInitializer] Usuario superadmin creado con éxito.");
            }
        }
    }
}
