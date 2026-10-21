import { useState, useEffect } from 'react';
import Login from './Login';
import Dashboard from './Dashboard';
import CandidateForm from './CandidateForm';
import CandidateCV from './CandidateCV';
import UserManual from './UserManual';
import Empresas from './Empresas';
import logoSjCiudad from './assets/sj_ciudad.png';
import logoSafe from './assets/logo_safe.png';
import logoSafeDark from './assets/logo_safe_dark.png';
import { 
  LogOut, Users, FileText, UserPlus, Loader2, AlertCircle, 
  Briefcase, MapPin, GraduationCap, UserCheck, Calendar, Clock, BarChart3,
  Key, Plus, X, Trash2, BookOpen, Check, ChevronLeft, ChevronRight, ChevronUp,
  Sun, Moon, Heart, Printer, Download, Settings, Edit2, Building2
} from 'lucide-react';

type ViewState = 'dashboard' | 'create-candidate' | 'edit-candidate' | 'view-cv';
type TabState = 'postulantes' | 'empresas' | 'informes' | 'personal' | 'manual';

interface DecodedToken {
  sub: string;
  role: string;
  nombreCompleto: string;
  userId: number;
  exp: number;
}

function parseJwt(token: string): DecodedToken | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

declare global {
  interface Window {
    showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
    showConfirm: (options: {
      title: string;
      message: string;
      onConfirm: () => void;
      onCancel?: () => void;
    }) => void;
  }
}

const getFormattedDate = () => {
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    day: 'numeric',
    month: 'long', 
    year: 'numeric' 
  };
  const today = new Date();
  const dateString = today.toLocaleDateString('es-AR', options);
  return dateString.charAt(0).toUpperCase() + dateString.slice(1);
};

export default function App() {
  const [token, setToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  const [view, setView] = useState<ViewState>('dashboard');
  const [activeTab, setActiveTab] = useState<TabState>('postulantes');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [rubrosChangedCount, setRubrosChangedCount] = useState(0);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const user = await response.json();
          const normalizedRole = user.role ? user.role.replace('ROLE_', '') : null;
          setUserRole(normalizedRole);
          setUserDisplayName(user.nombreCompleto);
          setUsername(user.username);
          setToken('session-cookie'); // Bypasses !token check
          
          // Cargar el tema guardado específico para este usuario si existe
          const userSavedTheme = localStorage.getItem(`theme_${user.username}`);
          if (userSavedTheme === 'dark' || userSavedTheme === 'light') {
            setTheme(userSavedTheme);
          }
        }
      } catch (err) {
        console.error("Error verifying active session:", err);
      } finally {
        setInitializing(false);
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('theme', theme);
    if (username) {
      localStorage.setItem(`theme_${username}`, theme);
    }
  }, [theme, username]);
  const [activeCandidateId, setActiveCandidateId] = useState<number | null>(null);
  const [candidateIdsList, setCandidateIdsList] = useState<number[]>([]);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Catalog state variables
  const [rubros, setRubros] = useState<any[]>([]);
  const [barrios, setBarrios] = useState<any[]>([]);
  const [nivelesEducativos, setNivelesEducativos] = useState<string[]>([]);
  const [estadosLaborales, setEstadosLaborales] = useState<string[]>([]);
  const [activeConfigTab, setActiveConfigTab] = useState<'rubros' | 'barrios' | 'niveles' | 'estados'>('rubros');

  // Input states for catalogs
  const [newCatalogName, setNewCatalogName] = useState('');
  const [editingCatalogId, setEditingCatalogId] = useState<number | null>(null);
  const [editingCatalogIdx, setEditingCatalogIdx] = useState<number | null>(null);
  const [editingCatalogName, setEditingCatalogName] = useState('');
  const [savingCatalog, setSavingCatalog] = useState(false);

  const syncCatalogosConfigFromServer = async () => {
    try {
      const res = await fetch('/api/catalogos-config');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.nivelesEducativos)) {
          setNivelesEducativos(data.nivelesEducativos);
          localStorage.setItem('oficina_empleo_niveles_educativos', JSON.stringify(data.nivelesEducativos));
        }
        if (Array.isArray(data.estadosLaborales)) {
          setEstadosLaborales(data.estadosLaborales);
          localStorage.setItem('oficina_empleo_estados_laborales', JSON.stringify(data.estadosLaborales));
        }
        return;
      }
    } catch {
      // Fallback a localStorage si aún no hay sesión o red
    }
    const savedNiveles = localStorage.getItem('oficina_empleo_niveles_educativos');
    if (savedNiveles) {
      setNivelesEducativos(JSON.parse(savedNiveles));
    } else {
      const defaults = ['Primario', 'Secundario', 'Terciario', 'Universitario', 'Posgrado'];
      setNivelesEducativos(defaults);
      localStorage.setItem('oficina_empleo_niveles_educativos', JSON.stringify(defaults));
    }

    const savedEstados = localStorage.getItem('oficina_empleo_estados_laborales');
    if (savedEstados) {
      setEstadosLaborales(JSON.parse(savedEstados));
    } else {
      const defaults = ['Entrevista', 'Empleado', 'En búsqueda activa', 'Rechazado', 'Programa Social', 'Desempleado'];
      setEstadosLaborales(defaults);
      localStorage.setItem('oficina_empleo_estados_laborales', JSON.stringify(defaults));
    }
  };

  const saveCatalogosConfigToServer = async (niveles: string[], estados: string[]) => {
    try {
      await fetch('/api/catalogos-config', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ nivelesEducativos: niveles, estadosLaborales: estados })
      });
    } catch (err) {
      console.error('Error sincronizando catálogos en el servidor:', err);
    }
  };

  useEffect(() => {
    syncCatalogosConfigFromServer();
  }, [token]);

  // Fetch database catalogs when settings modal opens
  useEffect(() => {
    if (!showConfigModal) return;

    const fetchCatalogs = async () => {
      try {
        await syncCatalogosConfigFromServer();
        // Fetch rubros
        const resRubros = await fetch('/api/rubros', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resRubros.ok) {
          const dataRubros = await resRubros.json();
          setRubros(dataRubros);
        }

        // Fetch barrios
        const resBarrios = await fetch('/api/barrios', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resBarrios.ok) {
          const dataBarrios = await resBarrios.json();
          setBarrios(dataBarrios);
        }
      } catch (err) {
        console.error("Error loading catalogs:", err);
      }
    };

    fetchCatalogs();
  }, [showConfigModal, token]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 1024) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
  } | null>(null);

  window.showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  };

  window.showConfirm = (options) => {
    setConfirmModal(options);
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const [stats, setStats] = useState<any | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState('');



  // States for user management (SuperAdmin only)
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<any | null>(null);

  // New user form states
  const [newUsername, setNewUsername] = useState('');
  const [newNombreCompleto, setNewNombreCompleto] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('Entrevistador');
  const [creatingUser, setCreatingUser] = useState(false);

  // Change password form states
  const [changePasswordField, setChangePasswordField] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordTargetMode, setPasswordTargetMode] = useState<'INDIVIDUAL' | 'ENTREVISTADORES' | 'ADMINISTRADORES' | 'TODOS'>('INDIVIDUAL');
  const [showPasswordPreview, setShowPasswordPreview] = useState(false);

  const fetchUsers = () => {
    setLoadingUsers(true);
    setUsersError('');
    fetch('/api/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(res => {
      if (!res.ok) {
        throw new Error('Error al cargar la lista de personal.');
      }
      return res.json();
    })
    .then((data: any) => {
      setUsers(data);
    })
    .catch(err => {
      setUsersError(err.message || 'Error de conexión.');
    })
    .finally(() => {
      setLoadingUsers(false);
    });
  };

  // Fetch users when entering the Personal tab
  useEffect(() => {
    if (activeTab === 'personal' && token) {
      fetchUsers();
    }
  }, [activeTab, token]);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim() || !newNombreCompleto.trim()) {
      window.showToast('Por favor completa todos los campos.', 'error');
      return;
    }
    setCreatingUser(true);
    fetch('/api/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: newUsername.trim(),
        password: newPassword.trim(),
        nombreCompleto: newNombreCompleto.trim(),
        role: newRole
      })
    })
    .then(async res => {
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Error al crear el usuario.');
      }
      return res.json();
    })
    .then(() => {
      window.showToast('Usuario creado con éxito.', 'success');
      setShowCreateUserModal(false);
      setNewUsername('');
      setNewPassword('');
      setNewNombreCompleto('');
      setNewRole('Entrevistador');
      fetchUsers();
    })
    .catch(err => {
      window.showToast(err.message || 'Ocurrió un error.', 'error');
    })
    .finally(() => {
      setCreatingUser(false);
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!changePasswordField.trim()) {
      window.showToast('Por favor ingresa la nueva contraseña.', 'error');
      return;
    }
    if (passwordTargetMode === 'INDIVIDUAL' && !selectedUserForPassword) {
      window.showToast('Selecciona un usuario válido.', 'error');
      return;
    }

    setChangingPassword(true);
    const isBulk = passwordTargetMode !== 'INDIVIDUAL';
    const endpoint = isBulk ? '/api/users/bulk-password' : `/api/users/${selectedUserForPassword.id}/password`;
    const payload = isBulk
      ? { password: changePasswordField.trim(), scope: passwordTargetMode }
      : { password: changePasswordField.trim() };

    fetch(endpoint, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    .then(async res => {
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Error al cambiar la contraseña.');
      }
      return res.json();
    })
    .then((data) => {
      window.showToast(data?.message || 'Contraseña actualizada con éxito.', 'success');
      setShowChangePasswordModal(false);
      setSelectedUserForPassword(null);
      setChangePasswordField('');
      setPasswordTargetMode('INDIVIDUAL');
      setShowPasswordPreview(false);
    })
    .catch(err => {
      window.showToast(err.message || 'Ocurrió un error.', 'error');
    })
    .finally(() => {
      setChangingPassword(false);
    });
  };

  const handleToggleUserStatus = (userId: number, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    fetch(`/api/users/${userId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        activo: nextStatus
      })
    })
    .then(async res => {
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Error al cambiar el estado de la cuenta.');
      }
      return res.json();
    })
    .then(() => {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, activo: nextStatus } : u));
    })
    .catch(err => {
      window.showToast(err.message || 'Ocurrió un error.', 'error');
    });
  };

  const handleDeleteUser = (userId: number, name: string) => {
    window.showConfirm({
      title: 'Eliminar Personal',
      message: `¿Estás seguro de que deseas eliminar al usuario de personal "${name}"?`,
      onConfirm: () => {
        fetch(`/api/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then(async res => {
          if (!res.ok) {
            const text = await res.text();
            throw new Error(text || 'Error al eliminar el usuario.');
          }
          return res.json();
        })
        .then(() => {
          window.showToast('Usuario de personal eliminado con éxito.', 'success');
          setUsers(prev => prev.filter(u => u.id !== userId));
        })
        .catch(err => {
          window.showToast(err.message || 'Ocurrió un error.', 'error');
        });
      }
    });
  };

  // Decode JWT on load or change
  useEffect(() => {
    if (token) {
      if (token === 'session-cookie') {
        // Skip parsing since it was set via session-cookie and user profile details were already loaded
        return;
      }
      const decoded = parseJwt(token);
      if (decoded) {
        const normalizedRole = decoded.role ? decoded.role.replace('ROLE_', '') : null;
        setUserRole(normalizedRole);
        setUserDisplayName(decoded.nombreCompleto);
        setUsername(decoded.sub);
        
        // Cargar el tema guardado específico para este usuario si existe
        const userSavedTheme = localStorage.getItem(`theme_${decoded.sub}`);
        if (userSavedTheme === 'dark' || userSavedTheme === 'light') {
          setTheme(userSavedTheme);
        }
      } else {
        handleLogout();
      }
    } else {
      setUserRole(null);
      setUserDisplayName(null);
      setUsername(null);
      setTheme('light');
    }
  }, [token]);

  const fetchStats = () => {
    if (!token) return;
    setLoadingStats(true);
    setStatsError('');

    const url = `/api/stats`;

    fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(res => {
      if (!res.ok) {
        throw new Error('Error al cargar estadísticas avanzadas.');
      }
      return res.json();
    })
    .then((data: any) => {
      setStats(data);
    })
    .catch(err => {
      setStatsError(err.message || 'Error de conexión.');
    })
    .finally(() => {
      setLoadingStats(false);
    });
  };

  // Fetch statistics when entering the Reports tab
  useEffect(() => {
    if (activeTab === 'informes' && token) {
      fetchStats();
    }
  }, [activeTab, token]);

  const getInterviewerBarColor = (idx: number) => {
    const colors = [
      '#3b82f6', // blue
      '#10b981', // green
      '#8b5cf6', // purple
      '#f59e0b', // amber
      '#ec4899', // pink
      '#14b8a6', // teal
    ];
    return colors[idx % colors.length];
  };

  const exportToCSV = () => {
    if (!stats) return;

    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "REPORTE ESTADÍSTICO - BOLSA DE TRABAJO\n";
    csvContent += `Fecha de Generación: ${new Date().toLocaleDateString('es-AR')}\n\n`;

    // Métricas generales
    csvContent += "MÉTRICAS GENERALES\n";
    csvContent += `Total de Postulantes;${stats.total}\n`;
    csvContent += `Agregados última semana;${stats.lastWeek}\n`;
    csvContent += `Agregados último mes;${stats.lastMonth}\n`;
    csvContent += `Edad promedio;${stats.ageStats?.promedio || 0} años\n\n`;

    // Desempeño de entrevistadores
    csvContent += "DESEMPEÑO DE ENTREVISTADORES\n";
    csvContent += "Entrevistador;Cantidad de Postulantes\n";
    stats.byInterviewer?.forEach((item: any) => {
      csvContent += `"${item.name}";${item.count}\n`;
    });
    csvContent += "\n";

    // Estado laboral
    csvContent += "DISTRIBUCIÓN POR ESTADO LABORAL\n";
    csvContent += "Estado;Cantidad\n";
    Object.entries(stats.byEstadoLaboral || {}).forEach(([key, val]: any) => {
      csvContent += `"${key.replace(/_/g, ' ')}";${val}\n`;
    });
    csvContent += "\n";

    // Nivel educativo
    csvContent += "NIVEL DE EDUCACIÓN ALCANZADO\n";
    csvContent += "Nivel;Cantidad\n";
    stats.byNivelEducativo?.forEach((item: any) => {
      csvContent += `"${item.level}";${item.count}\n`;
    });
    csvContent += "\n";

    // Barrios
    csvContent += "TOP 5 BARRIOS\n";
    csvContent += "Barrio;Cantidad\n";
    stats.byBarrio?.forEach((item: any) => {
      csvContent += `"${item.name}";${item.count}\n`;
    });
    csvContent += "\n";

    // Edades
    csvContent += "DISTRIBUCIÓN POR RANGOS DE EDAD\n";
    csvContent += "Rango;Cantidad\n";
    Object.entries(stats.ageStats?.rangos || {}).forEach(([key, val]: any) => {
      csvContent += `"${key}";${val}\n`;
    });
    csvContent += "\n";

    // CUD
    csvContent += "ESTADO CUD (DISCAPACIDAD)\n";
    csvContent += `Con certificado (CUD);${stats.cudStats?.conCud || 0}\n`;
    csvContent += `Sin certificado (CUD);${stats.cudStats?.sinCud || 0}\n\n`;
    csvContent += "Tipos de Discapacidad;\n";
    Object.entries(stats.cudStats?.tipos || {}).forEach(([key, val]: any) => {
      csvContent += `"${key.replace(/_/g, ' ')}";${val}\n`;
    });
    csvContent += "\n";

    // Empresas
    if (stats.empresaStats) {
      const emp = stats.empresaStats;
      csvContent += "MÉTRICAS GENERALES DE EMPRESAS\n";
      csvContent += `Total de Empresas Relevadas;${emp.total || 0}\n`;
      csvContent += `Relevadas última semana;${emp.lastWeek || 0}\n`;
      csvContent += `Relevadas último mes;${emp.lastMonth || 0}\n`;
      csvContent += `Buscan personal activamente;${emp.buscandoPersonal || 0}\n\n`;

      csvContent += "DESEMPEÑO DE ENTREVISTADORES (EMPRESAS)\n";
      csvContent += "Entrevistador;Cantidad de Empresas\n";
      emp.byInterviewer?.forEach((item: any) => {
        csvContent += `"${item.name}";${item.count}\n`;
      });
      csvContent += "\n";

      csvContent += "DEMANDA DE PERSONAL (EMPRESAS)\n";
      csvContent += "Estado de Demanda;Cantidad\n";
      Object.entries(emp.byInteresIncorporar || {}).forEach(([key, val]: any) => {
        csvContent += `"${key}";${val}\n`;
      });
      csvContent += "\n";

      csvContent += "EMPRESAS POR RUBRO\n";
      csvContent += "Rubro;Cantidad\n";
      emp.byRubro?.forEach((item: any) => {
        csvContent += `"${item.name}";${item.count}\n`;
      });
      csvContent += "\n";

      csvContent += "TOP 5 BARRIOS CON MÁS EMPRESAS\n";
      csvContent += "Barrio;Cantidad\n";
      emp.byBarrio?.forEach((item: any) => {
        csvContent += `"${item.name}";${item.count}\n`;
      });
      csvContent += "\n";

      csvContent += "DOTACIÓN DE EMPLEADOS (EMPRESAS)\n";
      csvContent += "Rango;Cantidad\n";
      Object.entries(emp.byCantidadEmpleados || {}).forEach(([key, val]: any) => {
        csvContent += `"${key}";${val}\n`;
      });
      csvContent += "\n";

      csvContent += "INTERÉS EN PROGRAMAS DE EMPLEO MUNICIPAL\n";
      csvContent += `Con interés;${emp.programasStats?.conInteres || 0}\n`;
      csvContent += `Sin interés / No indicado;${emp.programasStats?.sinInteres || 0}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_estadistico_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.showToast("Reporte CSV descargado con éxito.", "success");
  };

  // Sincronizar token
  const handleLoginSuccess = (newToken: string, userProfile?: { username: string; role: string; nombreCompleto: string }) => {
    if (userProfile) {
      const normalizedRole = userProfile.role ? userProfile.role.replace('ROLE_', '') : null;
      setUserRole(normalizedRole);
      setUserDisplayName(userProfile.nombreCompleto);
      setUsername(userProfile.username);
      
      const userSavedTheme = localStorage.getItem(`theme_${userProfile.username}`);
      if (userSavedTheme === 'dark' || userSavedTheme === 'light') {
        setTheme(userSavedTheme);
      }
    }
    setToken(newToken);
    setView('dashboard');
    setActiveTab('postulantes');
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error("Error logging out from server:", err);
    }
    setToken(null);
    setUserRole(null);
    setUserDisplayName(null);
    setUsername(null);
    setTheme('light');
    setView('dashboard');
    setActiveTab('postulantes');
    setActiveCandidateId(null);
  };

  if (initializing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px', background: 'var(--login-bg)' }}>
        <Loader2 className="animate-spin" size={36} style={{ color: '#3b82f6' }} />
        <span style={{ color: '#64748b', fontWeight: 500 }}>Iniciando sesión...</span>
      </div>
    );
  }

  // Si no está autenticado, forzar pantalla de login
  if (!token) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(w => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const handleAddElement = async () => {
    if (!newCatalogName.trim()) return;
    setSavingCatalog(true);
    try {
      if (activeConfigTab === 'rubros') {
        const res = await fetch('/api/rubros', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre: newCatalogName.trim() })
        });
        if (res.ok) {
          const data = await res.json();
          setRubros(prev => [...prev, data]);
          setNewCatalogName('');
          setRubrosChangedCount(c => c + 1);
          window.showToast('Rubro agregado con éxito.', 'success');
        } else {
          const errText = await res.text();
          window.showToast(errText || 'Error al agregar rubro.', 'error');
        }
      } else if (activeConfigTab === 'barrios') {
        const res = await fetch('/api/barrios', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre: newCatalogName.trim() })
        });
        if (res.ok) {
          const data = await res.json();
          setBarrios(prev => [...prev, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
          setNewCatalogName('');
          window.showToast('Barrio agregado con éxito.', 'success');
        } else {
          const errText = await res.text();
          window.showToast(errText || 'Error al agregar barrio.', 'error');
        }
      } else if (activeConfigTab === 'niveles') {
        const updated = [...nivelesEducativos, newCatalogName.trim()];
        setNivelesEducativos(updated);
        localStorage.setItem('oficina_empleo_niveles_educativos', JSON.stringify(updated));
        await saveCatalogosConfigToServer(updated, estadosLaborales);
        setNewCatalogName('');
        window.showToast('Nivel educativo agregado con éxito.', 'success');
      } else if (activeConfigTab === 'estados') {
        const updated = [...estadosLaborales, newCatalogName.trim()];
        setEstadosLaborales(updated);
        localStorage.setItem('oficina_empleo_estados_laborales', JSON.stringify(updated));
        await saveCatalogosConfigToServer(nivelesEducativos, updated);
        setNewCatalogName('');
        window.showToast('Estado laboral agregado con éxito.', 'success');
      }
    } catch (err: any) {
      window.showToast(err.message || 'Error de conexión.', 'error');
    } finally {
      setSavingCatalog(false);
    }
  };

  const handleUpdateElement = async (id: number | null, idx: number | null) => {
    if (!editingCatalogName.trim()) return;
    try {
      if (activeConfigTab === 'rubros' && id !== null) {
        const res = await fetch(`/api/rubros/${id}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre: editingCatalogName.trim() })
        });
        if (res.ok) {
          const data = await res.json();
          setRubros(prev => prev.map(r => r.id === id ? data : r));
          setEditingCatalogId(null);
          setEditingCatalogName('');
          setRubrosChangedCount(c => c + 1);
          window.showToast('Rubro actualizado con éxito.', 'success');
        } else {
          const errText = await res.text();
          window.showToast(errText || 'Error al actualizar rubro.', 'error');
        }
      } else if (activeConfigTab === 'barrios' && id !== null) {
        const res = await fetch(`/api/barrios/${id}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre: editingCatalogName.trim() })
        });
        if (res.ok) {
          const data = await res.json();
          setBarrios(prev => prev.map(b => b.id === id ? data : b).sort((a, b) => a.nombre.localeCompare(b.nombre)));
          setEditingCatalogId(null);
          setEditingCatalogName('');
          window.showToast('Barrio actualizado con éxito.', 'success');
        } else {
          const errText = await res.text();
          window.showToast(errText || 'Error al actualizar barrio.', 'error');
        }
      } else if (activeConfigTab === 'niveles' && idx !== null) {
        const updated = [...nivelesEducativos];
        updated[idx] = editingCatalogName.trim();
        setNivelesEducativos(updated);
        localStorage.setItem('oficina_empleo_niveles_educativos', JSON.stringify(updated));
        await saveCatalogosConfigToServer(updated, estadosLaborales);
        setEditingCatalogIdx(null);
        setEditingCatalogName('');
        window.showToast('Nivel educativo actualizado.', 'success');
      } else if (activeConfigTab === 'estados' && idx !== null) {
        const updated = [...estadosLaborales];
        updated[idx] = editingCatalogName.trim();
        setEstadosLaborales(updated);
        localStorage.setItem('oficina_empleo_estados_laborales', JSON.stringify(updated));
        await saveCatalogosConfigToServer(nivelesEducativos, updated);
        setEditingCatalogIdx(null);
        setEditingCatalogName('');
        window.showToast('Estado laboral actualizado.', 'success');
      }
    } catch (err: any) {
      window.showToast(err.message || 'Error de conexión.', 'error');
    }
  };

  const handleDeleteElement = (id: number | null, idx: number | null, name: string) => {
    const titleMap = {
      rubros: 'Dar de baja Rubro',
      barrios: 'Dar de baja Barrio',
      niveles: 'Eliminar Nivel Educativo',
      estados: 'Eliminar Estado Laboral'
    };
    const messageMap = {
      rubros: `¿Estás seguro de que deseas dar de baja el rubro "${name}"? No se eliminarán los postulantes vinculados, pero este rubro ya no aparecerá como opción.`,
      barrios: `¿Estás seguro de que deseas dar de baja el barrio "${name}"? No se eliminarán los postulantes vinculados, pero este barrio ya no aparecerá como opción.`,
      niveles: `¿Estás seguro de que deseas eliminar el nivel educativo "${name}"?`,
      estados: `¿Estás seguro de que deseas eliminar el estado laboral "${name}"?`
    };

    window.showConfirm({
      title: titleMap[activeConfigTab],
      message: messageMap[activeConfigTab],
      onConfirm: async () => {
        try {
          if (activeConfigTab === 'rubros' && id !== null) {
            const res = await fetch(`/api/rubros/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
              setRubros(prev => prev.filter(r => r.id !== id));
              setRubrosChangedCount(c => c + 1);
              window.showToast('Rubro dado de baja.', 'success');
            } else {
              window.showToast('Error al eliminar rubro.', 'error');
            }
          } else if (activeConfigTab === 'barrios' && id !== null) {
            const res = await fetch(`/api/barrios/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
              setBarrios(prev => prev.filter(b => b.id !== id));
              window.showToast('Barrio dado de baja.', 'success');
            } else {
              window.showToast('Error al eliminar barrio.', 'error');
            }
          } else if (activeConfigTab === 'niveles' && idx !== null) {
            const updated = nivelesEducativos.filter((_, i) => i !== idx);
            setNivelesEducativos(updated);
            localStorage.setItem('oficina_empleo_niveles_educativos', JSON.stringify(updated));
            await saveCatalogosConfigToServer(updated, estadosLaborales);
            window.showToast('Nivel educativo eliminado.', 'success');
          } else if (activeConfigTab === 'estados' && idx !== null) {
            const updated = estadosLaborales.filter((_, i) => i !== idx);
            setEstadosLaborales(updated);
            localStorage.setItem('oficina_empleo_estados_laborales', JSON.stringify(updated));
            await saveCatalogosConfigToServer(nivelesEducativos, updated);
            window.showToast('Estado laboral eliminado.', 'success');
          }
        } catch (err: any) {
          window.showToast(err.message || 'Error de conexión.', 'error');
        }
      }
    });
  };

  const renderConfigModal = () => {
    if (!showConfigModal) return null;

    let activeList: { id?: number; index?: number; name: string }[] = [];
    if (activeConfigTab === 'rubros') {
      activeList = rubros.map(r => ({ id: r.id, name: r.nombre }));
    } else if (activeConfigTab === 'barrios') {
      activeList = barrios.map(b => ({ id: b.id, name: b.nombre }));
    } else if (activeConfigTab === 'niveles') {
      activeList = nivelesEducativos.map((n, idx) => ({ index: idx, name: n }));
    } else if (activeConfigTab === 'estados') {
      activeList = estadosLaborales.map((e, idx) => ({ index: idx, name: e }));
    }

    const tabLabel = {
      rubros: 'Rubro',
      barrios: 'Barrio',
      niveles: 'Nivel Educativo',
      estados: 'Estado Laboral'
    }[activeConfigTab];

    const tabPlaceholder = {
      rubros: 'Ej: Sistemas, Administración...',
      barrios: 'Ej: Centro, San Martín...',
      niveles: 'Ej: Universitario, Secundario...',
      estados: 'Ej: Entrevista, Empleado...'
    }[activeConfigTab];

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'var(--card-bg-hex)',
          borderRadius: '20px',
          border: '1px solid var(--border-hex)',
          boxShadow: 'var(--shadow-lg)',
          width: '90%',
          maxWidth: '780px',
          height: '520px',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          animation: 'fadeIn 0.2s ease forwards'
        }}>
          {/* Close Button */}
          <button
            onClick={() => {
              setShowConfigModal(false);
              setNewCatalogName('');
              setEditingCatalogId(null);
              setEditingCatalogIdx(null);
              setEditingCatalogName('');
            }}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'none',
              border: 'none',
              color: 'var(--text-muted-hex)',
              cursor: 'pointer',
              zIndex: 10
            }}
          >
            <X size={20} />
          </button>

          {/* Modal Header */}
          <div style={{ padding: '24px 32px 16px 32px', borderBottom: '1px solid var(--border-hex)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main-hex)', margin: 0 }}>
              Administrar Catálogos del Sistema
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted-hex)', marginTop: '4px', margin: 0 }}>
              Configure los valores de búsqueda, rubros, barrios, niveles educativos y estados laborales del sistema.
            </p>
          </div>

          {/* Split Panel Layout */}
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Left Column (Vertical Tabs - 1/3) */}
            <div style={{
              width: '240px',
              borderRight: '1px solid var(--border-hex)',
              backgroundColor: 'var(--bg-app-hex)',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              overflowY: 'auto'
            }}>
              {[
                { id: 'rubros', label: 'Rubros', icon: <Briefcase size={16} /> },
                { id: 'barrios', label: 'Barrios', icon: <MapPin size={16} /> },
                { id: 'niveles', label: 'Niveles Educativos', icon: <GraduationCap size={16} /> },
                { id: 'estados', label: 'Estados Laborales', icon: <UserCheck size={16} /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveConfigTab(tab.id as any);
                    setNewCatalogName('');
                    setEditingCatalogId(null);
                    setEditingCatalogIdx(null);
                    setEditingCatalogName('');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    backgroundColor: activeConfigTab === tab.id ? 'var(--sidebar-item-active-bg)' : 'transparent',
                    color: activeConfigTab === tab.id ? 'var(--sidebar-item-active-color)' : 'var(--text-muted-hex)',
                    transition: 'var(--transition)'
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Right Column (Workspace - 2/3) */}
            <div style={{
              flex: 1,
              padding: '24px 32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              overflow: 'hidden'
            }}>
              {/* Workspace Header Label */}
              <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted-hex)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
                Listado de {activeConfigTab === 'rubros' ? 'Rubros' : activeConfigTab === 'barrios' ? 'Barrios' : activeConfigTab === 'niveles' ? 'Niveles Educativos' : 'Estados Laborales'} ({activeList.length})
              </label>

              {/* Items List scrollbox */}
              <div style={{
                flex: 1,
                overflowY: 'auto',
                border: '1px solid var(--border-hex)',
                borderRadius: '12px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                backgroundColor: 'var(--bg-app-hex)'
              }}>
                {activeList.length === 0 ? (
                  <span style={{ fontSize: '13px', color: 'var(--text-muted-hex)', fontStyle: 'italic', padding: '12px' }}>
                    No hay elementos creados para esta lista.
                  </span>
                ) : (
                  activeList.map(item => {
                    const isEditing = activeConfigTab === 'rubros' || activeConfigTab === 'barrios'
                      ? editingCatalogId === item.id
                      : editingCatalogIdx === item.index;

                    return (
                      <div
                        key={item.id !== undefined ? item.id : item.index}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: 'var(--card-bg-hex)',
                          borderRadius: '8px',
                          fontSize: '13px',
                          color: 'var(--text-main-hex)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          border: '1px solid var(--border-hex)'
                        }}
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingCatalogName}
                            onChange={(e) => setEditingCatalogName(e.target.value)}
                            style={{
                              flex: 1,
                              padding: '4px 8px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-hex)',
                              backgroundColor: 'var(--bg-app-hex)',
                              color: 'var(--text-main-hex)',
                              fontSize: '13px',
                              outline: 'none'
                            }}
                            onKeyDown={async (e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                await handleUpdateElement(item.id !== undefined ? item.id : null, item.index !== undefined ? item.index : null);
                              } else if (e.key === 'Escape') {
                                setEditingCatalogId(null);
                                setEditingCatalogIdx(null);
                                setEditingCatalogName('');
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <span style={{ fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.name}
                          </span>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleUpdateElement(item.id !== undefined ? item.id : null, item.index !== undefined ? item.index : null)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#10b981',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                                title="Guardar cambios"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCatalogId(null);
                                  setEditingCatalogIdx(null);
                                  setEditingCatalogName('');
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                                title="Cancelar"
                              >
                                <X size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  if (activeConfigTab === 'rubros' || activeConfigTab === 'barrios') {
                                    setEditingCatalogId(item.id!);
                                  } else {
                                    setEditingCatalogIdx(item.index!);
                                  }
                                  setEditingCatalogName(item.name);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--text-muted-hex)',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                                title={`Editar ${tabLabel.toLowerCase()}`}
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteElement(item.id !== undefined ? item.id : null, item.index !== undefined ? item.index : null, item.name)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#ef4444',
                                  cursor: 'pointer',
                                  padding: '4px',
                                  display: 'flex',
                                  alignItems: 'center'
                                }}
                                title={`Eliminar ${tabLabel.toLowerCase()}`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input for adding new Element */}
              <div style={{ borderTop: '1px solid var(--border-hex)', paddingTop: '16px' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted-hex)', textTransform: 'uppercase', letterSpacing: '0.8px', margin: 0 }}>
                  Nuevo {tabLabel}
                </label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <input
                    type="text"
                    placeholder={tabPlaceholder}
                    value={newCatalogName}
                    onChange={(e) => setNewCatalogName(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-hex)',
                      backgroundColor: 'var(--bg-app-hex)',
                      color: 'var(--text-main-hex)',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        await handleAddElement();
                      }
                    }}
                    disabled={savingCatalog}
                  />
                  <button
                    onClick={handleAddElement}
                    className="btn-primary"
                    disabled={savingCatalog || !newCatalogName.trim()}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    Agregar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`app-container ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Left Sidebar Overlay for responsive views */}
      {!sidebarCollapsed && (
        <div 
          className="sidebar-overlay no-print" 
          onClick={() => setSidebarCollapsed(true)} 
        />
      )}

      {/* Left Sidebar (no-print) */}
      <aside className="sidebar no-print">
        <div className="sidebar-brand" style={{ padding: '10px 16px 10px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => {
              setActiveTab('postulantes');
              setView('dashboard');
              if (window.innerWidth <= 1024) setSidebarCollapsed(true);
            }}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'transform 0.2s ease-in-out'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            title="Volver al Listado de Postulantes"
          >
            <img src={logoSjCiudad} alt="SJ Ciudad" style={{ maxHeight: '42px', objectFit: 'contain' }} />
          </button>
          <button
            onClick={() => setSidebarCollapsed(true)}
            className="sidebar-collapse-toggle"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'var(--transition)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Ocultar menú"
          >
            <ChevronLeft size={18} />
          </button>
        </div>

        <nav className="sidebar-menu">
          <button
            onClick={() => {
              setActiveTab('postulantes');
              setView('dashboard');
              if (window.innerWidth <= 1024) setSidebarCollapsed(true);
            }}
            className={`sidebar-item ${activeTab === 'postulantes' ? 'active' : ''}`}
          >
            <Users size={18} />
            Postulantes
          </button>

          <button
            id="sidebar-empresas"
            onClick={() => {
              setActiveTab('empresas');
              if (window.innerWidth <= 1024) setSidebarCollapsed(true);
            }}
            className={`sidebar-item ${activeTab === 'empresas' ? 'active' : ''}`}
          >
            <Building2 size={18} />
            Empresas
          </button>

          {userRole === 'SuperAdmin' && (
            <>
              <button
                onClick={() => {
                  setActiveTab('informes');
                  if (window.innerWidth <= 1024) setSidebarCollapsed(true);
                }}
                className={`sidebar-item ${activeTab === 'informes' ? 'active' : ''}`}
              >
                <FileText size={18} />
                Informes
              </button>
              <button
                onClick={() => {
                  setActiveTab('personal');
                  if (window.innerWidth <= 1024) setSidebarCollapsed(true);
                }}
                className={`sidebar-item ${activeTab === 'personal' ? 'active' : ''}`}
              >
                <UserCheck size={18} />
                Personal
              </button>
            </>
          )}


        </nav>

        <div style={{ 
          padding: '0 24px 10px 24px', 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center'
        }}>
          <img 
            src={theme === 'dark' ? logoSafeDark : logoSafe} 
            alt="Safe Software" 
            style={{ 
              maxHeight: '130px', 
              width: '100%', 
              objectFit: 'contain',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              transformOrigin: 'bottom center'
            }} 
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-content">
        <header className="top-header no-print" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {sidebarCollapsed ? (
              <div className="header-left-container">
                <button 
                  onClick={() => setSidebarCollapsed(false)}
                  className="sidebar-toggle-btn"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: '8px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'var(--transition)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  title="Mostrar menú"
                >
                  <ChevronRight size={20} />
                </button>
                <button
                  onClick={() => {
                    setActiveTab('postulantes');
                    setView('dashboard');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'transform 0.2s ease-in-out'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  title="Volver al Listado de Postulantes"
                >
                  <img 
                    src={logoSjCiudad} 
                    alt="SJ Ciudad" 
                    style={{ maxHeight: '36px', objectFit: 'contain', userSelect: 'none' }} 
                  />
                </button>
                <span style={{ color: 'var(--border-hex)', fontSize: '16px', userSelect: 'none' }}>|</span>
                <span style={{ 
                  fontSize: '13px', 
                  color: 'var(--text-muted-hex)', 
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  userSelect: 'none'
                }}>
                  <Calendar size={15} style={{ opacity: 0.8 }} />
                  {getFormattedDate()}
                </span>
              </div>
            ) : (
              <div className="header-left-container">
                <span style={{ 
                  fontSize: '13px', 
                  color: 'var(--text-muted-hex)', 
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  userSelect: 'none'
                }}>
                  <Calendar size={15} style={{ opacity: 0.8 }} />
                  {getFormattedDate()}
                </span>
              </div>
            )}
          </div>

          <div className="header-user">
            <button
              onClick={() => {
                setActiveTab('manual');
              }}
              className="btn-manual-bounce"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: activeTab === 'manual' ? 'var(--sidebar-item-active-color)' : 'var(--text-muted-hex)',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'var(--transition)',
                marginRight: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-alt-hex)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title="Manual de Usuario"
            >
              <BookOpen size={18} />
            </button>
            <button
              onClick={() => setTheme(prev => prev === 'light' ? 'dark' : 'light')}
              className="btn-theme-toggle"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted-hex)',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'var(--transition)',
                marginRight: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-alt-hex)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title={theme === 'light' ? 'Cambiar a Modo Oscuro' : 'Cambiar a Modo Claro'}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              onClick={() => setShowConfigModal(true)}
              className="btn-config-spin"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted-hex)',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'var(--transition)',
                marginRight: '8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-alt-hex)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title="Configuración"
            >
              <Settings size={18} />
            </button>
            <span className="user-name">{userDisplayName || 'Usuario'}</span>
            <button 
              onClick={handleLogout} 
              className="logout-btn"
              title="Cerrar Sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Dynamic View Dispatcher */}
        <main style={{ flex: 1, padding: activeTab === 'postulantes' ? '0' : '40px', display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'postulantes' && (
            <>
              {view === 'dashboard' && (
                <Dashboard
                  token={token}
                  userRole={userRole || undefined}
                  rubrosChangedCount={rubrosChangedCount}
                  onNewCandidate={() => {
                    setActiveCandidateId(null);
                    setView('create-candidate');
                  }}
                  onEditCandidate={(id) => {
                    setActiveCandidateId(id);
                    setView('edit-candidate');
                  }}
                  onViewCV={(id, ids) => {
                    setActiveCandidateId(id);
                    if (ids) setCandidateIdsList(ids);
                    setView('view-cv');
                  }}
                />
              )}

              {(view === 'create-candidate' || view === 'edit-candidate') && (
                <CandidateForm
                  token={token}
                  candidateId={activeCandidateId}
                  onBack={() => setView('dashboard')}
                  onSaveSuccess={() => setView('dashboard')}
                />
              )}

              {view === 'view-cv' && activeCandidateId !== null && (() => {
                const currentIndex = candidateIdsList.indexOf(activeCandidateId);
                const hasPrev = currentIndex > 0;
                const hasNext = currentIndex < candidateIdsList.length - 1 && currentIndex !== -1;
                return (
                  <CandidateCV
                    token={token}
                    candidateId={activeCandidateId}
                    onBack={() => setView('dashboard')}
                    hasPrev={hasPrev}
                    hasNext={hasNext}
                    onPrev={() => {
                      if (hasPrev) setActiveCandidateId(candidateIdsList[currentIndex - 1]);
                    }}
                    onNext={() => {
                      if (hasNext) setActiveCandidateId(candidateIdsList[currentIndex + 1]);
                    }}
                  />
                );
              })()}
            </>
          )}

          {activeTab === 'informes' && (
            <div className="fade-in print-reports-layout" style={{ maxWidth: '100%', width: '100%', margin: '0 auto' }}>
              <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} className="no-print">
                <div>
                  <h1 style={{ fontSize: '29px', fontWeight: 700, color: 'var(--text-main-hex)' }}>Panel de Control de Estadísticas</h1>
                  <p style={{ color: 'var(--text-muted-hex)', marginTop: '4px' }}>Métricas analíticas en tiempo real y trazabilidad del personal.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button
                    onClick={exportToCSV}
                    disabled={!stats || loadingStats}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      backgroundColor: 'var(--card-bg-hex)',
                      border: '1px solid var(--border-hex)',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--text-muted-hex)',
                      cursor: 'pointer',
                      transition: 'var(--transition)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-alt-hex)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--card-bg-hex)'}
                  >
                    <Download size={16} />
                    Exportar CSV
                  </button>

                  <button
                    onClick={() => window.print()}
                    disabled={!stats || loadingStats}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      backgroundColor: 'var(--card-bg-hex)',
                      border: '1px solid var(--border-hex)',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--text-muted-hex)',
                      cursor: 'pointer',
                      transition: 'var(--transition)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-alt-hex)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--card-bg-hex)'}
                  >
                    <Printer size={16} />
                    Imprimir PDF
                  </button>

                  <button 
                    onClick={fetchStats}
                    disabled={loadingStats}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      backgroundColor: 'var(--card-bg-hex)',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: 600,
                      color: 'var(--text-muted-hex)',
                      cursor: 'pointer',
                      transition: 'var(--transition)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-alt-hex)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--card-bg-hex)'}
                  >
                    <Clock size={16} className={loadingStats ? "animate-spin" : ""} />
                    Actualizar
                  </button>
                </div>
              </div>



              {statsError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', padding: '16px', marginBottom: '24px', color: '#991b1b' }}>
                  <AlertCircle size={20} />
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{statsError}. Intenta refrescar navegando entre pestañas.</span>
                </div>
              )}

              {/* Encabezado Sección Postulantes */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '6px', height: '26px', borderRadius: '4px', backgroundColor: '#3b82f6' }}></div>
                <div>
                  <h2 style={{ fontSize: '21px', fontWeight: 700, color: 'var(--text-main-hex)', margin: 0 }}>
                    Métricas de Postulantes
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted-hex)', margin: '2px 0 0 0' }}>
                    Indicadores generales, perfil sociolaboral, nivel educativo y distribución territorial de ciudadanos.
                  </p>
                </div>
              </div>

              {/* Statistics Widgets */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                {/* Card 1: Total */}
                <div className="glass-card" style={{ backgroundColor: 'var(--card-bg-hex)', padding: '24px', borderRadius: '16px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)', transition: 'var(--transition)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted-hex)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total de Postulantes</span>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--sidebar-item-active-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={20} />
                    </div>
                  </div>
                  {loadingStats ? (
                    <Loader2 className="animate-spin" size={24} style={{ color: '#3b82f6' }} />
                  ) : (
                    <h2 style={{ fontSize: '33px', fontWeight: 800, color: 'var(--text-main-hex)' }}>
                      {stats ? stats.total.toLocaleString('es-AR') : '0'}
                    </h2>
                  )}
                  <p style={{ fontSize: '13px', color: 'var(--text-muted-hex)', marginTop: '8px' }}>Total de perfiles activos en la base de datos</p>
                </div>

                {/* Card 2: Last Week */}
                <div className="glass-card" style={{ backgroundColor: 'var(--card-bg-hex)', padding: '24px', borderRadius: '16px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)', transition: 'var(--transition)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted-hex)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Agregados Última Semana</span>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <UserPlus size={20} />
                    </div>
                  </div>
                  {loadingStats ? (
                    <Loader2 className="animate-spin" size={24} style={{ color: '#10b981' }} />
                  ) : (
                    <h2 style={{ fontSize: '33px', fontWeight: 800, color: 'var(--text-main-hex)' }}>
                      {stats ? stats.lastWeek : '0'}
                    </h2>
                  )}
                  <p style={{ fontSize: '13px', color: '#10b981', fontWeight: 600, marginTop: '8px' }}>Nuevos perfiles registrados en los últimos 7 días</p>
                </div>

                {/* Card 3: Last Month */}
                <div className="glass-card" style={{ backgroundColor: 'var(--card-bg-hex)', padding: '24px', borderRadius: '16px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)', transition: 'var(--transition)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted-hex)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Agregados Último Mes</span>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#faf5ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Calendar size={20} />
                    </div>
                  </div>
                  {loadingStats ? (
                    <Loader2 className="animate-spin" size={24} style={{ color: '#8b5cf6' }} />
                  ) : (
                    <h2 style={{ fontSize: '33px', fontWeight: 800, color: 'var(--text-main-hex)' }}>
                      {stats ? stats.lastMonth : '0'}
                    </h2>
                  )}
                  <p style={{ fontSize: '13px', color: '#8b5cf6', fontWeight: 600, marginTop: '8px' }}>Nuevos perfiles en los últimos 30 días</p>
                </div>
              </div>

              {!loadingStats && stats && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '32px' }}>
                  
                  {/* Left Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    
                    {/* Interviewers performance */}
                    <div className="report-card" style={{ backgroundColor: 'var(--card-bg-hex)', padding: '28px', borderRadius: '20px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                          <UserCheck size={20} />
                        </div>
                        <h3 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-main-hex)' }}>Desempeño de Entrevistadores</h3>
                      </div>
                      <p style={{ fontSize: '15px', color: 'var(--text-muted-hex)', marginBottom: '16px' }}>Cantidad de postulantes agregados por cada miembro del personal.</p>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {stats.byInterviewer && stats.byInterviewer.length > 0 ? (() => {
                          const totalInterviews = stats.byInterviewer.reduce((acc: number, curr: any) => acc + curr.count, 0);
                          return stats.byInterviewer.map((item: any, idx: number) => {
                            const pct = totalInterviews > 0 ? Math.round((item.count / totalInterviews) * 100) : 0;
                            return (
                              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', backgroundColor: 'var(--bg-app-hex)', borderRadius: '12px', border: '1px solid var(--border-hex)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--sidebar-item-active-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600 }}>
                                      {getInitials(item.name)}
                                    </div>
                                    <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main-hex)' }}>{item.name}</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '13px', color: 'var(--text-muted-hex)', fontWeight: 500 }}>{item.count} postulantes</span>
                                    <span style={{ backgroundColor: 'var(--primary-light)', color: 'var(--sidebar-item-active-color)', fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>
                                      {pct}%
                                    </span>
                                  </div>
                                </div>
                                <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-hex)', borderRadius: '4px', overflow: 'hidden' }}>
                                  <div className="animate-progress-bar" style={{ width: `${pct}%`, height: '100%', backgroundColor: getInterviewerBarColor(idx), borderRadius: '4px', transition: 'width 1s ease-in-out' }}></div>
                                </div>
                              </div>
                            );
                          });
                        })() : (
                          <p style={{ fontSize: '14px', color: 'var(--text-muted-hex)', textAlign: 'center', padding: '12px' }}>No hay datos de entrevistas registrados.</p>
                        )}
                      </div>
                    </div>

                    {/* Labor Status distribution */}
                    <div className="report-card" style={{ backgroundColor: 'var(--card-bg-hex)', padding: '28px', borderRadius: '20px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#fff7ed', color: '#ea580c' }}>
                          <Briefcase size={20} />
                        </div>
                        <h3 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-main-hex)' }}>Distribución por Estado Laboral</h3>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {Object.entries(stats.byEstadoLaboral || {}).map(([key, val]: any, idx) => {
                          const percentage = stats.total > 0 ? Math.round((val / stats.total) * 100) : 0;
                          let barColor = '#64748b'; // default
                          if (key === 'DESEMPLEADO') barColor = '#ef4444';
                          else if (key === 'EMPLEADO') barColor = '#10b981';
                          else if (key === 'EN_BUSQUEDA_ACTIVA') barColor = '#3b82f6';
                          else if (key === 'PROGRAMA_SOCIAL') barColor = '#f59e0b';

                          return (
                            <div key={idx}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 600, color: 'var(--text-main-hex)', marginBottom: '6px' }}>
                                <span>{key.replace(/_/g, ' ')}</span>
                                <span style={{ color: 'var(--text-muted-hex)' }}>{val} ({percentage}%)</span>
                              </div>
                              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-alt-hex)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: barColor, borderRadius: '4px' }}></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Certificado de Discapacidad (CUD) Card */}
                    <div className="report-card" style={{ backgroundColor: 'var(--card-bg-hex)', padding: '28px', borderRadius: '20px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#fee2e2', color: '#ef4444' }}>
                          <Heart size={20} />
                        </div>
                        <h3 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-main-hex)' }}>Certificado Único de Discapacidad (CUD)</h3>
                      </div>

                      {stats.cudStats ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          <div style={{ display: 'flex', gap: '16px' }}>
                            <div style={{ flex: 1, padding: '16px', backgroundColor: 'var(--bg-alt-hex)', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-hex)' }}>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted-hex)', textTransform: 'uppercase' }}>Con CUD</div>
                              <div style={{ fontSize: '24px', fontWeight: 800, color: 'hsl(var(--color-rechazado))', marginTop: '6px' }}>{stats.cudStats.conCud}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted-hex)', marginTop: '2px' }}>
                                {stats.total > 0 ? (stats.cudStats.conCud / stats.total * 100).toFixed(1) : 0}% del total
                              </div>
                            </div>
                            <div style={{ flex: 1, padding: '16px', backgroundColor: 'var(--bg-alt-hex)', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-hex)' }}>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted-hex)', textTransform: 'uppercase' }}>Sin CUD</div>
                              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main-hex)', marginTop: '6px' }}>{stats.cudStats.sinCud}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted-hex)', marginTop: '2px' }}>
                                {stats.total > 0 ? (stats.cudStats.sinCud / stats.total * 100).toFixed(1) : 0}% del total
                              </div>
                            </div>
                          </div>

                          {stats.cudStats.conCud > 0 && (
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted-hex)', textTransform: 'uppercase', marginBottom: '12px', letterSpacing: '0.5px' }}>Tipos de Discapacidad Registrados</div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {Object.entries(stats.cudStats.tipos || {}).map(([tipo, countVal]: any, idx) => {
                                  const percentage = stats.cudStats.conCud > 0 ? Math.round((countVal / stats.cudStats.conCud) * 100) : 0;
                                  return (
                                    <div key={idx}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: 'var(--text-main-hex)', marginBottom: '4px' }}>
                                        <span>{tipo.replace(/_/g, ' ')}</span>
                                        <span style={{ color: 'var(--text-muted-hex)' }}>{countVal} ({percentage}%)</span>
                                      </div>
                                      <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-alt-hex)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: '#ef4444', borderRadius: '3px' }}></div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p style={{ fontSize: '14px', color: 'var(--text-muted-hex)', textAlign: 'center' }}>Sin datos de discapacidad.</p>
                      )}
                    </div>

                  </div>

                  {/* Right Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    
                    {/* Top 5 Barrios */}
                    <div className="report-card" style={{ backgroundColor: 'var(--card-bg-hex)', padding: '28px', borderRadius: '20px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--bg-alt-hex)', color: 'var(--primary)' }}>
                          <MapPin size={20} />
                        </div>
                        <h3 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-main-hex)' }}>Top 5 Barrios con más Postulantes</h3>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        {stats.byBarrio && stats.byBarrio.length > 0 ? (
                          stats.byBarrio.map((item: any, idx: number) => {
                            const maxVal = stats.byBarrio[0].count;
                            const percentage = maxVal > 0 ? Math.round((item.count / maxVal) * 100) : 0;
                            return (
                              <div key={idx} style={{ position: 'relative', padding: '12px', backgroundColor: 'var(--bg-alt-hex)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-hex)' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${percentage}%`, backgroundColor: 'var(--primary-light)', opacity: 0.15, zIndex: 1 }}></div>
                                <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main-hex)' }}>{idx + 1}. {item.name}</span>
                                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--sidebar-item-active-color)' }}>{item.count} postulantes</span>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p style={{ fontSize: '15px', color: 'var(--text-muted-hex)', textAlign: 'center' }}>Sin datos de barrios.</p>
                        )}
                      </div>
                    </div>

                    {/* Education levels */}
                    <div className="report-card" style={{ backgroundColor: 'var(--card-bg-hex)', padding: '28px', borderRadius: '20px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                          <GraduationCap size={20} />
                        </div>
                        <h3 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-main-hex)' }}>Nivel de Educación Alcanzado</h3>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {stats.byNivelEducativo && stats.byNivelEducativo.length > 0 ? (
                          stats.byNivelEducativo.map((item: any, idx: number) => (
                            <div key={idx}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 600, color: 'var(--text-main-hex)', marginBottom: '6px' }}>
                                <span>{item.level}</span>
                                <span style={{ color: 'var(--sidebar-item-active-color)' }}>{item.count} pers.</span>
                              </div>
                              <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-alt-hex)', borderRadius: '3px', overflow: 'hidden' }}>
                                <div style={{ width: `${stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0}%`, height: '100%', backgroundColor: 'var(--sidebar-item-active-color)', borderRadius: '3px' }}></div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p style={{ fontSize: '15px', color: 'var(--text-muted-hex)', textAlign: 'center' }}>Sin datos de educación cargados.</p>
                        )}
                      </div>
                    </div>

                    {/* Gender distribution */}
                    <div className="report-card" style={{ backgroundColor: 'var(--card-bg-hex)', padding: '28px', borderRadius: '20px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--bg-alt-hex)', color: 'var(--primary)' }}>
                          <BarChart3 size={20} />
                        </div>
                        <h3 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-main-hex)' }}>Distribución de Género</h3>
                      </div>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                        {Object.entries(stats.byGenero || {}).map(([key, val]: any, idx) => (
                          <div key={idx} style={{ flex: '1 1 120px', padding: '12px', backgroundColor: 'var(--bg-alt-hex)', borderRadius: '10px', border: '1px solid var(--border-hex)', textAlign: 'center' }}>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted-hex)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{key}</div>
                            <div style={{ fontSize: '21px', fontWeight: 800, color: 'var(--text-main-hex)', marginTop: '4px' }}>{val}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Age Distribution Card */}
                    <div className="report-card" style={{ backgroundColor: 'var(--card-bg-hex)', padding: '28px', borderRadius: '20px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                          <Calendar size={20} />
                        </div>
                        <div>
                          <h3 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-main-hex)' }}>Distribución por Rango de Edad</h3>
                          {stats.ageStats && (
                            <p style={{ fontSize: '13px', color: 'var(--text-muted-hex)', marginTop: '2px' }}>
                              Edad Promedio: <strong style={{ color: 'var(--sidebar-item-active-color)' }}>{stats.ageStats.promedio} años</strong>
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {stats.ageStats?.rangos ? (
                          Object.entries(stats.ageStats.rangos).map(([range, countVal]: any, idx) => {
                            const percentage = stats.total > 0 ? Math.round((countVal / stats.total) * 100) : 0;
                            return (
                              <div key={idx}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: 'var(--text-main-hex)', marginBottom: '6px' }}>
                                  <span>{range}</span>
                                  <span style={{ color: 'var(--text-muted-hex)' }}>{countVal} ({percentage}%)</span>
                                </div>
                                <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-alt-hex)', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: '#ec4899', borderRadius: '3px' }}></div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <p style={{ fontSize: '14px', color: 'var(--text-muted-hex)', textAlign: 'center' }}>Sin datos de edad.</p>
                        )}
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* ========================================================================= */}
              {/* SECCIÓN 2: MÉTRICAS DE EMPRESAS RELEVADAS (DEBAJO DE POSTULANTES)         */}
              {/* ========================================================================= */}
              {(() => {
                const empStats = stats?.empresaStats || {
                  total: 0,
                  lastWeek: 0,
                  lastMonth: 0,
                  buscandoPersonal: 0,
                  byInterviewer: [],
                  byInteresIncorporar: {},
                  byBarrio: [],
                  byRubro: [],
                  byCantidadEmpleados: {},
                  byLocalidad: {},
                  programasStats: { conInteres: 0, sinInteres: 0 }
                };

                const interesLabels: Record<string, { label: string; color: string }> = {
                  SI: { label: 'Busca personal activamente', color: '#10b981' },
                  A_FUTURO: { label: 'Interés en incorporar a futuro', color: '#f59e0b' },
                  NO: { label: 'Sin búsquedas activas', color: '#ef4444' },
                  SIN_DATO: { label: 'Sin dato especificado', color: '#64748b' }
                };

                return (
                  <div style={{ marginTop: '56px', paddingTop: '40px', borderTop: '2px solid var(--border-hex)' }}>
                    {/* Encabezado Sección Empresas */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                      <div style={{ width: '6px', height: '26px', borderRadius: '4px', backgroundColor: '#6366f1' }}></div>
                      <div>
                        <h2 style={{ fontSize: '21px', fontWeight: 700, color: 'var(--text-main-hex)', margin: 0 }}>
                          Métricas de Empresas Relevadas
                        </h2>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted-hex)', margin: '2px 0 0 0' }}>
                          Relevamiento productivo local, demanda de personal, sectores económicos y programas de empleo.
                        </p>
                      </div>
                    </div>

                    {/* KPI Cards de Empresas (Misma estructura que Postulantes) */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                      {/* Card 1: Total Empresas */}
                      <div className="glass-card" style={{ backgroundColor: 'var(--card-bg-hex)', padding: '24px', borderRadius: '16px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)', transition: 'var(--transition)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted-hex)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total de Empresas</span>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--sidebar-item-active-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Building2 size={20} />
                          </div>
                        </div>
                        {loadingStats ? (
                          <Loader2 className="animate-spin" size={24} style={{ color: '#3b82f6' }} />
                        ) : (
                          <h2 style={{ fontSize: '33px', fontWeight: 800, color: 'var(--text-main-hex)' }}>
                            {(empStats.total || 0).toLocaleString('es-AR')}
                          </h2>
                        )}
                        <p style={{ fontSize: '13px', color: 'var(--text-muted-hex)', marginTop: '8px' }}>Total de empresas activas relevadas</p>
                      </div>

                      {/* Card 2: Relevadas Última Semana */}
                      <div className="glass-card" style={{ backgroundColor: 'var(--card-bg-hex)', padding: '24px', borderRadius: '16px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)', transition: 'var(--transition)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted-hex)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Agregadas Última Semana</span>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Plus size={20} />
                          </div>
                        </div>
                        {loadingStats ? (
                          <Loader2 className="animate-spin" size={24} style={{ color: '#10b981' }} />
                        ) : (
                          <h2 style={{ fontSize: '33px', fontWeight: 800, color: 'var(--text-main-hex)' }}>
                            {empStats.lastWeek || 0}
                          </h2>
                        )}
                        <p style={{ fontSize: '13px', color: '#10b981', fontWeight: 600, marginTop: '8px' }}>Nuevas empresas en los últimos 7 días</p>
                      </div>

                      {/* Card 3: Relevadas Último Mes */}
                      <div className="glass-card" style={{ backgroundColor: 'var(--card-bg-hex)', padding: '24px', borderRadius: '16px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)', transition: 'var(--transition)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted-hex)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Agregadas Último Mes</span>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#faf5ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Calendar size={20} />
                          </div>
                        </div>
                        {loadingStats ? (
                          <Loader2 className="animate-spin" size={24} style={{ color: '#8b5cf6' }} />
                        ) : (
                          <h2 style={{ fontSize: '33px', fontWeight: 800, color: 'var(--text-main-hex)' }}>
                            {empStats.lastMonth || 0}
                          </h2>
                        )}
                        <p style={{ fontSize: '13px', color: '#8b5cf6', fontWeight: 600, marginTop: '8px' }}>Nuevas empresas en los últimos 30 días</p>
                      </div>

                      {/* Card 4: Buscan Personal */}
                      <div className="glass-card" style={{ backgroundColor: 'var(--card-bg-hex)', padding: '24px', borderRadius: '16px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)', transition: 'var(--transition)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted-hex)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Buscan Personal</span>
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#fff7ed', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Briefcase size={20} />
                          </div>
                        </div>
                        {loadingStats ? (
                          <Loader2 className="animate-spin" size={24} style={{ color: '#ea580c' }} />
                        ) : (
                          <h2 style={{ fontSize: '33px', fontWeight: 800, color: 'var(--text-main-hex)' }}>
                            {empStats.buscandoPersonal || 0}
                          </h2>
                        )}
                        <p style={{ fontSize: '13px', color: '#ea580c', fontWeight: 600, marginTop: '8px' }}>Empresas con búsqueda activa de personal</p>
                      </div>
                    </div>

                    {/* Grilla detallada de 2 columnas para Empresas */}
                    {!loadingStats && stats && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '32px' }}>
                        {/* Columna Izquierda (Empresas) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                          {/* 1. Desempeño de Entrevistadores (Empresas) */}
                          <div className="report-card" style={{ backgroundColor: 'var(--card-bg-hex)', padding: '28px', borderRadius: '20px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                              <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                                <UserCheck size={20} />
                              </div>
                              <h3 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-main-hex)' }}>Relevamiento por Entrevistador</h3>
                            </div>
                            <p style={{ fontSize: '15px', color: 'var(--text-muted-hex)', marginBottom: '16px' }}>Cantidad de empresas relevadas por cada miembro del personal.</p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              {empStats.byInterviewer && empStats.byInterviewer.length > 0 ? (() => {
                                const totalRelevos = empStats.byInterviewer.reduce((acc: number, curr: any) => acc + curr.count, 0);
                                return empStats.byInterviewer.map((item: any, idx: number) => {
                                  const pct = totalRelevos > 0 ? Math.round((item.count / totalRelevos) * 100) : 0;
                                  return (
                                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', backgroundColor: 'var(--bg-app-hex)', borderRadius: '12px', border: '1px solid var(--border-hex)' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--sidebar-item-active-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600 }}>
                                            {getInitials(item.name)}
                                          </div>
                                          <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main-hex)' }}>{item.name}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <span style={{ fontSize: '13px', color: 'var(--text-muted-hex)', fontWeight: 500 }}>{item.count} empresas</span>
                                          <span style={{ backgroundColor: 'var(--primary-light)', color: 'var(--sidebar-item-active-color)', fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>
                                            {pct}%
                                          </span>
                                        </div>
                                      </div>
                                      <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-hex)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div className="animate-progress-bar" style={{ width: `${pct}%`, height: '100%', backgroundColor: getInterviewerBarColor(idx), borderRadius: '4px', transition: 'width 1s ease-in-out' }}></div>
                                      </div>
                                    </div>
                                  );
                                });
                              })() : (
                                <p style={{ fontSize: '14px', color: 'var(--text-muted-hex)', textAlign: 'center', padding: '12px' }}>No hay relevamientos asignados a personal.</p>
                              )}
                            </div>
                          </div>

                          {/* 2. Distribución por Demanda de Personal (Interés en Incorporar) */}
                          <div className="report-card" style={{ backgroundColor: 'var(--card-bg-hex)', padding: '28px', borderRadius: '20px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                              <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#fff7ed', color: '#ea580c' }}>
                                <Briefcase size={20} />
                              </div>
                              <h3 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-main-hex)' }}>Distribución por Demanda de Personal</h3>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                              {Object.keys(empStats.byInteresIncorporar || {}).length > 0 ? (
                                Object.entries(empStats.byInteresIncorporar || {}).map(([key, val]: any, idx) => {
                                  const percentage = empStats.total > 0 ? Math.round((val / empStats.total) * 100) : 0;
                                  const info = interesLabels[key] || { label: key.replace(/_/g, ' '), color: '#64748b' };
                                  return (
                                    <div key={idx}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 600, color: 'var(--text-main-hex)', marginBottom: '6px' }}>
                                        <span>{info.label}</span>
                                        <span style={{ color: 'var(--text-muted-hex)' }}>{val} ({percentage}%)</span>
                                      </div>
                                      <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--bg-alt-hex)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: info.color, borderRadius: '4px' }}></div>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <p style={{ fontSize: '14px', color: 'var(--text-muted-hex)', textAlign: 'center' }}>Sin datos de demanda laboral.</p>
                              )}
                            </div>
                          </div>

                          {/* 3. Interés en Programas Municipales de Empleo (Equivalente a CUD) */}
                          <div className="report-card" style={{ backgroundColor: 'var(--card-bg-hex)', padding: '28px', borderRadius: '20px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                              <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: '#faf5ff', color: '#8b5cf6' }}>
                                <Building2 size={20} />
                              </div>
                              <h3 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-main-hex)' }}>Interés en Programas de Empleo</h3>
                            </div>

                            <div style={{ display: 'flex', gap: '16px' }}>
                              <div style={{ flex: 1, padding: '16px', backgroundColor: 'var(--bg-alt-hex)', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-hex)' }}>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted-hex)', textTransform: 'uppercase' }}>Con Interés</div>
                                <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', marginTop: '6px' }}>
                                  {empStats.programasStats?.conInteres || 0}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted-hex)', marginTop: '2px' }}>
                                  {empStats.total > 0 ? ((empStats.programasStats?.conInteres || 0) / empStats.total * 100).toFixed(1) : 0}% del total
                                </div>
                              </div>
                              <div style={{ flex: 1, padding: '16px', backgroundColor: 'var(--bg-alt-hex)', borderRadius: '12px', textAlign: 'center', border: '1px solid var(--border-hex)' }}>
                                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted-hex)', textTransform: 'uppercase' }}>Sin Interés / No Indicado</div>
                                <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main-hex)', marginTop: '6px' }}>
                                  {empStats.programasStats?.sinInteres || 0}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted-hex)', marginTop: '2px' }}>
                                  {empStats.total > 0 ? ((empStats.programasStats?.sinInteres || 0) / empStats.total * 100).toFixed(1) : 0}% del total
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Columna Derecha (Empresas) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                          {/* 1. Top 5 Barrios con más Empresas */}
                          <div className="report-card" style={{ backgroundColor: 'var(--card-bg-hex)', padding: '28px', borderRadius: '20px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                              <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--bg-alt-hex)', color: 'var(--primary)' }}>
                                <MapPin size={20} />
                              </div>
                              <h3 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-main-hex)' }}>Top 5 Barrios con más Empresas</h3>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                              {empStats.byBarrio && empStats.byBarrio.length > 0 ? (
                                empStats.byBarrio.map((item: any, idx: number) => {
                                  const maxVal = empStats.byBarrio[0].count;
                                  const percentage = maxVal > 0 ? Math.round((item.count / maxVal) * 100) : 0;
                                  return (
                                    <div key={idx} style={{ position: 'relative', padding: '12px', backgroundColor: 'var(--bg-alt-hex)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border-hex)' }}>
                                      <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${percentage}%`, backgroundColor: 'var(--primary-light)', opacity: 0.15, zIndex: 1 }}></div>
                                      <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main-hex)' }}>{idx + 1}. {item.name}</span>
                                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--sidebar-item-active-color)' }}>{item.count} empresas</span>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <p style={{ fontSize: '15px', color: 'var(--text-muted-hex)', textAlign: 'center' }}>Sin datos de barrios en empresas.</p>
                              )}
                            </div>
                          </div>

                          {/* 2. Empresas por Rubro / Sector Productivo */}
                          <div className="report-card" style={{ backgroundColor: 'var(--card-bg-hex)', padding: '28px', borderRadius: '20px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                              <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                                <Briefcase size={20} />
                              </div>
                              <h3 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-main-hex)' }}>Empresas por Rubro / Sector</h3>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              {empStats.byRubro && empStats.byRubro.length > 0 ? (
                                empStats.byRubro.map((item: any, idx: number) => (
                                  <div key={idx}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 600, color: 'var(--text-main-hex)', marginBottom: '6px' }}>
                                      <span>{item.name}</span>
                                      <span style={{ color: 'var(--sidebar-item-active-color)' }}>{item.count} emp.</span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-alt-hex)', borderRadius: '3px', overflow: 'hidden' }}>
                                      <div style={{ width: `${empStats.total > 0 ? Math.round((item.count / empStats.total) * 100) : 0}%`, height: '100%', backgroundColor: 'var(--sidebar-item-active-color)', borderRadius: '3px' }}></div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <p style={{ fontSize: '15px', color: 'var(--text-muted-hex)', textAlign: 'center' }}>Sin datos de rubros en empresas.</p>
                              )}
                            </div>
                          </div>

                          {/* 3. Distribución por Localidad */}
                          <div className="report-card" style={{ backgroundColor: 'var(--card-bg-hex)', padding: '28px', borderRadius: '20px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                              <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--bg-alt-hex)', color: 'var(--primary)' }}>
                                <BarChart3 size={20} />
                              </div>
                              <h3 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-main-hex)' }}>Distribución por Localidad</h3>
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                              {Object.keys(empStats.byLocalidad || {}).length > 0 ? (
                                Object.entries(empStats.byLocalidad || {}).map(([key, val]: any, idx) => (
                                  <div key={idx} style={{ flex: '1 1 120px', padding: '12px', backgroundColor: 'var(--bg-alt-hex)', borderRadius: '10px', border: '1px solid var(--border-hex)', textAlign: 'center' }}>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted-hex)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{key}</div>
                                    <div style={{ fontSize: '21px', fontWeight: 800, color: 'var(--text-main-hex)', marginTop: '4px' }}>{val}</div>
                                  </div>
                                ))
                              ) : (
                                <p style={{ fontSize: '14px', color: 'var(--text-muted-hex)', textAlign: 'center', width: '100%' }}>Sin datos de localidad.</p>
                              )}
                            </div>
                          </div>

                          {/* 4. Distribución por Dotación (Cantidad de Empleados) */}
                          <div className="report-card" style={{ backgroundColor: 'var(--card-bg-hex)', padding: '28px', borderRadius: '20px', border: '1px solid hsl(var(--border))', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                              <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
                                <Users size={20} />
                              </div>
                              <div>
                                <h3 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-main-hex)' }}>Distribución por Dotación de Personal</h3>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted-hex)', marginTop: '2px' }}>
                                  Tamaño de las empresas según rango de empleados
                                </p>
                              </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              {Object.keys(empStats.byCantidadEmpleados || {}).length > 0 ? (
                                Object.entries(empStats.byCantidadEmpleados || {}).map(([range, countVal]: any, idx) => {
                                  const percentage = empStats.total > 0 ? Math.round((countVal / empStats.total) * 100) : 0;
                                  return (
                                    <div key={idx}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, color: 'var(--text-main-hex)', marginBottom: '6px' }}>
                                        <span>{range}</span>
                                        <span style={{ color: 'var(--text-muted-hex)' }}>{countVal} ({percentage}%)</span>
                                      </div>
                                      <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-alt-hex)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: `${percentage}%`, height: '100%', backgroundColor: '#6366f1', borderRadius: '3px' }}></div>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <p style={{ fontSize: '14px', color: 'var(--text-muted-hex)', textAlign: 'center' }}>Sin datos de dotación cargados.</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === 'personal' && (
            <div className="fade-in" style={{ maxWidth: '100%', width: '100%', margin: '0 auto', padding: '0 20px' }}>
              <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h1 style={{ fontSize: '29px', fontWeight: 700, color: 'var(--text-main-hex)' }}>Gestión de Personal</h1>
                  <p style={{ color: 'var(--text-muted-hex)', marginTop: '4px' }}>Crea entrevistadores, gestiona cuentas, cambia contraseñas individuales o masivas y administra accesos del sistema.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      setSelectedUserForPassword(users[0] || null);
                      setPasswordTargetMode('ENTREVISTADORES');
                      setChangePasswordField('');
                      setShowPasswordPreview(false);
                      setShowChangePasswordModal(true);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 18px',
                      backgroundColor: 'var(--card-bg-hex)',
                      color: 'var(--text-main-hex)',
                      border: '1px solid var(--border-hex)',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'var(--transition)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-alt-hex)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--card-bg-hex)'}
                  >
                    <Key size={16} style={{ color: '#8b5cf6' }} />
                    Cambiar Contraseñas (Masivo / Rol)
                  </button>

                  <button
                    onClick={() => setShowCreateUserModal(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 20px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '15px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'var(--transition)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
                  >
                    <Plus size={16} />
                    Nuevo Entrevistador
                  </button>
                </div>
              </div>

              {usersError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', padding: '16px', marginBottom: '24px', color: '#991b1b' }}>
                  <AlertCircle size={20} />
                  <span style={{ fontSize: '15px', fontWeight: 500 }}>{usersError}</span>
                </div>
              )}

              <div style={{
                backgroundColor: 'var(--card-bg-hex)',
                borderRadius: '16px',
                border: '1px solid var(--border-hex)',
                boxShadow: 'var(--shadow)',
                overflow: 'hidden'
              }}>
                {loadingUsers ? (
                  <div style={{ padding: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <Loader2 size={36} className="animate-spin" style={{ color: '#3b82f6' }} />
                    <span style={{ color: 'var(--text-muted-hex)', fontWeight: 500 }}>Cargando personal...</span>
                  </div>
                ) : users.length === 0 ? (
                  <div style={{ padding: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <AlertCircle size={36} style={{ color: 'var(--text-muted-hex)' }} />
                    <span style={{ color: 'var(--text-muted-hex)', fontWeight: 500 }}>No hay usuarios de personal registrados.</span>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ backgroundColor: 'var(--bg-table-header)', borderBottom: '1px solid var(--border-hex)' }}>
                          <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted-hex)', textTransform: 'uppercase', letterSpacing: '1px' }}>Nombre Completo</th>
                          <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted-hex)', textTransform: 'uppercase', letterSpacing: '1px' }}>Usuario</th>
                          <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted-hex)', textTransform: 'uppercase', letterSpacing: '1px' }}>Rol</th>
                          <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted-hex)', textTransform: 'uppercase', letterSpacing: '1px' }}>Estado</th>
                          <th style={{ padding: '16px 24px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted-hex)', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((userItem, idx) => (
                          <tr
                            key={userItem.id}
                            style={{
                              borderBottom: idx === users.length - 1 ? 'none' : '1px solid var(--border-hex)',
                              transition: 'var(--transition)'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-app-hex)')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            <td style={{ padding: '16px 24px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '50%',
                                  backgroundColor: userItem.role.includes('SuperAdmin') ? '#faf5ff' : '#eff6ff',
                                  color: userItem.role.includes('SuperAdmin') ? '#8b5cf6' : '#3b82f6',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '14px',
                                  fontWeight: 700
                                }}>
                                  {getInitials(userItem.nombreCompleto || 'U')}
                                </div>
                                <span style={{ fontWeight: 600, color: 'var(--text-main-hex)', fontSize: '15px' }}>{userItem.nombreCompleto || 'Sin Nombre'}</span>
                              </div>
                            </td>
                            <td style={{ padding: '16px 24px', color: 'var(--text-muted-hex)', fontSize: '14px' }}>{userItem.username}</td>
                            <td style={{ padding: '16px 24px' }}>
                              <span style={{
                                fontSize: '12px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                textTransform: 'uppercase',
                                backgroundColor: userItem.role.includes('SuperAdmin') ? '#f3e8ff' : '#e0f2fe',
                                color: userItem.role.includes('SuperAdmin') ? '#6b21a8' : '#0369a1'
                              }}>
                                {userItem.role.replace('ROLE_', '')}
                              </span>
                            </td>
                            <td style={{ padding: '16px 24px' }}>
                              <button
                                disabled={userItem.username === 'superadmin'}
                                onClick={() => handleToggleUserStatus(userItem.id, userItem.activo !== false)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  cursor: userItem.username === 'superadmin' ? 'default' : 'pointer',
                                  display: 'inline-flex',
                                  outline: 'none'
                                }}
                              >
                                <span className={`badge ${userItem.activo !== false ? 'badge-contratado' : 'badge-rechazado'}`} style={{ opacity: userItem.username === 'superadmin' ? 0.8 : 1 }}>
                                  {userItem.activo !== false ? 'ACTIVO' : 'INACTIVO'}
                                </span>
                              </button>
                            </td>
                            <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                <button
                                  onClick={() => {
                                    setSelectedUserForPassword(userItem);
                                    setPasswordTargetMode('INDIVIDUAL');
                                    setChangePasswordField('');
                                    setShowPasswordPreview(false);
                                    setShowChangePasswordModal(true);
                                  }}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    backgroundColor: 'transparent',
                                    border: '1px solid var(--border-hex)',
                                    color: 'var(--text-muted-hex)',
                                    fontSize: '14px',
                                    fontWeight: 500,
                                    cursor: 'pointer',
                                    transition: 'var(--transition)'
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--bg-alt-hex)';
                                    e.currentTarget.style.borderColor = 'var(--text-muted-hex)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.borderColor = 'var(--border-hex)';
                                  }}
                                >
                                  <Key size={14} />
                                  Nueva Contraseña
                                </button>
                                {userItem.username !== 'superadmin' && (
                                  <button
                                    onClick={() => handleDeleteUser(userItem.id, userItem.nombreCompleto)}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      padding: '6px',
                                      borderRadius: '8px',
                                      backgroundColor: 'transparent',
                                      border: '1px solid #fee2e2',
                                      color: '#ef4444',
                                      cursor: 'pointer',
                                      transition: 'var(--transition)'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = '#fef2f2';
                                      e.currentTarget.style.borderColor = '#fca5a5';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = 'transparent';
                                      e.currentTarget.style.borderColor = '#fee2e2';
                                    }}
                                    title="Eliminar Entrevistador"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'empresas' && (
            <Empresas token={token} userRole={userRole || undefined} />
          )}

          {activeTab === 'manual' && (
            <UserManual />
          )}
        </main>
      {/* Sleek Create User Modal */}
      {showCreateUserModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--card-bg-hex)',
            borderRadius: '20px',
            border: '1px solid var(--border-hex)',
            boxShadow: 'var(--shadow-lg)',
            width: '100%',
            maxWidth: '440px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            position: 'relative'
          }}>
            <button
              onClick={() => {
                setShowCreateUserModal(false);
                setNewUsername('');
                setNewPassword('');
                setNewNombreCompleto('');
                setNewRole('Entrevistador');
              }}
              style={{
                position: 'absolute',
                top: '24px',
                right: '24px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted-hex)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-main-hex)' }}>Nuevo Miembro del Personal</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted-hex)', marginTop: '4px' }}>Crea un nuevo usuario de tipo entrevistador o administrador.</p>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main-hex)' }}>Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Lucas Gomez"
                  value={newNombreCompleto}
                  onChange={(e) => setNewNombreCompleto(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-hex)',
                    fontSize: '14px',
                    backgroundColor: 'var(--card-bg-hex)',
                    color: 'var(--text-main-hex)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main-hex)' }}>Nombre de Usuario (Login)</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. lucas"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-hex)',
                    fontSize: '14px',
                    backgroundColor: 'var(--card-bg-hex)',
                    color: 'var(--text-main-hex)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main-hex)' }}>Contraseña Inicial</label>
                <input
                  type="password"
                  required
                  placeholder="Contraseña del personal"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-hex)',
                    fontSize: '14px',
                    backgroundColor: 'var(--card-bg-hex)',
                    color: 'var(--text-main-hex)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main-hex)' }}>Rol Asignado</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-hex)',
                    fontSize: '14px',
                    backgroundColor: 'var(--card-bg-hex)',
                    color: 'var(--text-main-hex)'
                  }}
                >
                  <option value="Entrevistador">Entrevistador</option>
                  <option value="SuperAdmin">SuperAdmin</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={creatingUser}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {creatingUser ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creando...
                  </>
                ) : (
                  'Crear Cuenta'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sleek Change Password Modal (Individual or Bulk by Role) */}
      {showChangePasswordModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--card-bg-hex)',
            borderRadius: '20px',
            border: '1px solid var(--border-hex)',
            boxShadow: 'var(--shadow-lg)',
            width: '100%',
            maxWidth: '460px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            position: 'relative'
          }}>
            <button
              onClick={() => {
                setShowChangePasswordModal(false);
                setSelectedUserForPassword(null);
                setChangePasswordField('');
                setPasswordTargetMode('INDIVIDUAL');
                setShowPasswordPreview(false);
              }}
              style={{
                position: 'absolute',
                top: '24px',
                right: '24px',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted-hex)',
                cursor: 'pointer'
              }}
            >
              <X size={20} />
            </button>

            <div>
              <h3 style={{ fontSize: '19px', fontWeight: 700, color: 'var(--text-main-hex)' }}>
                Cambiar Contraseña de Personal
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted-hex)', marginTop: '4px' }}>
                Puedes actualizar la contraseña de un usuario puntual o aplicarla masivamente a todos los entrevistadores y/o administradores.
              </p>
            </div>

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Selector de Destinatario / Alcance */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main-hex)' }}>
                  ¿A quién deseas cambiar la contraseña?
                </label>
                <select
                  value={passwordTargetMode}
                  onChange={(e) => {
                    const val = e.target.value as 'INDIVIDUAL' | 'ENTREVISTADORES' | 'ADMINISTRADORES' | 'TODOS';
                    setPasswordTargetMode(val);
                    if (val === 'INDIVIDUAL' && !selectedUserForPassword && users.length > 0) {
                      setSelectedUserForPassword(users[0]);
                    }
                  }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-hex)',
                    fontSize: '14px',
                    fontWeight: 600,
                    backgroundColor: 'var(--card-bg-hex)',
                    color: 'var(--text-main-hex)'
                  }}
                >
                  <option value="INDIVIDUAL">Usuario individual seleccionado</option>
                  <option value="ENTREVISTADORES">
                    Todos los Entrevistadores ({users.filter(u => !u.role?.toLowerCase().includes('superadmin')).length} cuentas)
                  </option>
                  <option value="ADMINISTRADORES">
                    Todos los Administradores / SuperAdmin ({users.filter(u => u.role?.toLowerCase().includes('superadmin')).length} cuentas)
                  </option>
                  <option value="TODOS">
                    Todo el Personal — Entrevistadores y Administradores ({users.length} cuentas)
                  </option>
                </select>
              </div>

              {/* Si es individual, permitir elegir cualquier usuario (entrevistador o admin) */}
              {passwordTargetMode === 'INDIVIDUAL' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main-hex)' }}>
                    Usuario a modificar
                  </label>
                  <select
                    value={selectedUserForPassword?.id || ''}
                    onChange={(e) => {
                      const found = users.find(u => u.id === Number(e.target.value));
                      if (found) setSelectedUserForPassword(found);
                    }}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-hex)',
                      fontSize: '14px',
                      backgroundColor: 'var(--card-bg-hex)',
                      color: 'var(--text-main-hex)'
                    }}
                  >
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.nombreCompleto || u.username} ({u.username}) — {u.role?.replace('ROLE_', '')}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Campo de Nueva Contraseña */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main-hex)' }}>Nueva Contraseña</label>
                  <button
                    type="button"
                    onClick={() => setShowPasswordPreview(prev => !prev)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#3b82f6',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    {showPasswordPreview ? 'Ocultar' : 'Mostrar texto'}
                  </button>
                </div>
                <input
                  type={showPasswordPreview ? 'text' : 'password'}
                  required
                  placeholder="Ej. SanJose2026!"
                  value={changePasswordField}
                  onChange={(e) => setChangePasswordField(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-hex)',
                    fontSize: '14px',
                    backgroundColor: 'var(--card-bg-hex)',
                    color: 'var(--text-main-hex)'
                  }}
                />
                <span style={{ fontSize: '12px', color: 'var(--text-muted-hex)', lineHeight: 1.4 }}>
                  Requisitos: mínimo 8 caracteres, al menos 1 mayúscula, 1 número y 1 símbolo especial (ej. <code>!@#$%</code>).
                </span>
              </div>

              <button
                type="submit"
                disabled={changingPassword}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  backgroundColor: passwordTargetMode === 'INDIVIDUAL' ? '#3b82f6' : '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {changingPassword ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  passwordTargetMode === 'INDIVIDUAL'
                    ? 'Confirmar Cambio Individual'
                    : passwordTargetMode === 'ENTREVISTADORES'
                    ? 'Aplicar a Todos los Entrevistadores'
                    : passwordTargetMode === 'ADMINISTRADORES'
                    ? 'Aplicar a Todos los Administradores'
                    : 'Aplicar a Todo el Personal'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Custom Toast Notification */}
      {toast && (
        <div className="no-print" style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          backgroundColor: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#3b82f6',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'slideIn 0.3s ease forwards',
          fontWeight: 500,
          fontSize: '14px',
        }}>
          {toast.type === 'success' && <Check size={18} />}
          {toast.type === 'error' && <AlertCircle size={18} />}
          {toast.type === 'info' && <Loader2 size={18} className="animate-spin" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          animation: 'fadeIn 0.2s ease forwards'
        }}>
          <div style={{
            backgroundColor: 'var(--card-bg-hex)',
            borderRadius: '20px',
            border: '1px solid var(--border-hex)',
            boxShadow: 'var(--shadow-lg)',
            width: '100%',
            maxWidth: '440px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            animation: 'scaleUp 0.2s ease forwards'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main-hex)', margin: 0 }}>
                {confirmModal.title}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted-hex)', margin: 0, lineHeight: 1.5 }}>
                {confirmModal.message}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  if (confirmModal.onCancel) confirmModal.onCancel();
                  setConfirmModal(null);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'var(--bg-alt-hex)',
                  color: 'var(--text-muted-hex)',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Botón para ir arriba */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="no-print"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: '#3b82f6',
            color: 'white',
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            border: 'none',
            cursor: 'pointer',
            zIndex: 999,
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2563eb';
            e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#3b82f6';
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
          }}
          title="Ir al inicio"
        >
          <ChevronUp size={24} strokeWidth={2.5} />
        </button>
      )}

      {renderConfigModal()}
      </div>
    </div>
  );
}
