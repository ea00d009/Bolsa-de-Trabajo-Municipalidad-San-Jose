package com.sanjose.bolsatrabajo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "experiencia_laboral")
public class ExperienciaLaboral {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "id_ciudadano", nullable = false)
    @JsonIgnore
    private Ciudadano ciudadano;

    @Column(nullable = false, length = 150)
    private String empresa;

    @Column(nullable = false, length = 150)
    private String puesto;

    @Column(name = "fecha_inicio")
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin")
    private LocalDate fechaFin;

    @Column(name = "actualmente_trabajando")
    private Boolean actualmenteTrabajando = false;

    @Column(name = "tareas_realizadas", columnDefinition = "TEXT")
    private String tareasRealizadas;

    private Boolean activo = true;

    // Constructores
    public ExperienciaLaboral() {}

    // Getters y Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public Ciudadano getCiudadano() { return ciudadano; }
    public void setCiudadano(Ciudadano ciudadano) { this.ciudadano = ciudadano; }

    public String getEmpresa() { return empresa; }
    public void setEmpresa(String empresa) { this.empresa = empresa; }

    public String getPuesto() { return puesto; }
    public void setPuesto(String puesto) { this.puesto = puesto; }

    public LocalDate getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDate fechaInicio) { this.fechaInicio = fechaInicio; }

    public LocalDate getFechaFin() { return fechaFin; }
    public void setFechaFin(LocalDate fechaFin) { this.fechaFin = fechaFin; }

    public Boolean getCurrentlyWorking() { return actualmenteTrabajando; }
    public void setCurrentlyWorking(Boolean actualmenteTrabajando) { this.actualmenteTrabajando = actualmenteTrabajando; }

    public String getTareasRealizadas() { return tareasRealizadas; }
    public void setTareasRealizadas(String tareasRealizadas) { this.tareasRealizadas = tareasRealizadas; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
}
