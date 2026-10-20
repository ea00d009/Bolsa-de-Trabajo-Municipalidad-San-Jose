package com.sanjose.bolsatrabajo.service;

import com.sanjose.bolsatrabajo.entity.Ciudadano;
import com.sanjose.bolsatrabajo.entity.Educacion;
import com.sanjose.bolsatrabajo.entity.ExperienciaLaboral;
import com.sanjose.bolsatrabajo.entity.Entrevista;
import com.sanjose.bolsatrabajo.entity.User;
import com.sanjose.bolsatrabajo.exception.ValidationException;
import com.sanjose.bolsatrabajo.exception.DatabaseConflictException;
import com.sanjose.bolsatrabajo.exception.ResourceNotFoundException;
import com.sanjose.bolsatrabajo.repository.CiudadanoRepository;
import com.sanjose.bolsatrabajo.repository.EntrevistaRepository;
import com.sanjose.bolsatrabajo.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CiudadanoService {

    private static final Logger logger = LoggerFactory.getLogger(CiudadanoService.class);

    @Autowired
    private CiudadanoRepository ciudadanoRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EntrevistaRepository entrevistaRepository;

    @Transactional
    public Ciudadano guardarCiudadano(Ciudadano ciudadano) {
        logger.info("Iniciando proceso de guardado/actualización para postulante. DNI recibido: {}", maskDni(ciudadano.getDni()));

        // Validar obligatoriedad y formato de DNI
        if (ciudadano.getDni() == null || ciudadano.getDni().trim().isEmpty()) {
            logger.warn("Validación fallida: El DNI es obligatorio.");
            throw new ValidationException("El DNI es obligatorio.");
        }
        String cleanDni = ciudadano.getDni().replaceAll("\\D", "");
        if (cleanDni.length() < 7 || cleanDni.length() > 8) {
            logger.warn("Validación fallida: Formato de DNI inválido. Recibido: {}", maskDni(ciudadano.getDni()));
            throw new ValidationException("El DNI debe tener entre 7 y 8 dígitos numéricos.");
        }

        // Validar obligatoriedad y formato de CUIL
        if (ciudadano.getCuil() == null || ciudadano.getCuil().trim().isEmpty()) {
            logger.warn("Validación fallida: El CUIL es obligatorio.");
            throw new ValidationException("El CUIL es obligatorio.");
        }
        String cleanCuil = ciudadano.getCuil().replaceAll("\\D", "");
        if (cleanCuil.length() != 11) {
            logger.warn("Validación fallida: Formato de CUIL inválido. Recibido: {}", maskCuil(ciudadano.getCuil()));
            throw new ValidationException("El CUIL debe tener exactamente 11 dígitos numéricos.");
        }

        // Validar correlación entre DNI y CUIL
        if (!cleanCuil.contains(cleanDni)) {
            logger.warn("Validación fallida: El DNI {} no está contenido en el CUIL {}.", maskDni(cleanDni), maskCuil(cleanCuil));
            throw new ValidationException("El CUIL no es válido para el DNI ingresado (el DNI debe estar contenido en el CUIL).");
        }

        // Validar Fecha de Nacimiento
        if (ciudadano.getFechaNacimiento() == null) {
            logger.warn("Validación fallida: La fecha de nacimiento es obligatoria.");
            throw new ValidationException("La fecha de nacimiento es obligatoria.");
        }
        if (ciudadano.getFechaNacimiento().isAfter(java.time.LocalDate.now())) {
            logger.warn("Validación fallida: Fecha de nacimiento futura recibida: {}", ciudadano.getFechaNacimiento());
            throw new ValidationException("La fecha de nacimiento no puede ser en el futuro.");
        }
        java.time.LocalDate minAge = java.time.LocalDate.now().minusYears(14);
        java.time.LocalDate maxAge = java.time.LocalDate.now().minusYears(100);
        if (ciudadano.getFechaNacimiento().isAfter(minAge)) {
            logger.warn("Validación fallida: El postulante debe ser mayor de 14 años. Nacimiento: {}", ciudadano.getFechaNacimiento());
            throw new ValidationException("El postulante debe ser mayor de 14 años.");
        }
        if (ciudadano.getFechaNacimiento().isBefore(maxAge)) {
            logger.warn("Validación fallida: La fecha de nacimiento excede el límite razonable: {}", ciudadano.getFechaNacimiento());
            throw new ValidationException("La fecha de nacimiento no es válida.");
        }

        // Validar obligatoriedad del teléfono primario
        if (ciudadano.getTelefonoPrimario() == null || ciudadano.getTelefonoPrimario().trim().isEmpty()) {
            logger.warn("Validación fallida: El teléfono principal es obligatorio.");
            throw new ValidationException("El teléfono principal es obligatorio.");
        }

        // SEC-20: Validar tamaño y formato de foto (máximo 2MB)
        if (ciudadano.getFoto() != null && !ciudadano.getFoto().trim().isEmpty()) {
            String fotoStr = ciudadano.getFoto().trim();
            if (!fotoStr.startsWith("data:image/")) {
                logger.warn("Validación fallida: Formato de foto no soportado. Debe empezar con data:image/");
                throw new ValidationException("El formato de la foto debe ser una imagen válida (data:image/...)");
            }
            if (fotoStr.length() > 3_000_000) {
                logger.warn("Validación fallida: El tamaño de la foto excede el límite de 2MB. Caracteres: {}", fotoStr.length());
                throw new ValidationException("El tamaño de la foto no debe superar los 2 MB.");
            }
        }

        // Validar Fechas de Experiencia Laboral
        if (ciudadano.getExperienciasLaborales() != null) {
            for (ExperienciaLaboral exp : ciudadano.getExperienciasLaborales()) {
                if (exp.getEmpresa() == null || exp.getEmpresa().trim().isEmpty()) {
                    logger.warn("Validación fallida: Nombre de empresa vacío en experiencia laboral.");
                    throw new ValidationException("La empresa es obligatoria en todas las experiencias laborales.");
                }
                if (exp.getPuesto() == null || exp.getPuesto().trim().isEmpty()) {
                    logger.warn("Validación fallida: Nombre de puesto vacío en experiencia laboral.");
                    throw new ValidationException("El puesto es obligatorio en todas las experiencias laborales.");
                }
                if (exp.getFechaInicio() != null && exp.getFechaFin() != null && (exp.getCurrentlyWorking() == null || !exp.getCurrentlyWorking())) {
                    if (exp.getFechaInicio().isAfter(exp.getFechaFin())) {
                        logger.warn("Validación fallida: Rango de fechas inválido en experiencia laboral en {}", exp.getEmpresa());
                        throw new ValidationException("En la experiencia laboral (" + exp.getEmpresa() + "), la fecha de inicio no puede ser posterior a la fecha de fin.");
                    }
                }
            }
        }

        // Validar Educación
        if (ciudadano.getEducaciones() != null) {
            for (Educacion edu : ciudadano.getEducaciones()) {
                if (edu.getInstitucion() == null || edu.getInstitucion().trim().isEmpty()) {
                    logger.warn("Validación fallida: Institución vacía en estudios.");
                    throw new ValidationException("La institución es obligatoria en todos los estudios.");
                }
                if (edu.getNivelAlcanzado() == null || edu.getNivelAlcanzado().trim().isEmpty()) {
                    logger.warn("Validación fallida: Nivel alcanzado vacío en estudios.");
                    throw new ValidationException("El nivel alcanzado es obligatorio en todos los estudios.");
                }
                if (edu.getAnioUltimoAprobado() != null) {
                    int currentYear = java.time.LocalDate.now().getYear();
                    if (edu.getAnioUltimoAprobado() < 1940 || edu.getAnioUltimoAprobado() > currentYear + 10) {
                        logger.warn("Validación fallida: Año de egreso/último aprobado inválido: {}", edu.getAnioUltimoAprobado());
                        throw new ValidationException("El año de egreso o último aprobado (" + edu.getAnioUltimoAprobado() + ") no es válido.");
                    }
                }
            }
        }

        boolean isNew = ciudadano.getId() == null;

        // Validar unicidad de DNI y CUIL
        if (isNew) {
            Optional<Ciudadano> existingDni = ciudadanoRepository.findByDni(ciudadano.getDni());
            if (existingDni.isPresent()) {
                Ciudadano exist = existingDni.get();
                if (exist.getActivo()) {
                    logger.warn("Conflicto de unicidad: Ya existe un postulante ACTIVO con DNI {}", maskDni(ciudadano.getDni()));
                    throw new DatabaseConflictException("Ya existe un ciudadano registrado con ese DNI.");
                } else {
                    // Validar que el CUIL de la reactivación no esté en uso por otro ciudadano ACTIVO
                    Optional<Ciudadano> existingCuil = ciudadanoRepository.findByCuil(ciudadano.getCuil());
                    if (existingCuil.isPresent() && !existingCuil.get().getId().equals(exist.getId())) {
                        if (existingCuil.get().getActivo()) {
                            logger.warn("Conflicto de unicidad en reactivación: El CUIL {} ya está en uso.", maskCuil(ciudadano.getCuil()));
                            throw new DatabaseConflictException("El CUIL ya está en uso por otro ciudadano activo.");
                        } else {
                            logger.warn("Conflicto de registros inactivos para DNI {} y CUIL {}.", maskDni(ciudadano.getDni()), maskCuil(ciudadano.getCuil()));
                            throw new DatabaseConflictException("Conflicto de registros inactivos (el DNI y el CUIL coinciden con distintos postulantes eliminados).");
                        }
                    }
                    logger.info("Detectado postulante INACTIVO con DNI {}. Procediendo a Reactivación Inteligente.", maskDni(ciudadano.getDni()));
                    reactivarCiudadanoInactivo(exist, ciudadano);
                    ciudadano = exist;
                    isNew = true; // Sigue considerándose alta nueva a efectos de registro de la entrevista
                }
            } else {
                Optional<Ciudadano> existingCuil = ciudadanoRepository.findByCuil(ciudadano.getCuil());
                if (existingCuil.isPresent()) {
                    Ciudadano exist = existingCuil.get();
                    if (exist.getActivo()) {
                        logger.warn("Conflicto de unicidad: Ya existe un postulante ACTIVO con CUIL {}", maskCuil(ciudadano.getCuil()));
                        throw new DatabaseConflictException("Ya existe un ciudadano registrado con ese CUIL.");
                    } else {
                        // Reactivar e integrar el registro inactivo existente
                        logger.info("Detectado postulante INACTIVO con CUIL {}. Procediendo a Reactivación Inteligente.", maskCuil(ciudadano.getCuil()));
                        reactivarCiudadanoInactivo(exist, ciudadano);
                        ciudadano = exist;
                        isNew = true; 
                    }
                }
            }
        } else {
            Optional<Ciudadano> cDni = ciudadanoRepository.findByDni(ciudadano.getDni());
            if (cDni.isPresent() && !cDni.get().getId().equals(ciudadano.getId())) {
                logger.warn("Conflicto de unicidad en modificación: DNI {} ya registrado en otro ID.", maskDni(ciudadano.getDni()));
                throw new DatabaseConflictException("Ya existe otro ciudadano registrado con ese DNI.");
            }
            Optional<Ciudadano> cCuil = ciudadanoRepository.findByCuil(ciudadano.getCuil());
            if (cCuil.isPresent() && !cCuil.get().getId().equals(ciudadano.getId())) {
                logger.warn("Conflicto de unicidad en modificación: CUIL {} ya registrado en otro ID.", maskCuil(ciudadano.getCuil()));
                throw new DatabaseConflictException("Ya existe otro ciudadano registrado con ese CUIL.");
            }
        }

        // Establecer la relación bidireccional para Educacion
        if (ciudadano.getEducaciones() != null) {
            for (Educacion edu : ciudadano.getEducaciones()) {
                edu.setCiudadano(ciudadano);
            }
        }

        // Establecer la relación bidireccional para ExperienciaLaboral
        if (ciudadano.getExperienciasLaborales() != null) {
            for (ExperienciaLaboral exp : ciudadano.getExperienciasLaborales()) {
                exp.setCiudadano(ciudadano);
            }
        }

        // Establecer la relación bidireccional para Entrevista
        if (ciudadano.getEntrevistas() != null) {
            for (Entrevista ent : ciudadano.getEntrevistas()) {
                ent.setCiudadano(ciudadano);
            }
        }

        Ciudadano guardado = ciudadanoRepository.save(ciudadano);
        logger.info("Postulante guardado con éxito. ID: {}, DNI: {}", guardado.getId(), maskDni(guardado.getDni()));

        if (isNew) {
            try {
                Authentication auth = SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.isAuthenticated()) {
                    String username = auth.getName();
                    Optional<User> optUser = userRepository.findByUsername(username);
                    if (optUser.isPresent()) {
                        User user = optUser.get();
                        Entrevista entrevista = new Entrevista();
                        entrevista.setCiudadano(guardado);
                        entrevista.setPersonal(user);
                        entrevista.setFechaEntrevista(LocalDateTime.now());
                        entrevista.setObjetivoConsulta("Registro inicial");
                        entrevista.setObservacionesTecnicas("Agregado por sistema");
                        entrevistaRepository.save(entrevista);
                        logger.info("Entrevista de Registro Inicial creada con éxito. Entrevistador: {}", user.getUsername());
                    }
                }
            } catch (Exception e) {
                logger.error("Error al asociar entrevistador al ciudadano registrado: {}", e.getMessage());
            }
        }

        return guardado;
    }

    private void reactivarCiudadanoInactivo(Ciudadano target, Ciudadano source) {
        target.setNombre(source.getNombre());
        target.setApellido(source.getApellido());
        target.setDni(source.getDni());
        target.setCuil(source.getCuil());
        target.setFechaNacimiento(source.getFechaNacimiento());
        target.setGenero(source.getGenero());
        target.setDireccion(source.getDireccion());
        target.setPuntosReferenciaDomicilio(source.getPuntosReferenciaDomicilio());
        target.setTelefonoPrimario(source.getTelefonoPrimario());
        target.setTelefonoSecundario(source.getTelefonoSecundario());
        target.setEmail(source.getEmail());
        target.setEstadoCivil(source.getEstadoCivil());
        target.setHijosACargo(source.getHijosACargo());
        target.setCudDiscapacidad(source.getCudDiscapacidad());
        target.setTipoDiscapacidad(source.getTipoDiscapacidad());
        target.setCudVencimiento(source.getCudVencimiento());
        target.setMovilidadPropia(source.getMovilidadPropia());
        target.setLicenciaConducir(source.getLicenciaConducir());
        target.setCvUrl(source.getCvUrl());
        target.setTipoEmpleoBuscado(source.getTipoEmpleoBuscado());
        target.setSituacionMonotributo(source.getSituacionMonotributo());
        target.setSituacionResponsableInscripto(source.getSituacionResponsableInscripto());
        target.setSituacionAter(source.getSituacionAter());
        target.setSituacionHabilitacionMunicipal(source.getSituacionHabilitacionMunicipal());
        target.setSituacionRegistroEspecifico(source.getSituacionRegistroEspecifico());
        target.setTieneObraSocial(source.getTieneObraSocial());
        target.setPlanSocialActivo(source.getPlanSocialActivo());
        target.setObservacionesGenerales(source.getObservacionesGenerales());
        target.setHabilidades(source.getHabilidades());
        target.setFoto(source.getFoto());
        target.setEstadoLaboral(source.getEstadoLaboral());
        target.setRubros(source.getRubros());
        target.setBarrio(source.getBarrio());

        // Actualizar colecciones limpiando y re-asociando
        target.getEducaciones().clear();
        if (source.getEducaciones() != null) {
            for (Educacion edu : source.getEducaciones()) {
                edu.setCiudadano(target);
                target.getEducaciones().add(edu);
            }
        }

        target.getExperienciasLaborales().clear();
        if (source.getExperienciasLaborales() != null) {
            for (ExperienciaLaboral exp : source.getExperienciasLaborales()) {
                exp.setCiudadano(target);
                target.getExperienciasLaborales().add(exp);
            }
        }

        target.setActivo(true);
        target.setDeletedAt(null);
    }

    public List<Ciudadano> obtenerTodosActivos() {
        return ciudadanoRepository.findByActivoTrue();
    }

    public List<Ciudadano> buscarActivos(String search) {
        if (search == null || search.trim().isEmpty()) {
            return obtenerTodosActivos();
        }
        return ciudadanoRepository.buscarCiudadanosActivos(search.trim());
    }

    public List<Ciudadano> buscarActivosConFiltro(
            String search, Integer rubroId, String estadoLaboral,
            Integer barrioId, Boolean cudDiscapacidad, String nivelEducativo, String rangoEdad) {
        String cleanSearch = (search == null || search.trim().isEmpty()) ? null : search.trim();
        String cleanEstado = (estadoLaboral == null || estadoLaboral.trim().isEmpty()) ? null : estadoLaboral.trim().toUpperCase();
        String cleanEducacion = (nivelEducativo == null || nivelEducativo.trim().isEmpty()) ? null : nivelEducativo.trim();

        java.time.LocalDate minNacimiento = null;
        java.time.LocalDate maxNacimiento = null;
        if (rangoEdad != null && !rangoEdad.trim().isEmpty()) {
            java.time.LocalDate today = java.time.LocalDate.now();
            switch (rangoEdad.trim()) {
                case "18-25":
                    maxNacimiento = today.minusYears(18);
                    minNacimiento = today.minusYears(26).plusDays(1);
                    break;
                case "26-35":
                    maxNacimiento = today.minusYears(26);
                    minNacimiento = today.minusYears(36).plusDays(1);
                    break;
                case "36-45":
                    maxNacimiento = today.minusYears(36);
                    minNacimiento = today.minusYears(46).plusDays(1);
                    break;
                case "46+":
                    maxNacimiento = today.minusYears(46);
                    break;
            }
        }

        return ciudadanoRepository.buscarCiudadanosConFiltro(
                cleanSearch, rubroId, cleanEstado, barrioId, cudDiscapacidad, cleanEducacion, minNacimiento, maxNacimiento);
    }

    public Page<Ciudadano> buscarActivosConFiltroYPagina(
            String search, Integer rubroId, String estadoLaboral,
            Integer barrioId, Boolean cudDiscapacidad, String nivelEducativo, String rangoEdad,
            int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        String cleanSearch = (search == null || search.trim().isEmpty()) ? null : search.trim();
        String cleanEstado = (estadoLaboral == null || estadoLaboral.trim().isEmpty()) ? null : estadoLaboral.trim().toUpperCase();
        String cleanEducacion = (nivelEducativo == null || nivelEducativo.trim().isEmpty()) ? null : nivelEducativo.trim();

        java.time.LocalDate minNacimiento = null;
        java.time.LocalDate maxNacimiento = null;
        if (rangoEdad != null && !rangoEdad.trim().isEmpty()) {
            java.time.LocalDate today = java.time.LocalDate.now();
            switch (rangoEdad.trim()) {
                case "18-25":
                    maxNacimiento = today.minusYears(18);
                    minNacimiento = today.minusYears(26).plusDays(1);
                    break;
                case "26-35":
                    maxNacimiento = today.minusYears(26);
                    minNacimiento = today.minusYears(36).plusDays(1);
                    break;
                case "36-45":
                    maxNacimiento = today.minusYears(36);
                    minNacimiento = today.minusYears(46).plusDays(1);
                    break;
                case "46+":
                    maxNacimiento = today.minusYears(46);
                    break;
            }
        }

        return ciudadanoRepository.buscarCiudadanosConFiltroYPagina(
                cleanSearch, rubroId, cleanEstado, barrioId, cudDiscapacidad, cleanEducacion, minNacimiento, maxNacimiento, pageable);
    }

    public Optional<Ciudadano> obtenerPorId(Integer id) {
        return ciudadanoRepository.findById(id).filter(Ciudadano::getActivo);
    }

    @Transactional
    public void bajaLogica(Integer id) {
        logger.info("Iniciando proceso de baja lógica para el postulante ID: {}", id);
        Ciudadano ciudadano = ciudadanoRepository.findById(id)
                .orElseThrow(() -> {
                    logger.warn("Baja lógica fallida: Postulante con ID {} no existe.", id);
                    return new ResourceNotFoundException("Ciudadano no encontrado con id: " + id);
                });
        ciudadano.setActivo(false);
        ciudadano.setDeletedAt(LocalDateTime.now());
        ciudadanoRepository.save(ciudadano);
        logger.info("Baja lógica aplicada correctamente para el postulante ID: {}", id);
    }

    @Transactional
    public void actualizarAdminFeedback(Integer id, Integer calificacion, String notasPrivadas) {
        logger.info("Actualizando feedback administrativo para ciudadano ID: {}", id);
        Ciudadano ciudadano = ciudadanoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ciudadano no encontrado con id: " + id));
        if (calificacion != null) {
            ciudadano.setCalificacion(calificacion);
        }
        ciudadano.setNotasPrivadas(notasPrivadas);
        ciudadanoRepository.save(ciudadano);
        logger.info("Feedback administrativo actualizado con éxito para ciudadano ID: {}", id);
    }

    public boolean isDniInactive(String dni) {
        if (dni == null || dni.trim().isEmpty()) return false;
        return ciudadanoRepository.findByDni(dni)
                .map(c -> !c.getActivo())
                .orElse(false);
    }

    public boolean isCuilInactive(String cuil) {
        if (cuil == null || cuil.trim().isEmpty()) return false;
        return ciudadanoRepository.findByCuil(cuil)
                .map(c -> !c.getActivo())
                .orElse(false);
    }

    @Transactional
    public Ciudadano restaurar(Integer id) {
        logger.info("Iniciando proceso de restauración para el postulante ID: {}", id);
        Ciudadano ciudadano = ciudadanoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ciudadano no encontrado con id: " + id));
        if (ciudadano.getActivo()) {
            logger.warn("El postulante ID {} ya se encuentra activo.", id);
            return ciudadano;
        }
        // Validar si existe otro ciudadano activo con el mismo DNI o CUIL
        Optional<Ciudadano> existingDni = ciudadanoRepository.findByDni(ciudadano.getDni());
        if (existingDni.isPresent() && existingDni.get().getActivo() && !existingDni.get().getId().equals(id)) {
            throw new DatabaseConflictException("No se puede restaurar. Ya existe un ciudadano activo registrado con el DNI: " + ciudadano.getDni());
        }
        Optional<Ciudadano> existingCuil = ciudadanoRepository.findByCuil(ciudadano.getCuil());
        if (existingCuil.isPresent() && existingCuil.get().getActivo() && !existingCuil.get().getId().equals(id)) {
            throw new DatabaseConflictException("No se puede restaurar. Ya existe un ciudadano activo registrado con el CUIL: " + ciudadano.getCuil());
        }

        ciudadano.setActivo(true);
        ciudadano.setDeletedAt(null);
        Ciudadano restaurado = ciudadanoRepository.save(ciudadano);
        logger.info("Postulante ID {} restaurado correctamente.", id);
        return restaurado;
    }

    public List<Ciudadano> buscarInactivosConFiltro(
            String search, Integer rubroId,
            Integer barrioId, Boolean cudDiscapacidad, String nivelEducativo, String rangoEdad) {
        String cleanSearch = (search == null || search.trim().isEmpty()) ? null : search.trim();
        String cleanEducacion = (nivelEducativo == null || nivelEducativo.trim().isEmpty()) ? null : nivelEducativo.trim();

        java.time.LocalDate minNacimiento = null;
        java.time.LocalDate maxNacimiento = null;
        if (rangoEdad != null && !rangoEdad.trim().isEmpty()) {
            java.time.LocalDate today = java.time.LocalDate.now();
            switch (rangoEdad.trim()) {
                case "18-25":
                    maxNacimiento = today.minusYears(18);
                    minNacimiento = today.minusYears(26).plusDays(1);
                    break;
                case "26-35":
                    maxNacimiento = today.minusYears(26);
                    minNacimiento = today.minusYears(36).plusDays(1);
                    break;
                case "36-45":
                    maxNacimiento = today.minusYears(36);
                    minNacimiento = today.minusYears(46).plusDays(1);
                    break;
                case "46+":
                    maxNacimiento = today.minusYears(46);
                    break;
            }
        }

        return ciudadanoRepository.buscarCiudadanosInactivosConFiltro(
                cleanSearch, rubroId, barrioId, cudDiscapacidad, cleanEducacion, minNacimiento, maxNacimiento);
    }

    public Page<Ciudadano> buscarInactivosConFiltroYPagina(
            String search, Integer rubroId,
            Integer barrioId, Boolean cudDiscapacidad, String nivelEducativo, String rangoEdad,
            int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").descending());
        String cleanSearch = (search == null || search.trim().isEmpty()) ? null : search.trim();
        String cleanEducacion = (nivelEducativo == null || nivelEducativo.trim().isEmpty()) ? null : nivelEducativo.trim();

        java.time.LocalDate minNacimiento = null;
        java.time.LocalDate maxNacimiento = null;
        if (rangoEdad != null && !rangoEdad.trim().isEmpty()) {
            java.time.LocalDate today = java.time.LocalDate.now();
            switch (rangoEdad.trim()) {
                case "18-25":
                    maxNacimiento = today.minusYears(18);
                    minNacimiento = today.minusYears(26).plusDays(1);
                    break;
                case "26-35":
                    maxNacimiento = today.minusYears(26);
                    minNacimiento = today.minusYears(36).plusDays(1);
                    break;
                case "36-45":
                    maxNacimiento = today.minusYears(36);
                    minNacimiento = today.minusYears(46).plusDays(1);
                    break;
                case "46+":
                    maxNacimiento = today.minusYears(46);
                    break;
            }
        }

        return ciudadanoRepository.buscarCiudadanosInactivosConFiltroYPagina(
                cleanSearch, rubroId, barrioId, cudDiscapacidad, cleanEducacion, minNacimiento, maxNacimiento, pageable);
    }

    private String maskDni(String dni) {
        if (dni == null || dni.trim().isEmpty()) return "N/A";
        String clean = dni.trim();
        if (clean.length() <= 4) return "****";
        return "****" + clean.substring(clean.length() - 4);
    }

    private String maskCuil(String cuil) {
        if (cuil == null || cuil.trim().isEmpty()) return "N/A";
        String clean = cuil.trim();
        if (clean.length() <= 4) return "***********";
        return "******" + clean.substring(clean.length() - 4);
    }
}