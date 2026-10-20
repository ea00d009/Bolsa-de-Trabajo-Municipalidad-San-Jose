import { useState } from 'react';
import {
  BookOpen, Users, Settings, ShieldCheck,
  BarChart3, Database, Search, RefreshCw, ChevronRight
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
            Bienvenido al <strong>Sistema de Gestión de Bolsa de Trabajo</strong> de la Oficina de Empleo Municipal.
            Esta plataforma Full-Stack ha sido diseñada para optimizar, centralizar y digitalizar el registro,
            seguimiento e inserción laboral de los ciudadanos del municipio.
          </p>
          <p style={styles.paragraph}>
            El sistema reemplaza las antiguas planillas de cálculo manuales por una solución web moderna,
            segura y robusta, capaz de procesar cientos de registros históricos con tiempos de carga instantáneos
            y herramientas avanzadas de análisis estadístico.
          </p>
          <div style={styles.cardInfo}>
            <h4 style={styles.cardInfoTitle}>Propósito Principal</h4>
            <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-main-hex)' }}>
              Facilitar el nexo entre la oferta y la demanda laboral del municipio, brindando a los operarios
              de la oficina una herramienta ágil para perfilar candidatos y a los administradores un panel demográfico
              en tiempo real para planificar capacitaciones y políticas de empleo.
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
            El acceso al sistema está resguardado mediante tokens JWT y se divide en dos perfiles o roles clave:
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
                <li>Registro completo de postulantes nuevos en la base de datos.</li>
                <li>Búsqueda y filtrado rápido por texto o por rubro comercial.</li>
                <li>Visualización y edición del CV de los candidatos.</li>
                <li>Asociación de entrevistas de seguimiento.</li>
                <li>Gestión de rubros comerciales.</li>
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
                <li>Acceso exclusivo al panel de <strong>Informes</strong> estadísticos.</li>
                <li>Permiso de eliminación lógica de postulantes.</li>
                <li>Gestión completa de usuarios (Alta de entrevistadores, cambio de contraseñas y bajas del sistema).</li>
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
          <h2 style={styles.sectionTitle}>Búsqueda, Registro y Filtros</h2>

          <h3 style={styles.subSectionTitle}>1. Búsqueda y Paginación Eficiente</h3>
          <p style={styles.paragraph}>
            En la pantalla principal, el sistema utiliza paginación en servidor (20 elementos por página).
            Esto permite realizar búsquedas instantáneas en la base de datos.
            Puedes escribir el nombre, apellido o DNI en la barra de búsqueda superior y seleccionar
            un rubro específico para refinar los resultados.
          </p>

          <h3 style={styles.subSectionTitle}>2. Filtros Avanzados y Limpieza Rápida</h3>
          <p style={styles.paragraph}>
            Al hacer clic en el botón de <strong>Filtros</strong>, se despliega un panel superior organizado mediante un diseño Flexbox responsivo con tres selectores de igual ancho: <strong>Rango de Edad</strong>, <strong>Nivel Educativo</strong> y <strong>Barrio / Zona</strong>, además de la casilla para postulantes con <strong>CUD</strong>.
          </p>
          <p style={styles.paragraph}>
            Si hay al menos un filtro de búsqueda o avanzado activo, aparecerá de forma dinámica el botón <strong>Limpiar Filtros</strong> (identificado con una <span style={{ fontWeight: 600 }}>X</span>) justo al lado del botón de Filtros. Al pulsarlo, se restablecerán instantáneamente todos los criterios a sus valores iniciales y la lista volverá a la primera página de resultados de manera limpia.
          </p>

          <h3 style={styles.subSectionTitle}>3. Visualización de Múltiples Rubros en la Tabla</h3>
          <p style={styles.paragraph}>
            Para optimizar la legibilidad directa sin necesidad de abrir el expediente, los rubros en la columna central se organizan en hasta <strong>dos filas horizontales</strong>:
          </p>
          <ul style={{ ...styles.bulletList, paddingLeft: '20px', margin: '0 0 16px 0' }}>
            <li style={{ marginBottom: '6px' }}>Si el candidato cuenta con hasta 4 rubros vinculados, se muestran todos a su ancho y texto completo en dos renglones.</li>
            <li style={{ marginBottom: '0' }}>Si cuenta con 5 o más rubros, la interfaz dibujará las primeras 3 etiquetas completas y un badge con la cantidad restante (ej: `+2`). Al posicionar el mouse sobre este indicador, emergerá un popover flotante con el resto de las especialidades a texto completo.</li>
          </ul>

          <h3 style={styles.subSectionTitle}>4. Registro de un Candidato</h3>
          <p style={styles.paragraph}>
            Al hacer clic en "Nuevo", se abrirá un formulario dinámico dividido en secciones:
          </p>
          <div style={styles.listSteps}>
            <div style={styles.stepItem}>
              <span style={styles.stepNumber}>1</span>
              <div>
                <strong>Datos Personales, de Contacto y Fotografía:</strong> Nombre, apellido, DNI, CUIL, teléfonos, dirección y foto de perfil.
                Los campos marcados con (*) son obligatorios. La fotografía cargada debe corresponder a una imagen válida (formato data:image/...) y su tamaño máximo de archivo no debe exceder los 2 MB.
              </div>
            </div>
            <div style={styles.stepItem}>
              <span style={styles.stepNumber}>2</span>
              <div>
                <strong>Situación Social y de Salud:</strong> Información sobre Discapacidad (CUD), posesión de movilidad,
                licencia de conducir y planes sociales activos.
              </div>
            </div>
            <div style={styles.stepItem}>
              <span style={styles.stepNumber}>3</span>
              <div>
                <strong>Historial Académico y Experiencia:</strong> Sección interactiva para añadir múltiples estudios realizados
                y experiencias laborales previas, permitiendo indicar si el postulante trabaja actualmente allí. Las subtarjetas del formulario adaptan automáticamente su fondo y contraste para ser completamente legibles tanto en tema claro como oscuro.
              </div>
            </div>
          </div>

          <h3 style={styles.subSectionTitle}>5. Navegación Secuencial y Atajos de Teclado</h3>
          <p style={styles.paragraph}>
            Al visualizar el detalle de un postulante mediante el botón "Ver CV", el sistema despliega en la barra superior los controles de navegación <strong>Anterior</strong> y <strong>Siguiente</strong>. Estos controles respetan la lista de candidatos resultantes de tu búsqueda o filtros en el Dashboard principal, permitiendo examinar expedientes uno tras otro de forma ágil sin necesidad de volver a la tabla general.
          </p>
          <p style={styles.paragraph}>
            Para dinamizar aún más el proceso de revisión y auditoría, puedes utilizar los siguientes <strong>atajos de teclado</strong> en esta pantalla:
          </p>
          <ul style={{ ...styles.bulletList, paddingLeft: '20px', margin: '0 0 16px 0' }}>
            <li style={{ marginBottom: '6px' }}><strong>Flecha Derecha (&rarr;)</strong>: Avanza al siguiente postulante de la lista de forma inmediata.</li>
            <li style={{ marginBottom: '6px' }}><strong>Flecha Izquierda (&larr;)</strong>: Retrocede al postulante anterior de la lista.</li>
            <li style={{ marginBottom: '0' }}><strong>Tecla Escape (Esc)</strong>: Cierra el expediente de CV del postulante actual y regresa automáticamente a la tabla principal del Dashboard de forma limpia.</li>
          </ul>

          <h3 style={styles.subSectionTitle}>6. Historial de Visitas y Evolución</h3>
          <p style={styles.paragraph}>
            En el lateral derecho del expediente se presenta el <strong>Historial de Visitas</strong>. Esta sección es una línea de tiempo vertical dinámica que carga en tiempo real todas las entrevistas y visitas registradas para el postulante. Cada elemento de la línea de tiempo muestra la fecha de la visita, el objetivo, el nombre del operario/entrevistador que la realizó, la prioridad de inserción y el estado del trámite. Al hacer clic en cualquier visita de la lista, esta se expandirá para revelar las <strong>Observaciones Técnicas y de Evolución</strong> registradas, facilitando el seguimiento del candidato a lo largo del tiempo de manera clara.
          </p>

          <h3 style={styles.subSectionTitle}>7. Vista Previa de CV en Modo Claro Forzado</h3>
          <p style={styles.paragraph}>
            La hoja del currículum (CV) se muestra en pantalla imitando una página física para facilitar la lectura e impresión. Con el fin de garantizar un contraste óptimo del texto y asegurar que la previsualización del documento sea exactamente idéntica al archivo que se guardará en PDF o imprimirá físicamente, esta hoja se representa <strong>siempre en fondo claro (blanco)</strong> con letras de color oscuro. Este diseño se mantiene de forma intencional y automática incluso si el usuario está navegando el resto de la aplicación bajo el Modo Oscuro.
          </p>

          <h3 style={styles.subSectionTitle}>8. Panel del Entrevistador (Notas, Calificaciones y Registro de Visitas)</h3>
          <p style={styles.paragraph}>
            A la derecha del CV electrónico se visualiza el panel administrativo de entrevistas, que permite realizar el seguimiento técnico:
          </p>
          <ul style={{ ...styles.bulletList, paddingLeft: '20px', margin: '0 0 16px 0' }}>
            <li style={{ marginBottom: '6px' }}><strong>Calificación por Estrellas</strong>: Asigna una puntuación del 1 al 5 haciendo clic sobre las estrellas correspondientes para calificar la aptitud del candidato.</li>
            <li style={{ marginBottom: '6px' }}><strong>Notas Privadas</strong>: Un espacio confidencial para anotaciones generales y percepciones rápidas.</li>
            <li style={{ marginBottom: '6px' }}><strong>Autoguardado Asíncrono (Autosave)</strong>: Para evitar la pérdida de información y mejorar la agilidad de los operarios, las <strong>Notas Privadas</strong> y la <strong>Calificación por Estrellas</strong> se guardan automáticamente tras 1.5 segundos de inactividad de escritura (lógica <em>debounce</em>). El botón de guardado refleja dinámicamente este estado: "Guardando..." en color azul, "✔ Guardado" en verde por 2 segundos tras el éxito, y "Error al guardar" en rojo en caso de falla de conexión (permitiendo forzar el guardado manual con un clic).</li>
            <li style={{ marginBottom: '6px' }}><strong>Registrar Nueva Visita (Formulario Inline)</strong>: Al pulsar el botón "Registrar" en la cabecera del historial, se despliega un formulario interactivo para registrar un nuevo contacto con el ciudadano. Debes ingresar obligatoriamente el <strong>Objetivo de la Consulta</strong> y, opcionalmente, detallar la evolución en <strong>Observaciones Técnicas</strong>, definir la <strong>Prioridad de Inserción</strong> (Alta, Media, Baja) y establecer el <strong>Estado del Trámite</strong> (Pendiente, En Proceso, Finalizado).</li>
            <li style={{ marginBottom: '0' }}><strong>Guardado Persistente</strong>: Tanto el registro de visitas como la calificación y notas se sincronizan de forma persistente en la base de datos MySQL del backend, actualizando automáticamente la línea de tiempo sin necesidad de refrescar la página.</li>
          </ul>

          <h3 style={styles.subSectionTitle}>9. Privacidad y Seguridad del Feedback</h3>
          <p style={styles.paragraph}>
            Tanto las <strong>Notas Privadas</strong> como la <strong>Calificación</strong> son de carácter estrictamente confidencial para el entrevistador. El sistema garantiza su privacidad mediante reglas de exclusión automática:
          </p>
          <ul style={{ ...styles.bulletList, paddingLeft: '20px', margin: '0 0 16px 0' }}>
            <li style={{ marginBottom: '6px' }}>No se incluyen ni se renderizan al presionar el botón <strong>Descargar PDF</strong>.</li>
            <li style={{ marginBottom: '0' }}>Se ocultan por completo en la visualización física o vista previa a través del comando <strong>Imprimir</strong> gracias a hojas de estilo dinámicas de impresión (`@media print`), incluso si el usuario visualiza la pantalla en modo oscuro.</li>
          </ul>
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
            Para resguardar el historial (auditorías, visitas anteriores del ciudadano y derivaciones), el sistema no realiza
            borrados físicos de postulantes por defecto, sino que aplica una baja lógica (`activo = false`).
          </p>

          <h3 style={styles.subSectionTitle}>1. Papelera de Inactivos y Restauración Manual</h3>
          <p style={styles.paragraph}>
            El sistema proporciona una papelera de reciclaje integrada. Para visualizar los registros inactivos (postulantes dados de baja), simplemente dirígete a la barra de búsqueda principal en el Dashboard y selecciona la opción <strong>"Inactivos / Eliminados"</strong> en el desplegable de Estados.
          </p>
          <p style={styles.paragraph}>
            Al ingresar a esta vista especial, el listado mostrará únicamente los perfiles con baja lógica. El botón de eliminar (cesto de basura) se transformará en un botón verde circular de <strong>Restaurar</strong>. Al hacer clic sobre él, se solicitará confirmación mediante un modal antes de reactivar al postulante y reincorporarlo al listado activo principal.
          </p>

          <h3 style={styles.subSectionTitle}>2. Mecanismo de Reactivación Automática</h3>
          <p style={styles.paragraph}>
            Si intentas registrar un postulante que ya existía pero que fue eliminado previamente (baja lógica), el sistema ejecutará
            el algoritmo de Reactivación Automática de forma transparente:
          </p>

          <div style={styles.flowCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <RefreshCw size={24} style={{ color: 'var(--accent-green)', animation: 'spin 4s linear infinite' }} />
              <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 600, color: 'var(--accent-green)' }}>¿Cómo opera el algoritmo?</h4>
            </div>
            <ol style={{ ...styles.bulletList, paddingLeft: '20px', margin: 0 }}>
              <li style={{ marginBottom: '8px' }}>El backend detecta si el DNI o CUIL ingresado pertenece a un ciudadano inactivo.</li>
              <li style={{ marginBottom: '8px' }}>En vez de arrojar error por duplicado, restaura el registro cambiando su estado a activo (`deletedAt = null`, `activo = true`).</li>
              <li style={{ marginBottom: '8px' }}>Sobrescribe la información personal vieja con los nuevos datos completados en el formulario.</li>
              <li style={{ marginBottom: '8px' }}>Limpia e inyecta la nueva lista de estudios y experiencias laborales.</li>
              <li style={{ marginBottom: '0' }}>Registra de forma automática una nueva Entrevista de Registro Inicial en la base de datos para auditar quién realizó la reactivación y emite una alerta toast informativa en el panel.</li>
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
          <h2 style={styles.sectionTitle}>Análisis Demográfico e Indicadores</h2>
          <p style={styles.paragraph}>
            El módulo de <strong>Informes</strong> (exclusivo para `SuperAdmin`) consolida la información
            geográfica, social y laboral del municipio. Las métricas principales incluyen:
          </p>

          <div style={styles.grid}>
            <div style={styles.metricItem}>
              <h4 style={styles.metricTitle}>Estado Laboral</h4>
              <p style={styles.metricDesc}>Muestra el porcentaje en tiempo real de ciudadanos activos que se encuentran desempleados, empleados o en programas sociales.</p>
            </div>
            <div style={styles.metricItem}>
              <h4 style={styles.metricTitle}>Top de Barrios</h4>
              <p style={styles.metricDesc}>Identifica las zonas geográficas con mayor concentración de postulantes registrados, ideal para planificar ferias de empleo.</p>
            </div>
            <div style={styles.metricItem}>
              <h4 style={styles.metricTitle}>Nivel Educativo y Género</h4>
              <p style={styles.metricDesc}>Agrupa a los postulantes según su nivel académico finalizado y presenta desgloses de género de los perfiles.</p>
            </div>
            <div style={styles.metricItem}>
              <h4 style={styles.metricTitle}>Rendimiento del Personal</h4>
              <p style={styles.metricDesc}>Audita y lista de forma descendente el total de postulantes que han registrado y entrevistado cada uno de los operadores del sistema.</p>
            </div>
          </div>

          <h3 style={styles.subSectionTitle}>Exportación e Impresión del Reporte</h3>
          <p style={styles.paragraph}>
            El panel administrativo admite la descarga de toda la información en formato de planilla de datos presionando <strong>Exportar CSV</strong>.
          </p>
          <p style={styles.paragraph}>
            Asimismo, pulsando <strong>Imprimir PDF</strong>, se puede generar un documento físico o digital del reporte. La hoja de estilos de impresión ha sido optimizada con directivas `break-inside: avoid` en todas las tarjetas de indicadores principales. Esto garantiza que ningún bloque estadístico o lista se divida de manera incorrecta a través de los saltos de página del documento PDF.
          </p>
        </div>
      )
    },
    {
      id: 'interfaz',
      title: 'Tema e Interfaz',
      icon: <Settings size={18} />,
      content: (
        <div>
          <h2 style={styles.sectionTitle}>Personalización y Comportamiento Visual</h2>
          
          <h3 style={styles.subSectionTitle}>1. Persistencia de Tema por Usuario</h3>
          <p style={styles.paragraph}>
            La plataforma permite alternar de manera instantánea entre el <strong>Modo Claro</strong> y el <strong>Modo Oscuro</strong> mediante el icono de sol/luna de la cabecera superior.
          </p>
          <p style={styles.paragraph}>
            Para optimizar la experiencia de uso de múltiples operarios:
          </p>
          <ul style={{ ...styles.bulletList, paddingLeft: '20px', margin: '0 0 16px 0' }}>
            <li style={{ marginBottom: '6px' }}>La preferencia elegida se almacena individualmente en el navegador para cada cuenta de operador registrada (`theme_usuario`).</li>
            <li style={{ marginBottom: '6px' }}>Al iniciar sesión, el sistema restaurará de forma automática el último tema que haya configurado ese usuario en particular.</li>
            <li style={{ marginBottom: '0' }}>Por neutralidad estética de la pantalla de acceso, el formulario de <strong>Inicio de Sesión (Login)</strong> siempre se despliega en modo claro de forma predeterminada, restableciéndose también a este modo en cuanto se cierra sesión.</li>
          </ul>

          <h3 style={styles.subSectionTitle}>2. Estabilidad de Diseño (Scrollbar Gutter)</h3>
          <p style={styles.paragraph}>
            Con el fin de evitar desplazamientos laterales indeseados en el contenido centrado cuando el listado de postulantes cambia de tamaño o de cantidad de filas al aplicar filtros (ocultando o mostrando el scroll vertical del navegador), la interfaz cuenta con una reserva de espacio fija y permanente para el canal del scroll vertical (`scrollbar-gutter: stable`), asegurando una visualización estática y uniforme.
          </p>

          <h3 style={styles.subSectionTitle}>3. Colores Dinámicos de los Rubros (Categorías)</h3>
          <p style={styles.paragraph}>
            Para facilitar una rápida identificación visual de los perfiles comerciales de los candidatos, cada etiqueta de Rubro recibe de manera automática una **paleta de colores pastel únicos y armoniosos** generados a partir de su ID. Estos colores se adaptan según el tema visual del sistema (claro u oscuro), garantizando que el texto mantenga un contraste adecuado y no afecte la accesibilidad visual.
          </p>

          <h3 style={styles.subSectionTitle}>4. Acceso al Manual de Usuario en la Cabecera</h3>
          <p style={styles.paragraph}>
            El presente manual se encuentra integrado de manera directa en el encabezado (Header) de la aplicación web, simbolizado por el icono de un libro abierto (<code>BookOpen</code>). Esto permite acceder a toda la documentación de ayuda de forma instantánea y en una ventana modal emergente desde cualquier pantalla en la que se encuentre trabajando el operario, optimizando el flujo diario.
          </p>
        </div>
      )
    },
    {
      id: 'personal',
      title: 'Administración de Personal',
      icon: <Database size={18} />,
      content: (
        <div>
          <h2 style={styles.sectionTitle}>Gestión de Cuentas de Operadores</h2>
          <p style={styles.paragraph}>
            El administrador principal del sistema (`SuperAdmin`) dispone de la pestaña de **Personal**
            para coordinar el equipo de trabajo de la oficina:
          </p>
          <div style={styles.listSteps}>
            <div style={styles.stepItem}>
              <span style={{ ...styles.stepNumber, backgroundColor: '#7c3aed' }}>1</span>
              <div>
                <strong>Crear Nuevos Usuarios:</strong> Permite registrar operadores ingresando su nombre, nombre de usuario, contraseña inicial y rol asignado.
              </div>
            </div>
            <div style={styles.stepItem}>
              <span style={{ ...styles.stepNumber, backgroundColor: '#7c3aed' }}>2</span>
              <div>
                <strong>Cambiar Contraseñas:</strong> En caso de olvido o renovación de seguridad, el administrador puede modificar la clave de acceso de cualquier entrevistador.
              </div>
            </div>
            <div style={styles.stepItem}>
              <span style={{ ...styles.stepNumber, backgroundColor: '#7c3aed' }}>3</span>
              <div>
                <strong>Bajas del Sistema (Soft-Delete):</strong> Permite inhabilitar la cuenta del personal de forma lógica. El operador inactivo ya no podrá iniciar sesión en el sistema, y su sesión y acceso serán revocados inmediatamente en su próxima petición al backend. Todo su historial de entrevistas guardadas se preservará de manera consistente.
              </div>
            </div>
          </div>

          <h3 style={styles.subSectionTitle}>🔒 Políticas de Seguridad de Cuentas</h3>
          <p style={styles.paragraph}>
            Para resguardar el sistema, se aplican las siguientes reglas de seguridad de cuentas:
          </p>
          <ul style={{ ...styles.bulletList, paddingLeft: '20px', margin: '0 0 16px 0' }}>
            <li style={{ marginBottom: '6px' }}><strong>Complejidad de Contraseñas:</strong> Al crear un usuario o cambiar una clave, la nueva contraseña debe cumplir obligatoriamente con una política de seguridad: mínimo 8 caracteres de longitud, al menos una letra mayúscula, un número y un carácter especial (ej. `!@#$%^&*`).</li>
            <li style={{ marginBottom: '6px' }}><strong>Control de Intentos Fallidos (Rate Limiting):</strong> Si un usuario (o atacante) comete 5 intentos fallidos consecutivos de login en un periodo corto, el sistema bloqueará temporalmente la dirección IP de origen por 15 minutos para prevenir ataques de fuerza bruta.</li>
            <li style={{ marginBottom: '0' }}><strong>Revocación de Sesiones:</strong> Al cambiar el estado de un usuario a inactivo o eliminarlo, el validador del backend interrumpe su acceso al instante, denegando el uso del token JWT previamente emitido.</li>
          </ul>
        </div>
      )
    }
  ];

  return (
    <div className="fade-in" style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <BookOpen size={28} style={{ color: '#3b82f6' }} />
        <div>
          <h1 style={styles.title}>Manual de Usuario</h1>
          <p style={styles.subtitle}>Aprende a navegar y utilizar las herramientas del Sistema de Bolsa de Trabajo.</p>
        </div>
      </div>

      <div style={styles.layout}>
        {/* Navigation Sidebar */}
        <div style={styles.sidebar}>
          {sections.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              style={{
                ...styles.navItem,
                backgroundColor: activeSection === section.id ? 'var(--bg-alt-hex)' : 'transparent',
                color: activeSection === section.id ? 'var(--text-main-hex)' : 'var(--text-muted-hex)',
                fontWeight: activeSection === section.id ? 600 : 500,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {section.icon}
                {section.title}
              </span>
              <ChevronRight size={16} style={{ opacity: activeSection === section.id ? 1 : 0, transition: 'var(--transition)' }} />
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
