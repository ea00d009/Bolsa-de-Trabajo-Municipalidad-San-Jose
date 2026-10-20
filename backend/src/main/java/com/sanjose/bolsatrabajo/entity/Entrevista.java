package com.sanjose.bolsatrabajo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "entrevistas")
public class Entrevista {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_ciudadano", nullable = false)
    @JsonIgnore
    private Ciudadano ciudadano;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_personal", nullable = false)
    private User personal;

    @Column(name = "fecha_entrevista", nullable = false)
    private LocalDateTime fechaEntrevista;

    @Column(name = "objetivo_consulta")
    private String objetivoConsulta = "Registro inicial";

    @Column(name = "observaciones_tecnicas", columnDefinition = "TEXT")
    private String observacionesTecnicas = "Agregado por sistema";

    @Column(name = "prioridad_insercion")
    private String prioridadInsercion = "MEDIA";

    @Column(name = "estado_tramite")
    private String estadoTramite = "PENDIENTE";

    private Boolean activo = true;

    // Constructores
    public Entrevista() {}

    // Getters y Setters
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Ciudadano getCiudadano() {
        return ciudadano;
    }

    public void setCiudadano(Ciudadano ciudadano) {
        this.ciudadano = ciudadano;
    }

    public User getPersonal() {
        return personal;
    }

    public void setPersonal(User personal) {
        this.personal = personal;
    }

    public LocalDateTime getFechaEntrevista() {
        return fechaEntrevista;
    }

    public void setFechaEntrevista(LocalDateTime fechaEntrevista) {
        this.fechaEntrevista = fechaEntrevista;
    }

    public String getObjetivoConsulta() {
        return objetivoConsulta;
    }

    public void setObjetivoConsulta(String objetivoConsulta) {
        this.objetivoConsulta = objetivoConsulta;
    }

    public String getObservacionesTecnicas() {
        return observacionesTecnicas;
    }

    public void setObservacionesTecnicas(String observacionesTecnicas) {
        this.observacionesTecnicas = observacionesTecnicas;
    }

    public String getPrioridadInsercion() {
        return prioridadInsercion;
    }

    public void setPrioridadInsercion(String prioridadInsercion) {
        this.prioridadInsercion = prioridadInsercion;
    }

    public String getEstadoTramite() {
        return estadoTramite;
    }

    public void setEstadoTramite(String estadoTramite) {
        this.estadoTramite = estadoTramite;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }
}
