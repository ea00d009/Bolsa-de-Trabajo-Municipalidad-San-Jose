package com.sanjose.bolsatrabajo.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "rubros")
public class Rubro {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 100)
    private String nombre;

    private Boolean activo = true;

    // --- CONSTRUCTORES ---
    public Rubro() {}

    public Rubro(Integer id) {
        this.id = id;
    }

    public Rubro(String nombre) {
        this.nombre = nombre;
    }

    // --- GETTERS Y SETTERS ---
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }
}
