# Bolsa de Trabajo - Oficina de Empleo San José 🏢

Este proyecto constituye el **Trabajo Final** para la **Tecnicatura Universitaria en Programación (TUP)** de la **Facultad Regional Concepción del Uruguay - Universidad Tecnológica Nacional (FRCU UTN)**. 

Se trata de un sistema integral diseñado para la gestión de la Oficina de Empleo de la Municipalidad de la ciudad de San José, permitiendo administrar postulantes, empresas, vacantes, derivaciones laborales y capacitaciones profesionales.

---

## 👥 Integrantes del Grupo
* **Alvarez, Fabricio**
* **Quiroga, Agustin**
* **Ramirez, Emanuel**

---

## 🚀 Características Técnicas y Arquitectura del Sistema

El sistema implementa una arquitectura desacoplada de Cliente-Servidor estructurada de la siguiente manera:

```mermaid
graph TD
    A[Frontend: React + TypeScript] -->|Peticiones HTTPS Relativas| B[Servidor Proxy: Vite]
    B -->|Proxy local:8080/api| C[Backend: Spring Boot]
    C -->|Spring Data JPA| D[(Database: MySQL)]
```

### 1. Backend (Spring Boot)
* **Paquete Base Refacturado:** Toda la estructura de clases del backend ha sido refactorada desde el genérico `com.tuempresa.proyecto` al paquete corporativo representativo del municipio: `com.sanjose.bolsatrabajo`.
* **Motor de Inyección:** Spring Boot 3.4.5 con soporte nativo para Java 21 hasta Java 25.
* **Persistencia y Acceso a Datos:** Spring Data JPA con Hibernate, implementando mapeo objeto-relacional (ORM), transaccionalidad robusta y políticas de borrado lógico (*Soft Delete*) en entidades principales para mantener la integridad histórica.
* **Seguridad y Control de Acceso:** Implementado mediante Spring Security y tokens estructurados firmados criptográficamente (JWT).

### 2. Frontend (React)
* **Framework:** React 19 ejecutado sobre Vite 8 como empaquetador y TypeScript para garantizar la tipicidad estricta.
* **Componentización:** Vanilla CSS utilizando variables HSL y temas personalizados (Modo Claro / Oscuro) con transiciones suaves de color.
* **Generación de Reportes:** Integración de `html2pdf.js` para compilar y generar archivos PDF del currículum de postulantes en formato estándar A4.

---

## 📊 Diagrama Entidad-Relación (DER) del Sistema

La estructura relacional de la base de datos se detalla en el siguiente modelo de relaciones físicas:

```mermaid
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'primaryColor': '#6366f1',
    'primaryTextColor': '#ffffff',
    'primaryBorderColor': '#4338ca',
    'lineColor': '#f43f5e',
    'textColor': '#1e293b',
    'mainBkg': '#6366f1',
    'attributeBackgroundColor': '#f8fafc',
    'attributeBorderColor': '#cbd5e1'
  }
}}%%
erDiagram
    barrios {
        int id PK
        varchar nombre
        boolean activo
    }
    rubros {
        int id PK
        varchar nombre
        boolean activo
    }
    cursos_ofrecidos {
        int id PK
        varchar nombre_curso
        varchar institucion
        varchar estado
        boolean activo
    }
    personal {
        int id PK
        varchar usuario
        varchar password_hash
        varchar nombre_completo
        enum rol
        datetime ultimo_acceso
        boolean activo
        datetime deleted_at
    }
    ciudadanos {
        int id PK
        varchar dni UK
        varchar cuil UK
        varchar apellido
        varchar nombre
        date fecha_nacimiento
        enum genero
        int id_barrio FK
        varchar direccion
        varchar telefono_primario
        varchar telefono_secundario
        varchar email
        varchar estado_civil
        int hijos_a_cargo
        boolean cud_discapacidad
        varchar tipo_discapacidad
        date cud_vencimiento
        boolean movilidad_propia
        varchar licencia_conducir
        varchar cv_url
        varchar tipo_empleo_buscado
        boolean tiene_obra_social
        varchar plan_social_activo
        text observaciones_generales
        varchar habilidades
        datetime fecha_registro
        enum estado_laboral
        boolean activo
        datetime deleted_at
    }
    educacion {
        int id PK
        int id_ciudadano FK
        varchar nivel_alcanzado
        varchar titulo_obtenido
        varchar institucion
        boolean finalizado
        int anio_ultimo_aprobado
        boolean activo
    }
    experiencia_laboral {
        int id PK
        int id_ciudadano FK
        varchar empresa
        varchar puesto
        date fecha_inicio
        date fecha_fin
        boolean actualmente_trabajando
        text tareas_realizadas
        boolean activo
    }
    ciudadano_rubros {
        int id_ciudadano PK,FK
        int id_rubro PK,FK
    }
    capacitaciones_ciudadano {
        int id PK
        int id_ciudadano FK
        int id_curso FK
        date fecha_inscripcion
        date fecha_finalizacion
        enum estado_asistencia
        varchar observaciones_rendimiento
        varchar certificado_url
        boolean activo
        datetime deleted_at
    }
    empresas {
        int id PK
        varchar razon_social
        varchar nombre_fantasia
        varchar cuit UK
        int id_rubro FK
        varchar actividad_principal
        varchar cantidad_empleados
        varchar direccion
        int id_barrio FK
        varchar localidad
        varchar contacto_nombre
        varchar contacto_cargo
        varchar telefono
        varchar telefono_secundario
        varchar email
        varchar sitio_web
        varchar interes_incorporar
        text perfiles_demandados
        boolean interes_programas_empleo
        date fecha_relevamiento
        int id_personal_relevo FK
        text observaciones
        datetime fecha_registro
        boolean activo
        datetime deleted_at
    }
    vacantes_laborales {
        int id PK
        int id_empresa FK
        varchar puesto_nombre
        int id_rubro FK
        text descripcion_puesto
        varchar requisitos_educativos
        int rango_etario_min
        int rango_etario_max
        enum estado
        datetime fecha_publicacion
        boolean activo
    }
    entrevistas {
        int id PK
        int id_ciudadano FK
        int id_personal FK
        datetime fecha_entrevista
        varchar objetivo_consulta
        text observaciones_tecnicas
        varchar prioridad_insercion
        varchar estado_tramite
        boolean activo
    }
    derivaciones {
        int id PK
        int id_ciudadano FK
        int id_vacante FK
        int id_personal_deriva FK
        datetime fecha_derivacion
        enum resultado
        boolean activo
    }
    logs_sistema {
        int id PK
        int id_personal FK
        enum tipo_evento
        varchar accion
        varchar tabla_afectada
        datetime fecha
        varchar ip_origen
    }

    ciudadanos }o--|| barrios : "pertenece_a"
    educacion }o--|| ciudadanos : "pertenece_a"
    experiencia_laboral }o--|| ciudadanos : "registrada_para"
    ciudadano_rubros }o--|| ciudadanos : "asociado_a"
    ciudadano_rubros }o--|| rubros : "clasifica_en"
    capacitaciones_ciudadano }o--|| ciudadanos : "inscrito_en"
    capacitaciones_ciudadano }o--|| cursos_ofrecidos : "ofrecido_como"
    vacantes_laborales }o--|| empresas : "pertenece_a"
    empresas }o--o| rubros : "clasificada_en"
    empresas }o--o| barrios : "ubicada_en"
    empresas }o--o| personal : "relevada_por"
    vacantes_laborales }o--|| rubros : "pertenece_a"
    entrevistas }o--|| ciudadanos : "realizada_a"
    entrevistas }o--|| personal : "entrevistador"
    derivaciones }o--|| ciudadanos : "derivado_a"
    derivaciones }o--|| vacantes_laborales : "vacante_destino"
    derivaciones }o--|| personal : "personal_que_deriva"
    logs_sistema }o--|| personal : "realizado_por"
```

---

## 🛡️ Arquitectura y Características de Seguridad (Security Hardening)

El sistema implementa medidas avanzadas de seguridad a nivel de código, de infraestructura y de base de datos, estructuradas y remediadas en base a auditorías exhaustivas de vulnerabilidades:

### 1. Gestión de Sesión y Autenticación Criptográfica (JWT + Cookies)
* **Cookies HttpOnly de Sesión Segura (SameSite=Lax) [SEC-05, SEC-10, SEC-11]:** Las credenciales de sesión (tokens JWT) se almacenan exclusivamente en cookies del navegador marcadas con las propiedades `HttpOnly` y `SameSite=Lax`. Esto garantiza que los scripts del frontend (JavaScript) no tengan acceso al token en memoria, anulando ataques de robo de sesión a través de Scripting en Sitios Cruzados (XSS) e impidiendo el envío no intencionado en peticiones externas (mitigación CSRF).
* **Remoción del Token en Cuerpo de Respuesta [SEC-17]:** Al iniciar sesión con éxito, el servidor responde únicamente con la información básica del perfil del usuario (nombre, rol y usuario) y establece la cookie JWT de sesión de forma transparente, eliminando toda persistencia local del token en el cliente.
* **Filtros JWT Desacoplados:** El componente [JwtFilter.java](file:///c:/Users/alvar/OneDrive/Documentos/GitHub/backend/src/main/java/com/sanjose/bolsatrabajo/filter/JwtFilter.java) analiza de manera automática tanto las cabeceras HTTP como las cookies de red para autenticar peticiones sin requerir código intrusivo.

### 2. Control de Acceso y Hardening de Endpoints
* **Control de Acceso Basado en Roles (RBAC) [SEC-06]:** Configurado centralmente en [SecurityConfig.java](file:///c:/Users/alvar/OneDrive/Documentos/GitHub/backend/src/main/java/com/sanjose/bolsatrabajo/config/SecurityConfig.java). Los accesos a estadísticas avanzadas y gestión de personal están restringidos únicamente a cuentas con rol `SuperAdmin`.
* **Permisos Granulares en Catálogos:** Las lecturas de zonas/rubros están abiertas a roles de `Entrevistador`, mientras que las escrituras y modificaciones están protegidas exclusivamente para `SuperAdmin`.
* **Desactivación Inmediata de Acceso [SEC-16]:** El servicio [UserDetailsServiceImpl.java](file:///c:/Users/alvar/OneDrive/Documentos/GitHub/backend/src/main/java/com/sanjose/bolsatrabajo/service/UserDetailsServiceImpl.java) comprueba en cada autenticación si la cuenta del personal posee el estado activo (`activo = true`) y no cuenta con registros de eliminación (`deletedAt == null`), interrumpiendo sesiones abiertas de forma instantánea si el administrador suspende al operario.

### 3. Protección de Datos y Cuentas (Hardening de Entrada)
* **Políticas de Complejidad de Contraseñas [SEC-14]:** Los endpoints de alta y modificación de claves en [UserController.java](file:///c:/Users/alvar/OneDrive/Documentos/GitHub/backend/src/main/java/com/sanjose/bolsatrabajo/controller/UserController.java) exigen requisitos estrictos de contraseña (longitud mínima de 8 caracteres, al menos una mayúscula, un número y un carácter especial).
* **Limitación de Intentos (Rate Limiting) [SEC-13]:** Implementado en el login un sistema de bloqueo por IP que bloquea las solicitudes durante 15 minutos tras 5 intentos fallidos consecutivos, previniendo ataques de fuerza bruta o diccionario.
* **Lista Blanca de Roles [SEC-15]:** Validación forzada contra un listado estático preaprobado en el backend antes de asignar un rol a un operador, previniendo la escalada de privilegios por inyección de roles no válidos.

### 4. Privacidad de Datos de Postulantes (PII & Archivos)
* **Enmascaramiento de Datos Sensibles (Logs) [SEC-18]:** El servicio [CiudadanoService.java](file:///c:/Users/alvar/OneDrive/Documentos/GitHub/backend/src/main/java/com/sanjose/bolsatrabajo/service/CiudadanoService.java) ofusca información de identificación personal (DNI y CUIL) en los logs del servidor (ej: `****5678`), evitando fugas de PII en auditorías de infraestructura.
* **Restricción de Serialización de Contraseñas [SEC-04]:** Uso de anotaciones Jackson para definir el hash de la clave de usuario como propiedad únicamente de escritura (`Access.WRITE_ONLY`), evitando su exposición en payloads JSON de lectura.
* **Validación de Carga de Archivos (Foto) [SEC-20]:** El campo fotografía es controlado para impedir ataques de denegación de servicio (DoS) por inyección de payloads de gran tamaño, validando cabeceras de tipo MIME de imagen (`data:image/`) y limitando el tamaño en Base64 a un máximo de 2 MB.

### 5. Configuración e Infraestructura Segura
* **Externalización de Credenciales y Secretos [SEC-08, SEC-09, SEC-02]:** Separación completa de secretos de base de datos y llaves de firma JWT en propiedades externas del entorno, requiriendo el uso de variables de entorno y eliminando contraseñas por defecto (como `admin`) del código fuente.
* **Perfiles Locales y GitIgnore Seguro [SEC-19]:** Configuración de [.gitignore](file:///c:/Users/alvar/OneDrive/Documentos/GitHub/.gitignore) estructurada para excluir de forma robusta dependencias locales (`node_modules/`), variables de entorno locales (`.env*`), propiedades del sistema de base de datos y archivos de logs del servidor.

---

## ⚙️ Parámetros de Configuración y Variables de Entorno

El backend lee variables críticas de entorno o configuraciones del archivo [application.properties](file:///c:/Users/alvar/OneDrive/Documentos/GitHub/backend/src/main/resources/application.properties):

| Propiedad / Variable de Entorno | Propósito | Configuración Local / Recomendada |
| :--- | :--- | :--- |
| `spring.datasource.url` | Dirección JDBC de conexión de base de datos | `jdbc:mysql://localhost:3306/oficina_empleo_sanjose` |
| `spring.datasource.username` | Usuario de la base de datos | `<TU_USUARIO_MYSQL>` |
| `spring.datasource.password` | Contraseña de la base de datos | `<TU_CONTRASEÑA_MYSQL>` |
| `app.security.jwt.secret` | Clave secreta para firmar tokens JWT (env: `JWT_SECRET`) | `<TU_SECRETO_JWT_SEGURO>` |
| `app.security.superadmin.password`| Contraseña del superadmin inicial (env: `SUPERADMIN_PASSWORD`)| Generada aleatoriamente si no se provee |
| `app.security.cors.allowed-origins`| Origen de peticiones frontend (env: `ALLOWED_ORIGINS`) | `http://localhost:5173` |

---

## ⚡ Puesta en marcha rápida en una PC nueva (Sin nada instalado)

Si clonás este repositorio en una computadora limpia (sin Java, sin Node.js, sin MySQL):

### Opción A — Con Antigravity (La más fácil 🤖)
1. Abrí esta carpeta del proyecto en **Antigravity**.
2. Escribile en el chat:
   > *"Hola, acabo de clonar este proyecto en esta máquina limpia. Ejecutá el script de instalación automática y dejá corriendo el backend y el frontend."*
3. Antigravity detectará el sistema operativo, ejecutará los instaladores desatendidos vía `winget`, configurará el entorno e iniciará los servicios por vos.

### Opción B — Script Automático para Windows (1 Clic)
1. Hacé doble clic en **`setup.bat`** (o ejecutá `powershell ./scripts/setup-windows.ps1`).
   * Instala automáticamente **Node.js LTS** y **Microsoft OpenJDK 21** vía `winget`.
   * Inicializa la configuración de base de datos y crea `backend/.env`.
   * Ejecuta `npm install` en el frontend.
2. Para iniciar todo el sistema: hacé doble clic en **`iniciar.bat`**.
   * Levanta el Backend en puerto 8080 y el Frontend en puerto 5173.
   * Abre automáticamente el navegador en [http://localhost:5173](http://localhost:5173).

### Opción C — Con Docker Desktop (100% Aislado y Portátil)
Si la máquina tiene **Docker Desktop**:
```bash
docker compose up -d --build
```
* Levanta MySQL 8.0 (con la base de datos importada automáticamente desde `database/BD_oficinadeempleo.sql`).
* Levanta el Backend Spring Boot en el puerto 8080.
* Levanta el Frontend React en el puerto 5173 / 80.
* No requiere instalar Java, Node ni MySQL en la computadora host.

---

## 🛠️ Requisitos e Instalación Manual del Proyecto

### Requisitos Previos
* **Java 21+** (Compatible y verificado en JDK 25)
* **Node.js 20+**
* **MySQL 8.0+**
* **Maven 3.9+** (o el wrapper `mvnw` incluido)

### 1. Configuración de Base de Datos
1. Crea la base de datos local `oficina_empleo_sanjose`.
2. Ejecuta el script SQL [BD_oficinadeempleo.sql](file:///c:/Users/alvar/OneDrive/Documentos/GitHub/database/BD_oficinadeempleo.sql) para inicializar las tablas maestros e integridad referencial.
3. *(Opcional)* Si requieres migrar planillas previas o corregir codificaciones UTF-8 en datos heredados, puedes ejecutar los scripts del directorio `database`:
   * [import_excel.py](file:///c:/Users/alvar/OneDrive/Documentos/GitHub/database/import_excel.py)
   * [fix_db_encoding.py](file:///c:/Users/alvar/OneDrive/Documentos/GitHub/database/fix_db_encoding.py)

### 2. Despliegue del Servidor Backend
1. Ubícate en el directorio `backend/`.
2. Compila el código del proyecto y corre las pruebas unitarias:
   ```bash
   # En Windows:
   .\mvnw clean test
   
   # En Linux/Mac:
   ./mvnw clean test
   ```
   > [!IMPORTANT]
   > Si ejecutas las pruebas utilizando Java 25+, se requiere el argumento JVM de habilitación de agentes dinámicos de Mockito, el cual está configurado automáticamente en el [pom.xml](file:///c:/Users/alvar/OneDrive/Documentos/GitHub/backend/pom.xml) bajo la directiva `<argLine>-XX:+EnableDynamicAgentLoading</argLine>`.
3. Inicia el servidor Spring Boot en puerto `8080`:
   ```bash
   .\mvnw spring-boot:run
   ```

### 3. Despliegue del Cliente Frontend
1. Accede a la carpeta `frontend/`.
2. Instala los paquetes y dependencias del sistema:
   ```bash
   npm install
   ```
3. Ejecuta el servidor local de desarrollo en puerto `5173`:
   ```bash
   npm run dev
   ```
4. Abre [http://localhost:5173](http://localhost:5173) en tu navegador e inicia sesión con el usuario `superadmin`.

