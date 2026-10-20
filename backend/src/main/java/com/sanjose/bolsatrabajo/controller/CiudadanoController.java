package com.sanjose.bolsatrabajo.controller;

import com.sanjose.bolsatrabajo.entity.Ciudadano;
import com.sanjose.bolsatrabajo.exception.ValidationException;
import com.sanjose.bolsatrabajo.exception.ResourceNotFoundException;
import com.sanjose.bolsatrabajo.service.CiudadanoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ciudadanos")
@Tag(name = "Postulantes", description = "Endpoints para la gestión de ciudadanos y postulantes de la Oficina de Empleo")
public class CiudadanoController {

    private static final Logger logger = LoggerFactory.getLogger(CiudadanoController.class);

    @Autowired
    private CiudadanoService ciudadanoService;

    @GetMapping
    @Operation(summary = "Obtener listado de postulantes activos", description = "Retorna la lista de ciudadanos activos. Permite búsqueda aproximada por texto (nombre/apellido/DNI), filtrado por rubro, estado laboral, barrio, CUD, nivel educativo, rango de edad y paginación en servidor.")
    public ResponseEntity<?> listarActivos(
            @RequestParam(value = "buscar", required = false) String buscar,
            @RequestParam(value = "rubroId", required = false) Integer rubroId,
            @RequestParam(value = "estadoLaboral", required = false) String estadoLaboral,
            @RequestParam(value = "barrioId", required = false) Integer barrioId,
            @RequestParam(value = "cudDiscapacidad", required = false) Boolean cudDiscapacidad,
            @RequestParam(value = "nivelEducativo", required = false) String nivelEducativo,
            @RequestParam(value = "rangoEdad", required = false) String rangoEdad,
            @RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "size", required = false) Integer size) {
        
        logger.info("Petición GET /api/ciudadanos recibida. Filtros - buscar: '{}', rubroId: {}, estadoLaboral: '{}', barrioId: {}, cudDiscapacidad: {}, nivelEducativo: '{}', rangoEdad: '{}', page: {}, size: {}", 
                buscar, rubroId, estadoLaboral, barrioId, cudDiscapacidad, nivelEducativo, rangoEdad, page, size);
        
        if ("ELIMINADO".equalsIgnoreCase(estadoLaboral)) {
            if (page == null && size == null) {
                List<Ciudadano> ciudadanos = ciudadanoService.buscarInactivosConFiltro(buscar, rubroId, barrioId, cudDiscapacidad, nivelEducativo, rangoEdad);
                return ResponseEntity.ok(ciudadanos);
            } else {
                int p = page != null ? page : 0;
                int s = size != null ? size : 20;
                Page<Ciudadano> ciudadanos = ciudadanoService.buscarInactivosConFiltroYPagina(buscar, rubroId, barrioId, cudDiscapacidad, nivelEducativo, rangoEdad, p, s);
                return ResponseEntity.ok(ciudadanos);
            }
        }

        if (page == null && size == null) {
            List<Ciudadano> ciudadanos = ciudadanoService.buscarActivosConFiltro(buscar, rubroId, estadoLaboral, barrioId, cudDiscapacidad, nivelEducativo, rangoEdad);
            return ResponseEntity.ok(ciudadanos);
        } else {
            int p = page != null ? page : 0;
            int s = size != null ? size : 20;
            Page<Ciudadano> ciudadanos = ciudadanoService.buscarActivosConFiltroYPagina(buscar, rubroId, estadoLaboral, barrioId, cudDiscapacidad, nivelEducativo, rangoEdad, p, s);
            return ResponseEntity.ok(ciudadanos);
        }
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener postulante por ID", description = "Obtiene los detalles de un postulante activo por su identificador único.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Postulante encontrado con éxito"),
        @ApiResponse(responseCode = "404", description = "Postulante no encontrado o inactivo")
    })
    public ResponseEntity<?> obtenerPorId(@PathVariable Integer id) {
        logger.info("Petición GET /api/ciudadanos/{} recibida", id);
        return ciudadanoService.obtenerPorId(id)
                .map(ResponseEntity::ok)
                .orElseThrow(() -> new ResourceNotFoundException("Ciudadano no encontrado con id: " + id));
    }

    @PostMapping
    @Operation(summary = "Guardar o actualizar un postulante", description = "Crea un postulante desde cero o lo actualiza. Ejecuta la Reactivación Inteligente si se detecta un DNI o CUIL inactivo existente.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Postulante guardado/reactivado con éxito"),
        @ApiResponse(responseCode = "400", description = "Error de validación de negocio (campos requeridos, edad menor a 14, fechas de experiencia incorrectas)"),
        @ApiResponse(responseCode = "409", description = "Conflicto de datos (DNI o CUIL ya en uso por otro ciudadano activo)")
    })
    public ResponseEntity<?> guardar(@RequestBody Ciudadano ciudadano) {
        logger.info("Petición POST /api/ciudadanos recibida");
        boolean wasInactive = false;
        if (ciudadano.getId() == null) {
            wasInactive = ciudadanoService.isDniInactive(ciudadano.getDni()) || ciudadanoService.isCuilInactive(ciudadano.getCuil());
        }

        Ciudadano guardado = ciudadanoService.guardarCiudadano(ciudadano);

        ResponseEntity.BodyBuilder responseBuilder = ResponseEntity.ok();
        if (wasInactive) {
            responseBuilder.header("X-Restored-From-Inactive", "true");
            responseBuilder.header("Access-Control-Expose-Headers", "X-Restored-From-Inactive");
        }
        return responseBuilder.body(guardado);
    }

    @PostMapping("/{id}/restaurar")
    @Operation(summary = "Restaurar un postulante inactivo", description = "Activa nuevamente a un ciudadano inactivo (activo = true, deleted_at = null).")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Postulante restaurado con éxito"),
        @ApiResponse(responseCode = "404", description = "Postulante no encontrado"),
        @ApiResponse(responseCode = "409", description = "Conflicto de datos (el DNI o CUIL coincide con un ciudadano activo)")
    })
    public ResponseEntity<?> restaurar(@PathVariable Integer id) {
        logger.info("Petición POST /api/ciudadanos/{}/restaurar recibida", id);
        Ciudadano restaurado = ciudadanoService.restaurar(id);
        return ResponseEntity.ok(restaurado);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Dar de baja lógica a un postulante", description = "Desactiva lógicamente al ciudadano (activo = false) para preservar su historial de visitas y auditorías sin realizar un borrado físico.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Baja lógica procesada con éxito"),
        @ApiResponse(responseCode = "404", description = "Postulante no encontrado con el ID provisto")
    })
    public ResponseEntity<?> eliminar(@PathVariable Integer id) {
        logger.info("Petición DELETE /api/ciudadanos/{} recibida", id);
        ciudadanoService.bajaLogica(id);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/{id}/estado")
    @Operation(summary = "Actualizar estado laboral de un postulante", description = "Cambia el estado laboral del postulante (ej. EN_BUSQUEDA_ACTIVA, EMPLEADO, etc.) de manera parcial.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Estado laboral actualizado con éxito"),
        @ApiResponse(responseCode = "400", description = "Campo estadoLaboral no provisto o validación fallida"),
        @ApiResponse(responseCode = "404", description = "Postulante no encontrado")
    })
    public ResponseEntity<?> actualizarEstado(@PathVariable Integer id, @RequestBody java.util.Map<String, String> body) {
        logger.info("Petición PATCH /api/ciudadanos/{}/estado recibida", id);
        String nuevoEstado = body.get("estadoLaboral");
        if (nuevoEstado == null) {
            logger.warn("Petición PATCH fallida: Falta campo 'estadoLaboral'");
            throw new ValidationException("El estado laboral es requerido.");
        }
        
        Ciudadano c = ciudadanoService.obtenerPorId(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ciudadano no encontrado con id: " + id));
        
        c.setEstadoLaboral(nuevoEstado.toUpperCase());
        Ciudadano guardado = ciudadanoService.guardarCiudadano(c);
        return ResponseEntity.ok(guardado);
    }

    @PatchMapping("/{id}/admin-feedback")
    @Operation(summary = "Actualizar calificación y notas privadas de un postulante", description = "Permite al entrevistador guardar su calificación y notas privadas de forma persistente.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Feedback del administrador actualizado con éxito"),
        @ApiResponse(responseCode = "400", description = "Validación fallida"),
        @ApiResponse(responseCode = "404", description = "Postulante no encontrado")
    })
    public ResponseEntity<?> actualizarAdminFeedback(
            @PathVariable Integer id, 
            @RequestBody java.util.Map<String, Object> body) {
        logger.info("Petición PATCH /api/ciudadanos/{}/admin-feedback recibida", id);
        
        Integer calificacion = null;
        if (body.get("calificacion") != null) {
            calificacion = ((Number) body.get("calificacion")).intValue();
        }
        String notasPrivadas = (String) body.get("notasPrivadas");
        
        ciudadanoService.actualizarAdminFeedback(id, calificacion, notasPrivadas);
        return ResponseEntity.ok().build();
    }
}