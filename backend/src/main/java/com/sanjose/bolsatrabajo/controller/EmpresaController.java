package com.sanjose.bolsatrabajo.controller;

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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

/**
 * ABM de empresas para el relevamiento de la Oficina de Empleo.
 * Las empresas no acceden al sistema: sólo el personal interno las registra.
 * Lectura / alta / edición: SuperAdmin y Entrevistador.
 * Baja (lógica): sólo SuperAdmin (ver SecurityConfig).
 */
@RestController
@RequestMapping("/api/empresas")
public class EmpresaController {

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[\\w.+-]+@[\\w-]+(\\.[\\w-]+)+$");
    private static final int[] CUIT_PESOS = {5, 4, 3, 2, 7, 6, 5, 4, 3, 2};

    public static final Set<String> RANGOS_EMPLEADOS = Set.of("1-5", "6-10", "11-50", "51-200", "+200");
    public static final Set<String> INTERES_INCORPORAR = Set.of("SI", "NO", "A_FUTURO", "SIN_DATO");
    private static final String LOCALIDAD_POR_DEFECTO = "San José";

    @Autowired
    private EmpresaRepository empresaRepository;

    @Autowired
    private RubroRepository rubroRepository;

    @Autowired
    private BarrioRepository barrioRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Empresa>> listarActivas() {
        return ResponseEntity.ok(empresaRepository.findByActivoTrueOrderByRazonSocialAsc());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Empresa> obtener(@PathVariable Integer id) {
        return ResponseEntity.ok(buscarActiva(id));
    }

    @PostMapping
    public ResponseEntity<Empresa> crear(@RequestBody EmpresaRequest datos) {
        validar(datos);
        String cuit = normalizarCuit(datos.getCuit());
        User usuarioActual = obtenerUsuarioActual();

        Empresa destino = null;
        if (cuit != null) {
            Optional<Empresa> existente = empresaRepository.findByCuit(cuit);
            if (existente.isPresent()) {
                Empresa previa = existente.get();
                if (Boolean.TRUE.equals(previa.getActivo())) {
                    throw new DatabaseConflictException(
                            "Ya existe una empresa activa con el CUIT " + cuit
                                    + " (" + previa.getRazonSocial() + ").");
                }
                // La empresa había sido dada de baja: se reactiva con los datos nuevos
                // (el CUIT es UNIQUE en la BD, por lo que no puede insertarse otra fila).
                destino = previa;
                destino.setDeletedAt(null);
            }
        }

        if (destino == null) {
            destino = new Empresa();
        }
        aplicarDatos(datos, cuit, destino);
        destino.setActivo(true);
        destino.setRelevadoPor(usuarioActual);
        destino.setFechaRegistro(LocalDateTime.now());
        return ResponseEntity.ok(empresaRepository.save(destino));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Empresa> actualizar(@PathVariable Integer id, @RequestBody EmpresaRequest datos) {
        Empresa existente = buscarActiva(id);
        validar(datos);
        String cuit = normalizarCuit(datos.getCuit());

        if (cuit != null) {
            empresaRepository.findByCuit(cuit)
                    .filter(otra -> !otra.getId().equals(id))
                    .ifPresent(otra -> {
                        throw new DatabaseConflictException(
                                "El CUIT " + cuit + " ya está registrado para " + otra.getRazonSocial() + ".");
                    });
        }

        aplicarDatos(datos, cuit, existente);
        // Registros previos a esta versión no tienen entrevistador asignado
        if (existente.getRelevadoPor() == null) {
            existente.setRelevadoPor(obtenerUsuarioActual());
        }
        return ResponseEntity.ok(empresaRepository.save(existente));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Integer id) {
        Empresa existente = buscarActiva(id);
        existente.setActivo(false);
        existente.setDeletedAt(LocalDateTime.now());
        empresaRepository.save(existente);
        return ResponseEntity.ok().build();
    }

    // --- Helpers ---

    private Empresa buscarActiva(Integer id) {
        return empresaRepository.findById(id)
                .filter(e -> Boolean.TRUE.equals(e.getActivo()))
                .orElseThrow(() -> new ResourceNotFoundException("Empresa no encontrada."));
    }

    private User obtenerUsuarioActual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return null;
        }
        return userRepository.findByUsername(auth.getName()).orElse(null);
    }

    /** Copia los datos ya validados del request a la entidad. */
    private void aplicarDatos(EmpresaRequest d, String cuitNormalizado, Empresa e) {
        e.setRazonSocial(limpiar(d.getRazonSocial()));
        e.setNombreFantasia(limpiar(d.getNombreFantasia()));
        e.setCuit(cuitNormalizado);
        e.setRubro(resolverRubro(d.getRubroId()));
        e.setActividadPrincipal(limpiar(d.getActividadPrincipal()));
        e.setCantidadEmpleados(limpiar(d.getCantidadEmpleados()));

        e.setDireccion(limpiar(d.getDireccion()));
        e.setBarrio(resolverBarrio(d.getBarrioId()));
        String localidad = limpiar(d.getLocalidad());
        e.setLocalidad(localidad != null ? localidad : LOCALIDAD_POR_DEFECTO);

        e.setContactoNombre(limpiar(d.getContactoNombre()));
        e.setContactoCargo(limpiar(d.getContactoCargo()));
        e.setTelefono(limpiar(d.getTelefono()));
        e.setTelefonoSecundario(limpiar(d.getTelefonoSecundario()));
        String email = limpiar(d.getEmail());
        e.setEmail(email != null ? email.toLowerCase() : null);
        e.setSitioWeb(limpiar(d.getSitioWeb()));

        String interes = limpiar(d.getInteresIncorporar());
        e.setInteresIncorporar(interes != null ? interes : "SIN_DATO");
        e.setPerfilesDemandados(limpiar(d.getPerfilesDemandados()));
        e.setInteresProgramasEmpleo(Boolean.TRUE.equals(d.getInteresProgramasEmpleo()));
        e.setFechaRelevamiento(d.getFechaRelevamiento() != null ? d.getFechaRelevamiento() : LocalDate.now());
        e.setObservaciones(limpiar(d.getObservaciones()));
    }

    private Rubro resolverRubro(Integer id) {
        if (id == null) return null;
        return rubroRepository.findById(id)
                .filter(r -> Boolean.TRUE.equals(r.getActivo()))
                .orElseThrow(() -> new ValidationException("El rubro seleccionado no existe o está inactivo."));
    }

    private Barrio resolverBarrio(Integer id) {
        if (id == null) return null;
        return barrioRepository.findById(id)
                .filter(b -> Boolean.TRUE.equals(b.getActivo()))
                .orElseThrow(() -> new ValidationException("El barrio seleccionado no existe o está inactivo."));
    }

    private void validar(EmpresaRequest d) {
        if (d == null) {
            throw new ValidationException("Los datos de la empresa son obligatorios.");
        }

        if (limpiar(d.getRazonSocial()) == null) {
            throw new ValidationException("La razón social es obligatoria.");
        }

        if (limpiar(d.getTelefono()) == null && limpiar(d.getTelefonoSecundario()) == null
                && limpiar(d.getEmail()) == null) {
            throw new ValidationException("Debe indicar al menos un medio de contacto (teléfono o email).");
        }

        String email = limpiar(d.getEmail());
        if (email != null && !EMAIL_PATTERN.matcher(email).matches()) {
            throw new ValidationException("El email ingresado no es válido.");
        }

        String rango = limpiar(d.getCantidadEmpleados());
        if (rango != null && !RANGOS_EMPLEADOS.contains(rango)) {
            throw new ValidationException("La cantidad de empleados indicada no es válida.");
        }

        String interes = limpiar(d.getInteresIncorporar());
        if (interes != null && !INTERES_INCORPORAR.contains(interes)) {
            throw new ValidationException("El interés en incorporar personal indicado no es válido.");
        }

        if (d.getFechaRelevamiento() != null && d.getFechaRelevamiento().isAfter(LocalDate.now())) {
            throw new ValidationException("La fecha de relevamiento no puede ser futura.");
        }

        validarLongitud(d.getRazonSocial(), 200, "La razón social");
        validarLongitud(d.getNombreFantasia(), 150, "El nombre de fantasía");
        validarLongitud(d.getActividadPrincipal(), 255, "La actividad principal");
        validarLongitud(d.getDireccion(), 255, "La dirección");
        validarLongitud(d.getLocalidad(), 100, "La localidad");
        validarLongitud(d.getContactoNombre(), 100, "El nombre de contacto");
        validarLongitud(d.getContactoCargo(), 100, "El cargo del contacto");
        validarLongitud(d.getTelefono(), 50, "El teléfono");
        validarLongitud(d.getTelefonoSecundario(), 50, "El teléfono secundario");
        validarLongitud(email, 150, "El email");
        validarLongitud(d.getSitioWeb(), 255, "El sitio web");
        validarLongitud(d.getPerfilesDemandados(), 2000, "Los perfiles demandados");
        validarLongitud(d.getObservaciones(), 2000, "Las observaciones");
    }

    private void validarLongitud(String valor, int max, String campo) {
        String limpio = limpiar(valor);
        if (limpio != null && limpio.length() > max) {
            throw new ValidationException(campo + " no puede superar los " + max + " caracteres.");
        }
    }

    /**
     * Normaliza el CUIT al formato XX-XXXXXXXX-X y valida su dígito verificador.
     * Devuelve null si no se informó (el campo es opcional).
     */
    private String normalizarCuit(String cuit) {
        String limpio = limpiar(cuit);
        if (limpio == null) {
            return null;
        }
        String digitos = limpio.replaceAll("\\D", "");
        if (digitos.length() != 11) {
            throw new ValidationException("El CUIT debe tener 11 dígitos.");
        }

        int suma = 0;
        for (int i = 0; i < 10; i++) {
            suma += Character.getNumericValue(digitos.charAt(i)) * CUIT_PESOS[i];
        }
        int verificador = 11 - (suma % 11);
        if (verificador == 11) verificador = 0;
        if (verificador == 10 || verificador != Character.getNumericValue(digitos.charAt(10))) {
            throw new ValidationException("El CUIT ingresado no es válido (dígito verificador incorrecto).");
        }

        return digitos.substring(0, 2) + "-" + digitos.substring(2, 10) + "-" + digitos.substring(10);
    }

    private String limpiar(String valor) {
        if (valor == null) return null;
        String recortado = valor.trim();
        return recortado.isEmpty() ? null : recortado;
    }
}
