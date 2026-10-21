package com.sanjose.bolsatrabajo;

import com.sanjose.bolsatrabajo.controller.UserController;
import com.sanjose.bolsatrabajo.entity.User;
import com.sanjose.bolsatrabajo.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserControllerUnitTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserController userController;

    private User interviewer1;
    private User interviewer2;
    private User admin1;

    @BeforeEach
    void setUp() {
        interviewer1 = new User();
        interviewer1.setId(1);
        interviewer1.setUsername("daiana");
        interviewer1.setRole("Entrevistador");
        interviewer1.setActivo(true);

        interviewer2 = new User();
        interviewer2.setId(2);
        interviewer2.setUsername("lucas");
        interviewer2.setRole("Administrativo");
        interviewer2.setActivo(true);

        admin1 = new User();
        admin1.setId(3);
        admin1.setUsername("superadmin");
        admin1.setRole("ROLE_SuperAdmin");
        admin1.setActivo(true);
    }

    @Test
    void changePassword_RechazaContrasenaDebil() {
        ResponseEntity<?> res = userController.changePassword(1, Map.of("password", "corta"));
        assertEquals(HttpStatus.BAD_REQUEST, res.getStatusCode());
        verify(userRepository, never()).save(any());
    }

    @Test
    void changePassword_ActualizaUsuarioIndividualCorrectamente() {
        when(userRepository.findById(1)).thenReturn(Optional.of(interviewer1));
        when(passwordEncoder.encode(anyString())).thenReturn("hashedPass");

        ResponseEntity<?> res = userController.changePassword(1, Map.of("password", "SanJose2026!"));
        assertEquals(HttpStatus.OK, res.getStatusCode());
        verify(userRepository, times(1)).save(interviewer1);
    }

    @Test
    @SuppressWarnings("unchecked")
    void changeBulkPassword_AlcanceEntrevistadores_SoloActualizaNoAdmins() {
        when(userRepository.findByDeletedAtIsNull()).thenReturn(List.of(interviewer1, interviewer2, admin1));
        when(passwordEncoder.encode("ClaveNueva2026!")).thenReturn("hashedBulk");

        ResponseEntity<?> res = userController.changeBulkPassword(Map.of(
                "password", "ClaveNueva2026!",
                "scope", "ENTREVISTADORES"
        ));

        assertEquals(HttpStatus.OK, res.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) res.getBody();
        assertNotNull(body);
        assertEquals(2, body.get("updatedCount"));
        verify(userRepository, times(2)).save(any(User.class));
    }

    @Test
    @SuppressWarnings("unchecked")
    void changeBulkPassword_AlcanceAdministradores_SoloActualizaSuperAdmins() {
        when(userRepository.findByDeletedAtIsNull()).thenReturn(List.of(interviewer1, interviewer2, admin1));
        when(passwordEncoder.encode("AdminNueva2026!")).thenReturn("hashedAdmin");

        ResponseEntity<?> res = userController.changeBulkPassword(Map.of(
                "password", "AdminNueva2026!",
                "scope", "ADMINISTRADORES"
        ));

        assertEquals(HttpStatus.OK, res.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) res.getBody();
        assertNotNull(body);
        assertEquals(1, body.get("updatedCount"));
        verify(userRepository, times(1)).save(admin1);
    }

    @Test
    @SuppressWarnings("unchecked")
    void changeBulkPassword_AlcanceTodos_ActualizaTodoElPersonal() {
        when(userRepository.findByDeletedAtIsNull()).thenReturn(List.of(interviewer1, interviewer2, admin1));
        when(passwordEncoder.encode("Global2026!")).thenReturn("hashedGlobal");

        ResponseEntity<?> res = userController.changeBulkPassword(Map.of(
                "password", "Global2026!",
                "scope", "TODOS"
        ));

        assertEquals(HttpStatus.OK, res.getStatusCode());
        Map<String, Object> body = (Map<String, Object>) res.getBody();
        assertNotNull(body);
        assertEquals(3, body.get("updatedCount"));
        verify(userRepository, times(3)).save(any(User.class));
    }
}
