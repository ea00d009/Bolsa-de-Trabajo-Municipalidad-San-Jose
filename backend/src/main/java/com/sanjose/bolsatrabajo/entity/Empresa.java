package com.sanjose.bolsatrabajo.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Empresa relevada por la Oficina de Empleo.
 * Es sólo una ficha de datos para el relevamiento: las empresas NO tienen
 * acceso al sistema. Mapea la tabla "empresas" (BD_oficinadeempleo.sql).
 * Usa borrado lógico (activo = false + deleted_at).
 */
@Entity
@Table(name = "empresas")
public class Empresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // --- IDENTIFICACIÓN ---
    @Column(name = "razon_social", nullable = false, length = 200)
    private String razonSocial;

    @Column(name = "nombre_fantasia", length = 150)
    private String nombreFantasia;

    @Column(unique = true, length = 20)
    private String cuit;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_rubro")
    private Rubro rubro;

    @Column(name = "actividad_principal", length = 255)
    private String actividadPrincipal;

    /** Rango de dotación: 1-5, 6-10, 11-50, 51-200, +200 */
    @Column(name = "cantidad_empleados", length = 20)
    private String cantidadEmpleados;

    // --- UBICACIÓN ---
    @Column(length = 255)
    private String direccion;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_barrio")
    private Barrio barrio;

    @Column(length = 100)
    private String localidad;

    // --- CONTACTO ---
    @Column(name = "contacto_nombre", length = 100)
    private String contactoNombre;

    @Column(name = "contacto_cargo", length = 100)
    private String contactoCargo;

    @Column(length = 50)
    private String telefono;

    @Column(name = "telefono_secundario", length = 50)
    private String telefonoSecundario;

    @Column(length = 150)
    private String email;

    @Column(name = "sitio_web", length = 255)
    private String sitioWeb;

    // --- RELEVAMIENTO ---
    /** SI, NO, A_FUTURO, SIN_DATO */
    @Column(name = "interes_incorporar", length = 20)
    private String interesIncorporar;

    @Column(name = "perfiles_demandados", columnDefinition = "TEXT")
    private String perfilesDemandados;

    @Column(name = "interes_programas_empleo")
    private Boolean interesProgramasEmpleo = false;

    @Column(name = "fecha_relevamiento")
    private LocalDate fechaRelevamiento;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "id_personal_relevo")
    private User relevadoPor;

    @Column(columnDefinition = "TEXT")
    private String observaciones;

    // --- CONTROL ---
    @Column(name = "fecha_registro")
    private LocalDateTime fechaRegistro;

    private Boolean activo = true;

    @JsonIgnore
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // --- CONSTRUCTORES ---
    public Empresa() {}

    public Empresa(Integer id) {
        this.id = id;
    }

    /** Expone sólo el nombre del entrevistador (no el usuario completo). */
    public String getRelevadoPorNombre() {
        return relevadoPor != null ? relevadoPor.getNombreCompleto() : null;
    }

    // --- GETTERS Y SETTERS ---
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getRazonSocial() { return razonSocial; }
    public void setRazonSocial(String razonSocial) { this.razonSocial = razonSocial; }

    public String getNombreFantasia() { return nombreFantasia; }
    public void setNombreFantasia(String nombreFantasia) { this.nombreFantasia = nombreFantasia; }

    public String getCuit() { return cuit; }
    public void setCuit(String cuit) { this.cuit = cuit; }

    public Rubro getRubro() { return rubro; }
    public void setRubro(Rubro rubro) { this.rubro = rubro; }

    public String getActividadPrincipal() { return actividadPrincipal; }
    public void setActividadPrincipal(String actividadPrincipal) { this.actividadPrincipal = actividadPrincipal; }

    public String getCantidadEmpleados() { return cantidadEmpleados; }
    public void setCantidadEmpleados(String cantidadEmpleados) { this.cantidadEmpleados = cantidadEmpleados; }

    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }

    public Barrio getBarrio() { return barrio; }
    public void setBarrio(Barrio barrio) { this.barrio = barrio; }

    public String getLocalidad() { return localidad; }
    public void setLocalidad(String localidad) { this.localidad = localidad; }

    public String getContactoNombre() { return contactoNombre; }
    public void setContactoNombre(String contactoNombre) { this.contactoNombre = contactoNombre; }

    public String getContactoCargo() { return contactoCargo; }
    public void setContactoCargo(String contactoCargo) { this.contactoCargo = contactoCargo; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getTelefonoSecundario() { return telefonoSecundario; }
    public void setTelefonoSecundario(String telefonoSecundario) { this.telefonoSecundario = telefonoSecundario; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getSitioWeb() { return sitioWeb; }
    public void setSitioWeb(String sitioWeb) { this.sitioWeb = sitioWeb; }

    public String getInteresIncorporar() { return interesIncorporar; }
    public void setInteresIncorporar(String interesIncorporar) { this.interesIncorporar = interesIncorporar; }

    public String getPerfilesDemandados() { return perfilesDemandados; }
    public void setPerfilesDemandados(String perfilesDemandados) { this.perfilesDemandados = perfilesDemandados; }

    public Boolean getInteresProgramasEmpleo() { return interesProgramasEmpleo; }
    public void setInteresProgramasEmpleo(Boolean interesProgramasEmpleo) { this.interesProgramasEmpleo = interesProgramasEmpleo; }

    public LocalDate getFechaRelevamiento() { return fechaRelevamiento; }
    public void setFechaRelevamiento(LocalDate fechaRelevamiento) { this.fechaRelevamiento = fechaRelevamiento; }

    public User getRelevadoPor() { return relevadoPor; }
    public void setRelevadoPor(User relevadoPor) { this.relevadoPor = relevadoPor; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public LocalDateTime getFechaRegistro() { return fechaRegistro; }
    public void setFechaRegistro(LocalDateTime fechaRegistro) { this.fechaRegistro = fechaRegistro; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }

    public LocalDateTime getDeletedAt() { return deletedAt; }
    public void setDeletedAt(LocalDateTime deletedAt) { this.deletedAt = deletedAt; }
}
