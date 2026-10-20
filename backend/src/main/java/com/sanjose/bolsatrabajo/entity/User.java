package com.sanjose.bolsatrabajo.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "personal")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // Cambiamos el nombre de la variable a 'username'
    // Pero mantenemos @Column(name = "usuario") para que en MySQL busque la columna 'usuario'
    @Column(name = "usuario")
    private String username;

    // Cambiamos a 'password' para que el repositorio no falle
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(name = "password_hash")
    private String password;

    @Column(name = "rol")
    private String role;

    @Column(name = "nombre_completo")
    private String nombreCompleto;

    @Column(name = "activo")
    private Boolean activo;

    @Column(name = "ultimo_acceso")
    private String ultimoAcceso;

    @Column(name = "deleted_at")
    private java.time.LocalDateTime deletedAt;

    // Getters y Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getNombreCompleto() { return nombreCompleto; }
    public void setNombreCompleto(String nombreCompleto) { this.nombreCompleto = nombreCompleto; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }

    public String getUltimoAcceso() { return ultimoAcceso; }
    public void setUltimoAcceso(String ultimoAcceso) { this.ultimoAcceso = ultimoAcceso; }

    public java.time.LocalDateTime getDeletedAt() { return deletedAt; }
    public void setDeletedAt(java.time.LocalDateTime deletedAt) { this.deletedAt = deletedAt; }
}