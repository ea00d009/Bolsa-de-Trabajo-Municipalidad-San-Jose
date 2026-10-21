import { useState } from 'react';
import {
  BookOpen, Users, Settings, ShieldCheck,
  BarChart3, Database, Search, RefreshCw, ChevronRight, Building2
} from 'lucide-react';

interface ManualSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export default function UserManual() {
  const [activeSection, setActiveSection] = useState('intro');

  const sections: ManualSection[] = [
    {
      id: 'intro',
      title: 'Introducción',
      icon: <BookOpen size={18} />,
      content: (
        <div>
          <h2 style={styles.sectionTitle}>Introducción al Sistema</h2>
          <p style={styles.paragraph}>
            Bienvenido al <strong>Sistema de Gestión de Bolsa de Trabajo</strong> de la Oficina de Empleo Municipal de San José.
            Esta plataforma Full-Stack ha sido diseñada para optimizar, centralizar y digitalizar el registro,
            seguimiento e inserción laboral tanto de los <strong>ciudadanos postulantes</strong> como de las <strong>empresas e instituciones productivas</strong> de la región.
          </p>
          <p style={styles.paragraph}>
            El sistema reemplaza las antiguas planillas de cálculo manuales por una solución web moderna,
            segura y robusta, capaz de procesar cientos de registros históricos con tiempos de carga instantáneos,
            catálogos dinámicos configurables y herramientas avanzadas de análisis estadístico.
          </p>
          <div style={styles.cardInfo}>
            <h4 style={styles.cardInfoTitle}>Propósito Principal</h4>
            <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-main-hex)' }}>
              Facilitar el nexo entre la oferta y la demanda laboral del municipio, brindando a los operarios
              de la oficina una herramienta ágil para perfilar candidatos, relevar empresas con búsquedas activas
              y ofrecer a la coordinación un panel demográfico y productivo en tiempo real para planificar capacitaciones y políticas de empleo.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'roles',
      title: 'Roles y Permisos',
      icon: <ShieldCheck size={18} />,
      content: (
        <div>
          <h2 style={styles.sectionTitle}>Control de Acceso (RBAC)</h2>
          <p style={styles.paragraph}>
            El acceso al sistema está resguardado mediante sesiones seguras con cookies <code>HttpOnly</code> y tokens JWT, dividiéndose en dos perfiles principales:
          </p>

          <div style={styles.grid}>
            <div style={styles.roleCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))' }}>
                  <Users size={20} />
                </div>
                <h3 style={styles.roleTitle}>Entrevistador</h3>
              </div>
              <ul style={styles.bulletList}>
                <li>Registro completo, edición y consulta de postulantes y su CV.</li>
                <li>Cambio rápido de estado laboral desde el listado principal.</li>
                <li>Registro de entrevistas, visitas de seguimiento, notas privadas y calificación.</li>
                <li>Alta, edición y consulta de fichas en el módulo de <strong>Empresas</strong>.</li>
                <li>Consulta de catálogos de rubros, barrios, niveles educativos y estados.</li>
              </ul>
            </div>

            <div style={styles.roleCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'var(--accent-purple-border)', color: 'var(--accent-purple)' }}>
                  <Settings size={20} />
                </div>
                <h3 style={styles.roleTitle}>Super Administrador</h3>
              </div>
              <p style={{ ...styles.paragraph, fontSize: '14px', fontWeight: 600, color: 'var(--accent-purple)', margin: '0 0 8px 0' }}>
                Posee todos los permisos de Entrevistador, sumando:
              </p>
              <ul style={styles.bulletList}>
                <li>Acceso exclusivo al panel integral de <strong>Informes</strong> (métricas de Postulantes y de Empresas).</li>
                <li>Baja lógica y restauración de postulantes y baja lógica de empresas.</li>
                <li>Administración completa de <strong>Catálogos del Sistema</strong> (alta, edición y baja de Rubros, Barrios, Niveles Educativos y Estados Laborales).</li>
                <li>Gestión completa de cuentas en la pestaña <strong>Personal</strong> (alta de entrevistadores, cambio de contraseñas, activación/suspensión y bajas).</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'postulantes',
      title: 'Gestión de Postulantes',
      icon: <Search size={18} />,
      content: (
        <div>
          <h2 style={styles.sectionTitle}>Búsqueda, Registro y Seguimiento de Postulantes</h2>

          <h3 style={styles.subSectionTitle}>1. Búsqueda, Cambio Rápido de Estado y Paginación</h3>
          <p style={styles.paragraph}>
            En la pantalla principal, el sistema utiliza paginación en servidor (20 elementos por página) con indicador de tiempo de respuesta.
            Puedes buscar instantáneamente por nombre, apellido o DNI, filtrar por rubro o estado laboral, y cambiar el <strong>Estado Laboral</strong> de cualquier postulante haciendo clic directamente sobre su etiqueta de estado en la tabla.
          </p>

          <h3 style={styles.subSectionTitle}>2. Filtros Avanzados y Limpieza Rápida</h3>
          <p style={styles.paragraph}>
            Al hacer clic en el botón de <strong>Filtros</strong>, se despliega un panel superior con selectores combinables: <strong>Rango de Edad</strong>, <strong>Nivel Educativo</strong>, <strong>Barrio / Zona</strong> y la casilla para postulantes con <strong>CUD (Discapacidad)</strong>.
          </p>
          <p style={styles.paragraph}>
            Cuando hay al menos un criterio activo, aparece dinámicamente el botón <strong>Limpiar Filtros (X)</strong> para restablecer todos los filtros y regresar a la primera página con un solo clic.
          </p>

          <h3 style={styles.subSectionTitle}>3. Visualización de Múltiples Rubros en la Tabla</h3>
          <p style={styles.paragraph}>
            Para optimizar la lectura sin necesidad de abrir cada expediente, los rubros se organizan en hasta <strong>dos filas horizontales</strong>:
          </p>
          <ul style={{ ...styles.bulletList, paddingLeft: '20px', margin: '0 0 16px 0' }}>
            <li style={{ marginBottom: '6px' }}>Si el candidato cuenta con hasta 4 rubros vinculados, se muestran todos a texto completo en dos renglones.</li>
            <li style={{ marginBottom: '0' }}>Si cuenta con 5 o más rubros, se muestran las primeras 3 etiquetas completas y un indicador (ej: <code>+2</code>) que al hacer clic despliega un popover flotante con el resto de las especialidades.</li>
          </ul>

          <h3 style={styles.subSectionTitle}>4. Registro de un Candidato</h3>
          <p style={styles.paragraph}>
            Al hacer clic en <strong>Nuevo</strong>, se abre un formulario dinámico estructurado en bloques:
          </p>
          <div style={styles.listSteps}>
            <div style={styles.stepItem}>
              <span style={styles.stepNumber}>1</span>
              <div>
                <strong>Datos Personales, de Contacto y Fotografía:</strong> Nombre, apellido, DNI, CUIL, teléfonos, dirección, barrio y foto de perfil (formatos de imagen válidos hasta 2 MB).
              </div>
            </div>
            <div style={styles.stepItem}>
              <span style={styles.stepNumber}>2</span>
              <div>
                <strong>Situación Social, Tributaria y de Salud:</strong> Información sobre Discapacidad (CUD), movilidad propia, licencia de conducir, monotributo/ATER/habilitación municipal, obra social y planes sociales activos.
              </div>
            </div>
            <div style={styles.stepItem}>
              <span style={styles.stepNumber}>3</span>
              <div>
                <strong>Historial Académico y Experiencia Laboral:</strong> Sección interactiva para añadir múltiples estudios realizados y experiencias laborales previas.
              </div>
            </div>
          </div>

          <h3 style={styles.subSectionTitle}>5. Navegación Secuencial y Atajos de Teclado en el CV</h3>
          <p style={styles.paragraph}>
            Al abrir el expediente mediante el botón <strong>Ver CV</strong>, la barra superior habilita los botones <strong>Anterior</strong> y <strong>Siguiente</strong> junto con atajos de teclado para recorrer los resultados filtrados sin volver al listado:
          </p>
          <ul style={{ ...styles.bulletList, paddingLeft: '20px', margin: '0 0 16px 0' }}>
            <li style={{ marginBottom: '6px' }}><strong>Flecha Derecha (&rarr;)</strong>: Avanza al siguiente postulante de la lista filtrada.</li>
            <li style={{ marginBottom: '6px' }}><strong>Flecha Izquierda (&larr;)</strong>: Retrocede al postulante anterior.</li>
            <li style={{ marginBottom: '0' }}><strong>Tecla Escape (Esc)</strong>: Cierra la vista del CV y regresa al listado principal.</li>
          </ul>

          <h3 style={styles.subSectionTitle}>6. Panel del Entrevistador, Autoguardado y Línea de Tiempo</h3>
          <p style={styles.paragraph}>
            A la derecha de la hoja A4 del CV (que se mantiene siempre en fondo blanco para garantizar fidelidad al exportar a PDF o imprimir) se ubica el panel de seguimiento interno:
          </p>
          <ul style={{ ...styles.bulletList, paddingLeft: '20px', margin: '0 0 16px 0' }}>
            <li style={{ marginBottom: '6px' }}><strong>Calificación por Estrellas (1 a 5) y Notas Privadas:</strong> Se guardan automáticamente tras 1.5 segundos de inactividad (<em>Autosave</em>) y nunca se imprimen ni se incluyen en el PDF del ciudadano.</li>
            <li style={{ marginBottom: '0' }}><strong>Historial de Visitas:</strong> Línea de tiempo interactiva donde se pueden consultar entrevistas anteriores y registrar nuevas visitas indicando objetivo, observaciones técnicas, prioridad de inserción y estado del trámite.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'empresas',
      title: 'Relevamiento de Empresas',
      icon: <Building2 size={18} />,
      content: (
        <div>
          <h2 style={styles.sectionTitle}>Módulo de Relevamiento de Empresas</h2>
          <p style={styles.paragraph}>
            La pestaña <strong>Empresas</strong> permite al personal de la Oficina de Empleo relevar comercios, industrias, PyMEs y emprendimientos de la zona, centralizando sus datos de contacto y su demanda actual o futura de trabajadores.
          </p>

          <h3 style={styles.subSectionTitle}>1. Indicadores Rápidos y Filtros de Demanda</h3>
          <p style={styles.paragraph}>
            En la parte superior del módulo se exhiben tres contadores en tiempo real:
          </p>
          <ul style={{ ...styles.bulletList, paddingLeft: '20px', margin: '0 0 16px 0' }}>
            <li style={{ marginBottom: '6px' }}><strong>Empresas relevadas:</strong> Total de fichas empresariales activas.</li>
            <li style={{ marginBottom: '6px' }}><strong>Buscan personal:</strong> Empresas que declararon búsqueda activa (<code>Busca personal</code>).</li>
            <li style={{ marginBottom: '0' }}><strong>Interés en programas de empleo:</strong> Empresas interesadas en articular con programas municipales o de inserción laboral.</li>
          </ul>
          <p style={styles.paragraph}>
            Debajo de los indicadores puedes buscar instantáneamente por razón social, nombre de fantasía, número de CUIT (con o sin guiones), persona de contacto, email, actividad o perfiles demandados, y combinarlo con los selectores de <strong>Rubro</strong> y <strong>Demanda laboral</strong>.
          </p>

          <h3 style={styles.subSectionTitle}>2. Alta y Edición de Ficha de Empresa</h3>
          <p style={styles.paragraph}>
            Al pulsar <strong>Nueva Empresa</strong> (o el icono de edición en una tarjeta existente), se abre el formulario organizado en tres secciones:
          </p>
          <div style={styles.listSteps}>
            <div style={styles.stepItem}>
              <span style={styles.stepNumber}>1</span>
              <div>
                <strong>Identificación y Ubicación:</strong> Razón social (obligatoria), nombre de fantasía, <strong>CUIT</strong> (con formato automático <code>XX-XXXXXXXX-X</code> y validación de dígito verificador AFIP), rubro, actividad principal, rango de dotación de empleados (<code>1-5</code>, <code>6-10</code>, <code>11-50</code>, <code>51-200</code>, <code>+200</code>), dirección, barrio y localidad (por defecto <em>San José</em>).
              </div>
            </div>
            <div style={styles.stepItem}>
              <span style={styles.stepNumber}>2</span>
              <div>
                <strong>Datos de Contacto:</strong> Nombre y cargo del referente, teléfono primario, teléfono secundario/celular, correo electrónico y sitio web o red social. Se exige al menos un medio de contacto válido (teléfono o email).
              </div>
            </div>
            <div style={styles.stepItem}>
              <span style={styles.stepNumber}>3</span>
              <div>
                <strong>Relevamiento y Demanda Laboral:</strong> Interés en incorporar personal (<em>Busca personal</em>, <em>Interés a futuro</em>, <em>Sin búsquedas</em>, <em>Sin dato</em>), fecha de relevamiento, casilla de interés en programas municipales de empleo, detalle de perfiles demandados y observaciones generales. El sistema registra automáticamente qué operador realizó el relevamiento.
              </div>
            </div>
          </div>

          <h3 style={styles.subSectionTitle}>3. Ficha Detallada y Reactivación por CUIT</h3>
          <p style={styles.paragraph}>
            Haciendo clic en el icono del ojo (<strong>Ver ficha completa</strong>) en cualquier tarjeta se accede a la vista institucional completa con accesos directos para llamar por teléfono, enviar correo o abrir el sitio web de la empresa. Si se da de baja una empresa y tiempo después se vuelve a registrar el mismo CUIT, el sistema reactiva automáticamente su registro histórico actualizando sus datos.
          </p>
        </div>
      )
    },
    {
      id: 'reactivacion',
      title: 'Papelera y Reactivación',
      icon: <RefreshCw size={18} />,
      content: (
        <div>
          <h2 style={styles.sectionTitle}>Papelera de Eliminados y Reactivación</h2>
          <p style={styles.paragraph}>
            Para resguardar la trazabilidad histórica (auditorías, visitas anteriores del ciudadano, relevamientos y derivaciones), el sistema no realiza borrados físicos destructivos, sino que aplica una <strong>baja lógica</strong> (<code>activo = false</code> y marca de tiempo <code>deleted_at</code>).
          </p>

          <h3 style={styles.subSectionTitle}>1. Papelera de Inactivos y Restauración Manual</h3>
          <p style={styles.paragraph}>
            Para visualizar los postulantes dados de baja, dirígete a la barra de búsqueda principal en el listado de <strong>Postulantes</strong> y selecciona la opción <strong>"Inactivos / Eliminados"</strong> en el desplegable de estados.
          </p>
          <p style={styles.paragraph}>
            En esta vista especial, el botón de eliminar se transforma en el botón verde de <strong>Restaurar</strong>, permitiendo reincorporar al postulante al padrón activo con un clic.
          </p>

          <h3 style={styles.subSectionTitle}>2. Mecanismo de Reactivación Automática</h3>
          <p style={styles.paragraph}>
            Si intentas dar de alta un postulante (o empresa) cuyo DNI/CUIL/CUIT había sido dado de baja previamente, el sistema ejecuta el algoritmo de Reactivación Automática:
          </p>

          <div style={styles.flowCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <RefreshCw size={24} style={{ color: 'var(--accent-green)', animation: 'spin 4s linear infinite' }} />
              <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: 'var(--accent-green)' }}>¿Cómo opera el algoritmo?</h4>
            </div>
            <ol style={{ ...styles.bulletList, paddingLeft: '20px', margin: 0 }}>
              <li style={{ marginBottom: '8px' }}>El backend detecta si el DNI, CUIL o CUIT ingresado pertenece a un registro inactivo.</li>
              <li style={{ marginBottom: '8px' }}>En vez de arrojar error por duplicado, restaura el registro cambiando su estado a activo (<code>deletedAt = null</code>, <code>activo = true</code>).</li>
              <li style={{ marginBottom: '8px' }}>Actualiza la ficha con los nuevos datos cargados en el formulario.</li>
              <li style={{ marginBottom: '0' }}>Registra la trazabilidad del operador que realizó la reactivación y notifica en pantalla mediante una alerta de éxito.</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 'informes',
      title: 'Módulo de Informes',
      icon: <BarChart3 size={18} />,
      content: (
        <div>
          <h2 style={styles.sectionTitle}>Panel de Control de Estadísticas (Postulantes y Empresas)</h2>
          <p style={styles.paragraph}>
            El módulo de <strong>Informes</strong> (exclusivo para <code>SuperAdmin</code>) consolida en una sola vista tanto las métricas sociolaborales de los <strong>Postulantes</strong> como los indicadores productivos de las <strong>Empresas Relevadas</strong>, ubicados inmediatamente debajo.
          </p>

          <h3 style={styles.subSectionTitle}>1. Sección Superior: Métricas de Postulantes</h3>
          <div style={styles.grid}>
            <div style={styles.metricItem}>
              <h4 style={styles.metricTitle}>Indicadores Generales (KPIs)</h4>
              <p style={styles.metricDesc}>Total de postulantes activos, nuevos perfiles agregados en la última semana (7 días) y en el último mes (30 días).</p>
            </div>
            <div style={styles.metricItem}>
              <h4 style={styles.metricTitle}>Desempeño y Estado Laboral</h4>
              <p style={styles.metricDesc}>Cantidad y porcentaje de entrevistas por cada miembro del personal, y desglose por estado laboral (En búsqueda activa, Empleado, Programa Social, Desempleado).</p>
            </div>
            <div style={styles.metricItem}>
              <h4 style={styles.metricTitle}>Top 5 Barrios y Nivel Educativo</h4>
              <p style={styles.metricDesc}>Zonas con mayor concentración de postulantes registrados y distribución según máximo nivel educativo alcanzado.</p>
            </div>
            <div style={styles.metricItem}>
              <h4 style={styles.metricTitle}>Género, Edad y Discapacidad (CUD)</h4>
              <p style={styles.metricDesc}>Edad promedio y rangos etarios, distribución por género y proporción de personas con Certificado Único de Discapacidad (CUD) y sus tipos.</p>
            </div>
          </div>

          <h3 style={styles.subSectionTitle}>2. Sección Inferior: Métricas de Empresas Relevadas</h3>
          <p style={styles.paragraph}>
            Debajo de los indicadores de postulantes, el informe despliega la misma estructura analítica aplicada al relevamiento empresarial:
          </p>
          <div style={styles.grid}>
            <div style={styles.metricItem}>
              <h4 style={styles.metricTitle}>KPIs de Empresas</h4>
              <p style={styles.metricDesc}>Total de empresas activas relevadas, agregadas en la última semana, agregadas en el último mes y total de empresas que buscan personal activamente.</p>
            </div>
            <div style={styles.metricItem}>
              <h4 style={styles.metricTitle}>Relevamiento por Entrevistador y Demanda</h4>
              <p style={styles.metricDesc}>Cantidad de empresas relevadas por cada entrevistador y distribución porcentual según demanda de personal (Busca personal, Interés a futuro, Sin búsquedas, Sin dato).</p>
            </div>
            <div style={styles.metricItem}>
              <h4 style={styles.metricTitle}>Top 5 Barrios, Rubros y Localidades</h4>
              <p style={styles.metricDesc}>Ranking de los 5 barrios con mayor presencia empresarial, cantidad de empresas por rubro/sector productivo y desglose por localidad.</p>
            </div>
            <div style={styles.metricItem}>
              <h4 style={styles.metricTitle}>Dotación y Programas de Empleo</h4>
              <p style={styles.metricDesc}>Tamaño de las empresas según rango de empleados (<code>1-5</code> a <code>+200</code>) y proporción de empresas interesadas en Programas Municipales de Empleo.</p>
            </div>
          </div>

          <h3 style={styles.subSectionTitle}>3. Exportación CSV e Impresión PDF Unificada</h3>
          <p style={styles.paragraph}>
            Al presionar <strong>Exportar CSV</strong>, se descarga un archivo compatible con Excel que incluye todas las tablas estadísticas tanto de <strong>Postulantes</strong> como de <strong>Empresas</strong>. Asimismo, el botón <strong>Imprimir PDF</strong> formatea automáticamente ambas secciones con control de saltos de página (<code>break-inside: avoid</code>).
          </p>
        </div>
      )
    },
    {
      id: 'interfaz',
      title: 'Catálogos, Tema y Sistema',
      icon: <Settings size={18} />,
      content: (
        <div>
          <h2 style={styles.sectionTitle}>Catálogos Administrables, Tema Visual y Ejecución</h2>

          <h3 style={styles.subSectionTitle}>1. Administración de Catálogos del Sistema (⚙️ Configuración)</h3>
          <p style={styles.paragraph}>
            Haciendo clic en el icono de engranaje (<code>Configuración</code>) en la esquina superior derecha, se abre el panel para administrar en vivo las listas desplegables del sistema:
          </p>
          <ul style={{ ...styles.bulletList, paddingLeft: '20px', margin: '0 0 16px 0' }}>
            <li style={{ marginBottom: '6px' }}><strong>Rubros y Barrios:</strong> Se sincronizan directamente con la base de datos MySQL/MariaDB y se utilizan tanto en Postulantes como en Empresas.</li>
            <li style={{ marginBottom: '0' }}><strong>Niveles Educativos y Estados Laborales:</strong> Se almacenan centralizadamente en el servidor (<code>/api/catalogos-config</code>) para que todas las computadoras de la red LAN compartan exactamente las mismas opciones.</li>
          </ul>

          <h3 style={styles.subSectionTitle}>2. Identidad Visual Institucional y Tema Claro / Oscuro por Usuario</h3>
          <p style={styles.paragraph}>
            La interfaz implementa la identidad visual de <strong>SJTP (Trabajo y Producción)</strong> y <strong>SJ Ciudad</strong> bajo la normativa de diseño web <strong>60-30-10</strong> y relaciones de contraste <strong>WCAG AA/AAA</strong> (60% superficies neutras matizadas para evitar fatiga visual, 30% azul marino/celeste institucional y 10% acentos focales).
          </p>
          <p style={styles.paragraph}>
            Desde el icono de sol/luna de la cabecera se puede alternar en vivo entre <strong>Modo Claro</strong> y <strong>Modo Oscuro</strong>: tanto la paleta como los logos institucionales se adaptan automáticamente para mantener máximo contraste, recordando la preferencia individual de cada operador (<code>theme_usuario</code>).
          </p>

          <h3 style={styles.subSectionTitle}>3. Operación Segura en Red LAN (HTTPS), Inicio Automático y Respaldos</h3>
          <p style={styles.paragraph}>
            El sistema opera como servidor central de la oficina, permitiendo que múltiples entrevistadores trabajen en simultáneo desde sus computadoras con conexión cifrada:
          </p>
          <ul style={{ ...styles.bulletList, paddingLeft: '20px', margin: '0 0 16px 0' }}>
            <li style={{ marginBottom: '6px' }}><strong>Acceso Seguro HTTPS en Red LAN y Redirección Automática:</strong> Las terminales de la oficina ingresan mediante <code>https://sistema:5173</code> (si alguien escribe <code>http://sistema:5173</code>, el servidor redirige automáticamente a <code>https://</code>). El script <code>scripts/ensure-https-cert.ps1</code> mantiene vigente la Autoridad Raíz Local (10 años) y renueva automáticamente el certificado SSL del servidor si el router cambia la IP local.</li>
            <li style={{ marginBottom: '6px' }}><strong>Instalador de Certificado para PCs de Entrevistadores (1 clic):</strong> Para que cualquier computadora nueva de la oficina muestre el candado de <em>Sitio Seguro</em> sin advertencias en Chrome o Edge, basta con ejecutar una única vez en esa PC el archivo <code>certs/instalar-certificado-pc.bat</code> (también descargable desde <code>https://sistema:5173/instalar-certificado-pc.bat</code>).</li>
            <li style={{ marginBottom: '6px' }}><strong>Inicio automático invisible y Auto-Recuperación (Watchdog):</strong> El lanzador <code>scripts/iniciar-oculto.vbs</code> ejecuta <code>scripts/autostart-services.ps1</code> al encender la PC, levantando <strong>MariaDB</strong> blindado en <code>127.0.0.1:3306</code>, el <strong>Backend Spring Boot</strong> en <code>8080</code> y el <strong>Frontend HTTPS</strong> en <code>0.0.0.0:5173</code>. Además, la tarea programada <code>BolsaTrabajoWatchdog</code> verifica cada 5 minutos que los 3 servicios estén activos y los levanta automáticamente si alguno se detiene.</li>
            <li style={{ marginBottom: '6px' }}><strong>Respaldos automáticos y manuales de Base de Datos:</strong> Cada día al iniciar el sistema se genera una copia de seguridad en <code>database/backups_locales/backup_automatico_YYYY-MM-DD.sql</code> (conservando 30 días), y puede ejecutarse un respaldo instantáneo en cualquier momento con doble clic en <code>respaldar-bd.bat</code>.</li>
            <li style={{ marginBottom: '0' }}><strong>Actualización en 1 clic y Control manual:</strong> Ejecutando <code>actualizar.bat</code> el servidor respalda la base de datos, descarga las últimas mejoras desde GitHub (<code>git pull</code>), recompila el sistema y reinicia los servicios. Para detener o iniciar manualmente todos los procesos se dispone de <code>detener.bat</code> e <code>iniciar.bat</code>.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'personal',
      title: 'Administración de Personal',
      icon: <Database size={18} />,
      content: (
        <div>
          <h2 style={styles.sectionTitle}>Gestión de Cuentas de Operadores y Seguridad</h2>
          <p style={styles.paragraph}>
            El administrador principal del sistema (<code>SuperAdmin</code>) dispone de la pestaña de <strong>Personal</strong>
            para coordinar el equipo de trabajo de la oficina:
          </p>
          <div style={styles.listSteps}>
            <div style={styles.stepItem}>
              <span style={{ ...styles.stepNumber, backgroundColor: '#7c3aed' }}>1</span>
              <div>
                <strong>Crear Nuevos Usuarios:</strong> Permite registrar operadores ingresando su nombre completo, nombre de usuario, contraseña inicial y rol asignado (<code>Entrevistador</code> o <code>SuperAdmin</code>).
              </div>
            </div>
            <div style={styles.stepItem}>
              <span style={{ ...styles.stepNumber, backgroundColor: '#7c3aed' }}>2</span>
              <div>
                <strong>Cambiar Contraseñas (Individual o Masivo por Rol):</strong> Desde el botón de cada fila o desde el botón superior <code>Cambiar Contraseñas (Masivo / Rol)</code>, el administrador puede actualizar la clave de acceso de un usuario específico (entrevistador o administrador), o bien aplicar una nueva contraseña en forma masiva a <strong>todos los Entrevistadores</strong>, a <strong>todos los Administradores</strong>, o a <strong>todo el Personal</strong> simultáneamente.
              </div>
            </div>
            <div style={styles.stepItem}>
              <span style={{ ...styles.stepNumber, backgroundColor: '#7c3aed' }}>3</span>
              <div>
                <strong>Activar / Desactivar y Dar de Baja (Soft-Delete):</strong> Haciendo clic sobre el badge <code>ACTIVO / INACTIVO</code> o el botón de baja se puede suspender o inhabilitar el acceso de un operador de forma instantánea sin perder el historial de entrevistas ni de empresas que haya relevado.
              </div>
            </div>
          </div>

          <h3 style={styles.subSectionTitle}>🔒 Políticas de Seguridad e Integridad de Datos</h3>
          <ul style={{ ...styles.bulletList, paddingLeft: '20px', margin: '0 0 16px 0' }}>
            <li style={{ marginBottom: '6px' }}><strong>Complejidad de Contraseñas:</strong> Mínimo 8 caracteres, al menos una letra mayúscula, un número y un carácter especial (ej. <code>!@#$%^&*</code>).</li>
            <li style={{ marginBottom: '6px' }}><strong>Control de Intentos Fallidos (Rate Limiting):</strong> Bloqueo temporal por IP durante 15 minutos tras 5 intentos fallidos consecutivos de inicio de sesión.</li>
            <li style={{ marginBottom: '6px' }}><strong>Revocación Inmediata de Sesiones:</strong> Al desactivar o dar de baja un usuario, el backend invalida su acceso en tiempo real en la siguiente petición.</li>
            <li style={{ marginBottom: '0' }}><strong>Protección de Secretos y Datos Sensibles:</strong> Las credenciales y claves JWT se gestionan exclusivamente mediante variables de entorno locales (<code>backend/.env</code>) y los volcados o respaldos locales (<code>database/backups_locales/</code>) están excluidos del repositorio público.</li>
          </ul>
        </div>
      )
    }
  ];

  return (
    <div className="fade-in" style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, rgba(4, 26, 114, 0.12) 0%, rgba(0, 172, 233, 0.18) 100%)',
          border: '1px solid rgba(0, 172, 233, 0.28)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#00ace9',
          flexShrink: 0
        }}>
          <BookOpen size={26} />
        </div>
        <div>
          <h1 style={styles.title}>Manual de Usuario</h1>
          <p style={styles.subtitle}>Guía completa de uso y administración del Sistema de Bolsa de Trabajo — Oficina de Empleo San José.</p>
        </div>
      </div>

      <div style={styles.layout}>
        {/* Navigation Sidebar */}
        <div style={styles.sidebar}>
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`sidebar-item ${activeSection === section.id ? 'active' : ''}`}
              style={{
                justifyContent: 'space-between',
                borderRadius: '10px',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {section.icon}
                {section.title}
              </span>
              <ChevronRight size={16} style={{ opacity: activeSection === section.id ? 1 : 0, color: 'var(--sidebar-item-active-color)', transition: 'var(--transition)' }} />
            </button>
          ))}
        </div>

        {/* Content Viewer */}
        <div style={styles.contentArea}>
          {sections.find(s => s.id === activeSection)?.content}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    padding: '0 20px',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '32px',
    borderBottom: '1px solid var(--border-hex)',
    paddingBottom: '20px',
  },
  title: {
    fontSize: '29px',
    fontWeight: 700,
    color: 'var(--text-main-hex)',
    margin: 0,
  },
  subtitle: {
    color: 'var(--text-muted-hex)',
    marginTop: '4px',
    margin: 0,
    fontSize: '15px',
  },
  layout: {
    display: 'flex',
    gap: '40px',
    alignItems: 'flex-start',
  },
  sidebar: {
    width: '280px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    backgroundColor: 'var(--card-bg-hex)',
    borderRadius: '16px',
    padding: '12px',
    border: '1px solid var(--border-hex)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '12px 16px',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    textAlign: 'left' as const,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  contentArea: {
    flex: 1,
    backgroundColor: 'var(--card-bg-hex)',
    borderRadius: '20px',
    padding: '40px',
    border: '1px solid var(--border-hex)',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.01), 0 2px 4px -1px rgba(0,0,0,0.006)',
    minHeight: '480px',
  },
  sectionTitle: {
    fontSize: '25px',
    fontWeight: 700,
    color: 'var(--text-main-hex)',
    marginTop: 0,
    marginBottom: '16px',
  },
  subSectionTitle: {
    fontSize: '17px',
    fontWeight: 600,
    color: 'var(--text-main-hex)',
    marginTop: '24px',
    marginBottom: '10px',
  },
  paragraph: {
    fontSize: '15px',
    lineHeight: '1.6',
    color: 'var(--text-muted-hex)',
    marginBottom: '16px',
  },
  cardInfo: {
    backgroundColor: 'var(--bg-alt-hex)',
    borderLeft: '4px solid hsl(var(--primary))',
    borderRadius: '8px',
    padding: '16px',
    marginTop: '24px',
  },
  cardInfoTitle: {
    margin: '0 0 6px 0',
    fontSize: '15px',
    fontWeight: 600,
    color: 'hsl(var(--primary))',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginTop: '24px',
  },
  roleCard: {
    backgroundColor: 'var(--bg-alt-hex)',
    border: '1px solid var(--border-hex)',
    borderRadius: '16px',
    padding: '24px',
  },
  roleTitle: {
    fontSize: '17px',
    fontWeight: 600,
    color: 'var(--text-main-hex)',
    margin: 0,
  },
  bulletList: {
    margin: '12px 0 0 0',
    paddingLeft: '16px',
    fontSize: '14px',
    color: 'var(--text-muted-hex)',
    lineHeight: '1.6',
  },
  listSteps: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    marginTop: '20px',
  },
  stepItem: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
    fontSize: '15px',
    color: 'var(--text-muted-hex)',
    lineHeight: '1.5',
  },
  stepNumber: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    backgroundColor: 'hsl(var(--primary))',
    color: 'white',
    fontSize: '13px',
    fontWeight: 700,
    flexShrink: 0,
  },
  flowCard: {
    backgroundColor: 'var(--accent-green-light)',
    border: '1px solid var(--accent-green-border)',
    borderRadius: '16px',
    padding: '24px',
    marginTop: '20px',
  },
  metricItem: {
    backgroundColor: 'var(--bg-alt-hex)',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid var(--border-hex)',
  },
  metricTitle: {
    margin: '0 0 8px 0',
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--text-main-hex)',
  },
  metricDesc: {
    margin: 0,
    fontSize: '14px',
    color: 'var(--text-muted-hex)',
    lineHeight: '1.5',
  }
};
