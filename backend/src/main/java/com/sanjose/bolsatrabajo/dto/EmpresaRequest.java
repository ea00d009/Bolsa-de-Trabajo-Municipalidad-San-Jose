package com.sanjose.bolsatrabajo.dto;

import java.time.LocalDate;

/**
 * Datos que envía el frontend para dar de alta o editar una empresa.
 * Los catálogos (rubro, barrio) llegan como ids.
 */
public class EmpresaRequest {

    private String razonSocial;
    private String nombreFantasia;
    private String cuit;
    private Integer rubroId;
    private String actividadPrincipal;
    private String cantidadEmpleados;

    private String direccion;
    private Integer barrioId;
    private String localidad;

    private String contactoNombre;
    private String contactoCargo;
    private String telefono;
    private String telefonoSecundario;
    private String email;
    private String sitioWeb;

    private String interesIncorporar;
    private String perfilesDemandados;
    private Boolean interesProgramasEmpleo;
    private LocalDate fechaRelevamiento;
    private String observaciones;

    public String getRazonSocial() { return razonSocial; }
    public void setRazonSocial(String razonSocial) { this.razonSocial = razonSocial; }

    public String getNombreFantasia() { return nombreFantasia; }
    public void setNombreFantasia(String nombreFantasia) { this.nombreFantasia = nombreFantasia; }

    public String getCuit() { return cuit; }
    public void setCuit(String cuit) { this.cuit = cuit; }

    public Integer getRubroId() { return rubroId; }
    public void setRubroId(Integer rubroId) { this.rubroId = rubroId; }

    public String getActividadPrincipal() { return actividadPrincipal; }
    public void setActividadPrincipal(String actividadPrincipal) { this.actividadPrincipal = actividadPrincipal; }

    public String getCantidadEmpleados() { return cantidadEmpleados; }
    public void setCantidadEmpleados(String cantidadEmpleados) { this.cantidadEmpleados = cantidadEmpleados; }

    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }

    public Integer getBarrioId() { return barrioId; }
    public void setBarrioId(Integer barrioId) { this.barrioId = barrioId; }

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

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
}
