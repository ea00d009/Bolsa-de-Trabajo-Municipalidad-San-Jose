package com.sanjose.bolsatrabajo;

import com.sanjose.bolsatrabajo.controller.EmpresaController;
import com.sanjose.bolsatrabajo.dto.EmpresaRequest;
import com.sanjose.bolsatrabajo.entity.Barrio;
import com.sanjose.bolsatrabajo.entity.Empresa;
import com.sanjose.bolsatrabajo.entity.Rubro;
import com.sanjose.bolsatrabajo.entity.User;
import com.sanjose.bolsatrabajo.exception.DatabaseConflictException;
import com.sanjose.bolsatrabajo.exception.ResourceNotFoundException;
import com.sanjose.bolsatrabajo.exception.ValidationException;
import com.sanjose.bolsatrabajo.repository.BarrioRepository;
import com.sanjose.bolsatrabajo.repository.EmpresaRepository;
import com.sanjose.bolsatrabajo.repository.RubroRepository;
import com.sanjose.bolsatrabajo.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmpresaControllerUnitTest {

    @Mock
    private EmpresaRepository empresaRepository;

    @Mock
    private RubroRepository rubroRepository;

    @Mock
    private BarrioRepository barrioRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private EmpresaController empresaController;

    private EmpresaRequest requestValido;
    private Empresa empresaExistente;

    // CUIT válido con checksum verificado: 30-50001091-2
    private static final String CUIT_VALIDO_RAW = "30500010912";
    private static final String CUIT_VALIDO_FORMATEADO = "30-50001091-2";

    @BeforeEach
    void setUp() {
        requestValido = new EmpresaRequest();
        requestValido.setRazonSocial("Molino San José S.A.");
        requestValido.setNombreFantasia("Molino San José");
        requestValido.setCuit(CUIT_VALIDO_RAW);
        requestValido.setTelefono("3447-480000");
        requestValido.setEmail("contacto@molinosanjose.com");
        requestValido.setCantidadEmpleados("11-50");
        requestValido.setInteresIncorporar("SI");
        requestValido.setFechaRelevamiento(LocalDate.now());

        empresaExistente = new Empresa();
        empresaExistente.setId(10);
        empresaExistente.setRazonSocial("Molino San José S.A.");
        empresaExistente.setCuit(CUIT_VALIDO_FORMATEADO);
        empresaExistente.setActivo(true);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Listar empresas activas retorna lista ordenada")
    void listarActivas_Success() {
        when(empresaRepository.findByActivoTrueOrderByRazonSocialAsc())
                .thenReturn(List.of(empresaExistente));

        ResponseEntity<List<Empresa>> response = empresaController.listarActivas();

        assertNotNull(response.getBody());
        assertEquals(1, response.getBody().size());
        assertEquals("Molino San José S.A.", response.getBody().get(0).getRazonSocial());
    }

    @Test
    @DisplayName("Obtener por ID empresa activa retorna la entidad")
    void obtener_ExistingActive_Success() {
        when(empresaRepository.findById(10)).thenReturn(Optional.of(empresaExistente));

        ResponseEntity<Empresa> response = empresaController.obtener(10);

        assertNotNull(response.getBody());
        assertEquals(10, response.getBody().getId());
    }

    @Test
    @DisplayName("Obtener por ID inexistente lanza ResourceNotFoundException")
    void obtener_NotFound_ThrowsException() {
        when(empresaRepository.findById(999)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> empresaController.obtener(999));
    }

    @Test
    @DisplayName("Obtener por ID inactivo lanza ResourceNotFoundException")
    void obtener_Inactive_ThrowsException() {
        empresaExistente.setActivo(false);
        when(empresaRepository.findById(10)).thenReturn(Optional.of(empresaExistente));

        assertThrows(ResourceNotFoundException.class, () -> empresaController.obtener(10));
    }

    @Test
    @DisplayName("Crear empresa nueva válida guarda y normaliza el CUIT")
    void crear_ValidData_Success() {
        when(empresaRepository.findByCuit(CUIT_VALIDO_FORMATEADO)).thenReturn(Optional.empty());
        when(empresaRepository.save(any(Empresa.class))).thenAnswer(invocation -> {
            Empresa e = invocation.getArgument(0);
            e.setId(1);
            return e;
        });

        ResponseEntity<Empresa> response = empresaController.crear(requestValido);

        assertNotNull(response.getBody());
        assertEquals(CUIT_VALIDO_FORMATEADO, response.getBody().getCuit());
        assertTrue(response.getBody().getActivo());
        verify(empresaRepository, times(1)).save(any(Empresa.class));
    }

    @Test
    @DisplayName("Crear empresa asociando usuario autenticado como relevador")
    void crear_WithAuthenticatedUser_SetsRelevadoPor() {
        org.springframework.security.core.context.SecurityContextImpl secContext =
                new org.springframework.security.core.context.SecurityContextImpl();
        org.springframework.security.authentication.UsernamePasswordAuthenticationToken auth =
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        "entrevistador1", "password", java.util.Collections.emptyList());
        secContext.setAuthentication(auth);
        SecurityContextHolder.setContext(secContext);

        User entrevistador = new User();
        entrevistador.setId(5);
        entrevistador.setUsername("entrevistador1");
        entrevistador.setNombreCompleto("Laura Gómez");
        when(userRepository.findByUsername("entrevistador1")).thenReturn(Optional.of(entrevistador));

        when(empresaRepository.findByCuit(CUIT_VALIDO_FORMATEADO)).thenReturn(Optional.empty());
        when(empresaRepository.save(any(Empresa.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResponseEntity<Empresa> response = empresaController.crear(requestValido);

        assertNotNull(response.getBody());
        assertEquals("Laura Gómez", response.getBody().getRelevadoPorNombre());
    }

    @Test
    @DisplayName("Crear empresa con CUIT existente y activo lanza DatabaseConflictException")
    void crear_ExistingActiveCuit_ThrowsConflict() {
        when(empresaRepository.findByCuit(CUIT_VALIDO_FORMATEADO)).thenReturn(Optional.of(empresaExistente));

        assertThrows(DatabaseConflictException.class, () -> empresaController.crear(requestValido));
        verify(empresaRepository, never()).save(any(Empresa.class));
    }

    @Test
    @DisplayName("Crear empresa con CUIT previamente dado de baja la reactiva y actualiza datos")
    void crear_ReactivateDeletedEmpresa_Success() {
        Empresa empresaPreviaBaja = new Empresa();
        empresaPreviaBaja.setId(25);
        empresaPreviaBaja.setRazonSocial("Antigua Razón S.A.");
        empresaPreviaBaja.setCuit(CUIT_VALIDO_FORMATEADO);
        empresaPreviaBaja.setActivo(false);

        when(empresaRepository.findByCuit(CUIT_VALIDO_FORMATEADO)).thenReturn(Optional.of(empresaPreviaBaja));
        when(empresaRepository.save(any(Empresa.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResponseEntity<Empresa> response = empresaController.crear(requestValido);

        assertNotNull(response.getBody());
        assertEquals(25, response.getBody().getId());
        assertTrue(response.getBody().getActivo());
        assertNull(response.getBody().getDeletedAt());
        assertEquals("Molino San José S.A.", response.getBody().getRazonSocial());
        verify(empresaRepository, times(1)).save(empresaPreviaBaja);
    }

    @Test
    @DisplayName("Validación falla si falta razón social")
    void crear_MissingRazonSocial_ThrowsValidationException() {
        requestValido.setRazonSocial("   ");

        ValidationException ex = assertThrows(ValidationException.class, () -> empresaController.crear(requestValido));
        assertTrue(ex.getMessage().contains("razón social es obligatoria"));
    }

    @Test
    @DisplayName("Validación falla si no se provee ningún medio de contacto")
    void crear_MissingAllContactMethods_ThrowsValidationException() {
        requestValido.setTelefono(null);
        requestValido.setTelefonoSecundario("  ");
        requestValido.setEmail("");

        ValidationException ex = assertThrows(ValidationException.class, () -> empresaController.crear(requestValido));
        assertTrue(ex.getMessage().contains("al menos un medio de contacto"));
    }

    @Test
    @DisplayName("Validación falla con CUIT de dígito verificador erróneo")
    void crear_InvalidCuitChecksum_ThrowsValidationException() {
        // CUIT con último dígito alterado (debería ser 2, se pasa 9)
        requestValido.setCuit("30-50001091-9");

        ValidationException ex = assertThrows(ValidationException.class, () -> empresaController.crear(requestValido));
        assertTrue(ex.getMessage().contains("dígito verificador incorrecto"));
    }

    @Test
    @DisplayName("Validación falla con email mal formado")
    void crear_InvalidEmail_ThrowsValidationException() {
        requestValido.setEmail("correo-sin-arroba.com");

        ValidationException ex = assertThrows(ValidationException.class, () -> empresaController.crear(requestValido));
        assertTrue(ex.getMessage().contains("email"));
    }

    @Test
    @DisplayName("Validación falla con fecha de relevamiento futura")
    void crear_FutureSurveyDate_ThrowsValidationException() {
        requestValido.setFechaRelevamiento(LocalDate.now().plusDays(2));

        ValidationException ex = assertThrows(ValidationException.class, () -> empresaController.crear(requestValido));
        assertTrue(ex.getMessage().contains("no puede ser futura"));
    }

    @Test
    @DisplayName("Actualizar empresa existente con éxito")
    void actualizar_ValidData_Success() {
        when(empresaRepository.findById(10)).thenReturn(Optional.of(empresaExistente));
        when(empresaRepository.findByCuit(CUIT_VALIDO_FORMATEADO)).thenReturn(Optional.of(empresaExistente));
        when(empresaRepository.save(any(Empresa.class))).thenAnswer(invocation -> invocation.getArgument(0));

        requestValido.setRazonSocial("Molino San José Renombrado S.A.");
        ResponseEntity<Empresa> response = empresaController.actualizar(10, requestValido);

        assertNotNull(response.getBody());
        assertEquals("Molino San José Renombrado S.A.", response.getBody().getRazonSocial());
        verify(empresaRepository, times(1)).save(empresaExistente);
    }

    @Test
    @DisplayName("Actualizar empresa con CUIT duplicado de otra empresa lanza DatabaseConflictException")
    void actualizar_CuitBelongsToAnotherEmpresa_ThrowsConflict() {
        Empresa otraEmpresa = new Empresa();
        otraEmpresa.setId(99);
        otraEmpresa.setRazonSocial("Otra Empresa S.R.L.");
        otraEmpresa.setCuit(CUIT_VALIDO_FORMATEADO);

        when(empresaRepository.findById(10)).thenReturn(Optional.of(empresaExistente));
        when(empresaRepository.findByCuit(CUIT_VALIDO_FORMATEADO)).thenReturn(Optional.of(otraEmpresa));

        assertThrows(DatabaseConflictException.class, () -> empresaController.actualizar(10, requestValido));
        verify(empresaRepository, never()).save(empresaExistente);
    }

    @Test
    @DisplayName("Baja lógica marca activo=false y deleted_at")
    void eliminar_SoftDelete_Success() {
        when(empresaRepository.findById(10)).thenReturn(Optional.of(empresaExistente));
        when(empresaRepository.save(any(Empresa.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ResponseEntity<Void> response = empresaController.eliminar(10);

        assertEquals(200, response.getStatusCode().value());
        assertFalse(empresaExistente.getActivo());
        assertNotNull(empresaExistente.getDeletedAt());
        verify(empresaRepository, times(1)).save(empresaExistente);
    }
}
