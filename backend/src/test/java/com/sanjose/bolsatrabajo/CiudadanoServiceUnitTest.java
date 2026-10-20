package com.sanjose.bolsatrabajo;

import com.sanjose.bolsatrabajo.entity.Ciudadano;
import com.sanjose.bolsatrabajo.exception.DatabaseConflictException;
import com.sanjose.bolsatrabajo.exception.ResourceNotFoundException;
import com.sanjose.bolsatrabajo.repository.CiudadanoRepository;
import com.sanjose.bolsatrabajo.repository.EntrevistaRepository;
import com.sanjose.bolsatrabajo.repository.UserRepository;
import com.sanjose.bolsatrabajo.service.CiudadanoService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CiudadanoServiceUnitTest {

    @Mock
    private CiudadanoRepository ciudadanoRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private EntrevistaRepository entrevistaRepository;

    @InjectMocks
    private CiudadanoService ciudadanoService;

    private Ciudadano ciudadano;

    @BeforeEach
    void setUp() {
        ciudadano = new Ciudadano();
        ciudadano.setDni("12345678");
        ciudadano.setCuil("20-12345678-9");
        ciudadano.setNombre("Juan");
        ciudadano.setApellido("Perez");
        ciudadano.setFechaNacimiento(LocalDate.of(1990, 5, 10));
        ciudadano.setTelefonoPrimario("11223344");
        ciudadano.setActivo(true);
    }

    @Test
    void guardarCiudadano_NewCiudadano_Success() {
        // Arrange
        when(ciudadanoRepository.findByDni(ciudadano.getDni())).thenReturn(Optional.empty());
        when(ciudadanoRepository.findByCuil(ciudadano.getCuil())).thenReturn(Optional.empty());
        when(ciudadanoRepository.save(any(Ciudadano.class))).thenReturn(ciudadano);

        // Act
        Ciudadano guardado = ciudadanoService.guardarCiudadano(ciudadano);

        // Assert
        assertNotNull(guardado);
        assertEquals("12345678", guardado.getDni());
        verify(ciudadanoRepository, times(1)).save(ciudadano);
    }

    @Test
    void guardarCiudadano_ExistingActiveDni_ThrowsDatabaseConflictException() {
        // Arrange
        Ciudadano existente = new Ciudadano();
        existente.setId(99);
        existente.setDni(ciudadano.getDni());
        existente.setActivo(true);

        when(ciudadanoRepository.findByDni(ciudadano.getDni())).thenReturn(Optional.of(existente));

        // Act & Assert
        DatabaseConflictException exception = assertThrows(DatabaseConflictException.class, () -> {
            ciudadanoService.guardarCiudadano(ciudadano);
        });

        assertEquals("Ya existe un ciudadano registrado con ese DNI.", exception.getMessage());
        verify(ciudadanoRepository, never()).save(any(Ciudadano.class));
    }

    @Test
    void guardarCiudadano_ExistingActiveCuil_ThrowsDatabaseConflictException() {
        // Arrange
        Ciudadano existente = new Ciudadano();
        existente.setId(99);
        existente.setCuil(ciudadano.getCuil());
        existente.setActivo(true);

        when(ciudadanoRepository.findByDni(ciudadano.getDni())).thenReturn(Optional.empty());
        when(ciudadanoRepository.findByCuil(ciudadano.getCuil())).thenReturn(Optional.of(existente));

        // Act & Assert
        DatabaseConflictException exception = assertThrows(DatabaseConflictException.class, () -> {
            ciudadanoService.guardarCiudadano(ciudadano);
        });

        assertEquals("Ya existe un ciudadano registrado con ese CUIL.", exception.getMessage());
        verify(ciudadanoRepository, never()).save(any(Ciudadano.class));
    }

    @Test
    void bajaLogica_ExistingId_Success() {
        // Arrange
        ciudadano.setId(1);
        when(ciudadanoRepository.findById(1)).thenReturn(Optional.of(ciudadano));
        when(ciudadanoRepository.save(any(Ciudadano.class))).thenReturn(ciudadano);

        // Act
        ciudadanoService.bajaLogica(1);

        // Assert
        assertFalse(ciudadano.getActivo());
        assertNotNull(ciudadano.getDeletedAt());
        verify(ciudadanoRepository, times(1)).save(ciudadano);
    }
}
