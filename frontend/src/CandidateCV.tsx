import { useEffect, useState, useRef } from 'react';
import {
  ArrowLeft, Printer, User, Edit, Save, X, Plus, Trash2,
  Image as ImageIcon, Download, Mail, Phone, MapPin,
  ChevronLeft, ChevronRight, Star, MessageSquare,
  ChevronDown, ChevronUp, Loader2, AlertCircle
} from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';

interface UserProfile {
  id: number;
  username: string;
  nombreCompleto?: string;
  role: string;
}

interface Entrevista {
  id?: number;
  fechaEntrevista: string;
  objetivoConsulta: string;
  observacionesTecnicas: string;
  prioridadInsercion: string;
  estadoTramite: string;
  personal: UserProfile;
}

interface Education {
  id?: number;
  nivelAlcanzado: string;
  tituloObtenido: string;
  institucion: string;
  finalizado: boolean;
  anioUltimoAprobado?: number;
}

interface WorkExperience {
  id?: number;
  empresa: string;
  puesto: string;
  fechaInicio: string;
  fechaFin?: string;
  currentlyWorking: boolean;
  tareasRealizadas: string;
}

interface Rubro {
  id: number;
  nombre: string;
  activo?: boolean;
}

interface Barrio {
  id: number;
  nombre: string;
  activo?: boolean;
}

interface CandidateData {
  id: number;
  nombre: string;
  apellido: string;
  dni: string;
  cuil: string;
  fechaNacimiento: string;
  genero: string;
  direccion: string;
  puntosReferenciaDomicilio: string;
  telefonoPrimario: string;
  telefonoSecundario: string;
  email: string;
  estadoCivil: string;
  hijosACargo: number;
  cudDiscapacidad: boolean;
  tipoDiscapacidad: string;
  movilidadPropia: boolean;
  licenciaConducir: string;
  cvUrl: string; // Se usará para "Profesión o Título Principal"
  observacionesGenerales: string;
  habilidades: string;
  educaciones: Education[];
  experienciasLaborales: WorkExperience[];
  rubros?: Rubro[];
  barrio?: Barrio | null;
  tipoEmpleoBuscado?: string;
  situacionMonotributo?: boolean;
  situacionResponsableInscripto?: boolean;
  situacionAter?: boolean;
  situacionHabilitacionMunicipal?: boolean;
  situacionRegistroEspecifico?: string;
  tieneObraSocial?: boolean;
  planSocialActivo?: string;
  foto?: string;
  estadoLaboral?: string;
  calificacion?: number;
  notasPrivadas?: string;
  fechaRegistro?: string;
  entrevistas?: Entrevista[];
}

interface CandidateCVProps {
  token: string;
  candidateId: number;
  onBack: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export default function CandidateCV({ token, candidateId, onBack, onPrev, onNext, hasPrev, hasNext }: CandidateCVProps) {
  const [candidate, setCandidate] = useState<CandidateData | null>(null);
  const [editData, setEditData] = useState<CandidateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rubrosList, setRubrosList] = useState<Rubro[]>([]);
  const [barriosList, setBarriosList] = useState<Barrio[]>([]);
  const [newSkill, setNewSkill] = useState('');

  // Admin panel state
  const [adminNotes, setAdminNotes] = useState('');
  const [adminRating, setAdminRating] = useState(0);
  const [adminHoverRating, setAdminHoverRating] = useState(0);
  const [adminEstadoLaboral, setAdminEstadoLaboral] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isLoaded, setIsLoaded] = useState(false);

  // Interview historical states
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [newInterviewObjetivo, setNewInterviewObjetivo] = useState('');
  const [newInterviewObservaciones, setNewInterviewObservaciones] = useState('');
  const [newInterviewPrioridad, setNewInterviewPrioridad] = useState('MEDIA');
  const [newInterviewEstado, setNewInterviewEstado] = useState('PENDIENTE');
  const [savingInterview, setSavingInterview] = useState(false);
  const [expandedInterviews, setExpandedInterviews] = useState<Record<number, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchCandidate = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch(`/api/ciudadanos/${candidateId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Error al cargar currículum.');
      }

      const data = await response.json();
      setCandidate(data);
      setEditData(JSON.parse(JSON.stringify(data))); // Deep copy

      // Load admin notes and rating from database, falling back to local storage
      const dbNotes = (data.notasPrivadas !== null && data.notasPrivadas !== undefined) ? data.notasPrivadas : (localStorage.getItem(`admin_notes_${candidateId}`) || '');
      const dbRating = (data.calificacion !== null && data.calificacion !== undefined) ? data.calificacion : parseInt(localStorage.getItem(`admin_rating_${candidateId}`) || '0', 10);

      setAdminNotes(dbNotes);
      setAdminRating(dbRating);
      setAdminEstadoLaboral(data.estadoLaboral || '');
      setIsLoaded(true);
    } catch (err: any) {
      window.showToast(err.message || 'Error de conexión.', 'error');
      onBack();
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Fetch candidate data on load
  useEffect(() => {
    setIsLoaded(false);
    setSaveStatus('idle');
    fetchCandidate();
  }, [candidateId]);

  const autosaveFeedback = async () => {
    setSaveStatus('saving');
    try {
      const response = await fetch(`/api/ciudadanos/${candidateId}/admin-feedback`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          calificacion: adminRating,
          notasPrivadas: adminNotes
        })
      });

      if (!response.ok) {
        throw new Error('Error al autoguardar.');
      }

      setCandidate(prev => prev ? {
        ...prev,
        calificacion: adminRating,
        notasPrivadas: adminNotes
      } : null);

      localStorage.setItem(`admin_notes_${candidateId}`, adminNotes);
      localStorage.setItem(`admin_rating_${candidateId}`, adminRating.toString());

      setSaveStatus('saved');
      setTimeout(() => {
        setSaveStatus(current => current === 'saved' ? 'idle' : current);
      }, 2000);
    } catch (err) {
      console.error('Error in autosave:', err);
      setSaveStatus('error');
    }
  };

  useEffect(() => {
    if (!isLoaded) return;

    if (candidate && candidate.notasPrivadas === adminNotes && candidate.calificacion === adminRating) {
      return;
    }

    const timer = setTimeout(() => {
      autosaveFeedback();
    }, 1500);

    return () => clearTimeout(timer);
  }, [adminNotes, adminRating, isLoaded]);

  // Keyboard shortcuts for sequential navigation and back action
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Deactivate shortcuts when editing details or when typing in inputs/textareas
      if (isEditing) return;

      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === 'ArrowRight') {
        if (hasNext && onNext) {
          onNext();
        }
      } else if (e.key === 'ArrowLeft') {
        if (hasPrev && onPrev) {
          onPrev();
        }
      } else if (e.key === 'Escape') {
        onBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hasNext, hasPrev, onNext, onPrev, onBack, isEditing]);

  // Hide main sidebar when editing to expand screen space
  useEffect(() => {
    if (isEditing) {
      document.body.classList.add('hide-sidebar-edit');
    } else {
      document.body.classList.remove('hide-sidebar-edit');
    }
    return () => {
      document.body.classList.remove('hide-sidebar-edit');
    };
  }, [isEditing]);

  // Fetch rubros list when editing
  useEffect(() => {
    if (isEditing && rubrosList.length === 0) {
      fetch('/api/rubros', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => setRubrosList(data))
        .catch(err => console.error("Error al cargar rubros:", err));
    }
  }, [isEditing]);

  // Fetch barrios list when editing
  useEffect(() => {
    if (isEditing && barriosList.length === 0) {
      fetch('/api/barrios', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => setBarriosList(data))
        .catch(err => console.error("Error al cargar barrios:", err));
    }
  }, [isEditing]);
  const handleSaveAdminFeedback = async () => {
    setSaveStatus('saving');
    try {
      // 1. Guardar calificación y notas
      const response = await fetch(`/api/ciudadanos/${candidateId}/admin-feedback`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          calificacion: adminRating,
          notasPrivadas: adminNotes
        })
      });

      if (!response.ok) {
        throw new Error('Error al guardar el feedback del entrevistador.');
      }

      // 2. Guardar estado laboral
      const statusResponse = await fetch(`/api/ciudadanos/${candidateId}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          estadoLaboral: adminEstadoLaboral
        })
      });

      if (!statusResponse.ok) {
        throw new Error('Error al actualizar el estado laboral.');
      }

      // Also update candidate local state so it matches
      if (candidate) {
        setCandidate({
          ...candidate,
          calificacion: adminRating,
          notasPrivadas: adminNotes,
          estadoLaboral: adminEstadoLaboral
        });
      }

      // Update local storage too to keep them synced
      localStorage.setItem(`admin_notes_${candidateId}`, adminNotes);
      localStorage.setItem(`admin_rating_${candidateId}`, adminRating.toString());

      setSaveStatus('saved');
      window.showToast('Feedback y estado laboral guardados con éxito.', 'success');
      setTimeout(() => {
        setSaveStatus(current => current === 'saved' ? 'idle' : current);
      }, 2000);
    } catch (err: any) {
      setSaveStatus('error');
      window.showToast(err.message || 'Error al conectar con el servidor.', 'error');
    }
  };

  const handleSaveInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInterviewObjetivo.trim()) {
      window.showToast('El objetivo de la consulta es obligatorio.', 'error');
      return;
    }

    setSavingInterview(true);
    try {
      const response = await fetch('/api/entrevistas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ciudadanoId: candidateId,
          objetivoConsulta: newInterviewObjetivo,
          observacionesTecnicas: newInterviewObservaciones,
          prioridadInsercion: newInterviewPrioridad,
          estadoTramite: newInterviewEstado
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error al registrar la visita.');
      }

      window.showToast('Visita/Entrevista registrada con éxito.', 'success');
      
      // Reset form
      setNewInterviewObjetivo('');
      setNewInterviewObservaciones('');
      setNewInterviewPrioridad('MEDIA');
      setNewInterviewEstado('PENDIENTE');
      setShowInterviewForm(false);

      // Refresh candidate data silently to show the new interview in the timeline
      await fetchCandidate(true);
    } catch (err: any) {
      window.showToast(err.message || 'Error al conectar con el servidor.', 'error');
    } finally {
      setSavingInterview(false);
    }
  };

  const handlePrint = () => {
    const originalTitle = document.title;
    document.title = "";

    const isDark = document.body.classList.contains('dark-theme');
    if (isDark) {
      document.body.classList.remove('dark-theme');
    }

    window.print();

    if (isDark) {
      document.body.classList.add('dark-theme');
    }

    setTimeout(() => {
      document.title = originalTitle;
    }, 100);
  };

  const handleDownloadPDF = () => {
    if (!candidate) return;
    window.showToast("Generando archivo PDF...", "info");

    const element = document.querySelector('.cv-print-layout');
    if (!element) {
      window.showToast("No se encontró el diseño del currículum.", "error");
      return;
    }

    // Crear un contenedor temporal oculto en el DOM, colgado de documentElement
    // para evitar que herede clases aplicadas a document.body (como .dark-theme)
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '210mm'; // Ancho A4 exacto

    document.documentElement.appendChild(container);

    // Clonar el nodo del currículum y limpiar estilos de tarjeta de interfaz (sombras y bordes redondeados)
    const elementClone = element.cloneNode(true) as HTMLElement;
    elementClone.style.boxShadow = 'none';
    elementClone.style.border = 'none';
    elementClone.style.borderRadius = '0';
    elementClone.style.margin = '0';
    elementClone.style.width = '100%';
    elementClone.style.backgroundColor = 'white';
    elementClone.style.color = 'black';

    // Agregar clase force-light para invalidar selectores específicos de modo oscuro en CSS
    elementClone.classList.add('force-light');

    // Forzar variables CSS de modo claro DIRECTAMENTE en el elemento clonado para que html2pdf las herede e interprete
    elementClone.style.setProperty('--card-bg-hex', '#ffffff');
    elementClone.style.setProperty('--text-main-hex', '#0f172a');
    elementClone.style.setProperty('--text-muted-hex', '#475569');
    elementClone.style.setProperty('--border-hex', '#e2e8f0');
    elementClone.style.setProperty('--bg-alt-hex', '#f1f5f9');
    elementClone.style.setProperty('--primary', '217 91% 60%');
    elementClone.style.setProperty('--primary-hover', '217 91% 50%');
    elementClone.style.setProperty('--primary-light', '217 91% 95%');
    elementClone.style.setProperty('--secondary', '222 47% 11%');
    elementClone.style.setProperty('--bg-app', '210 40% 98%');
    elementClone.style.setProperty('--card-bg', '0 0% 100%');
    elementClone.style.setProperty('--text-main', '215 25% 27%');
    elementClone.style.setProperty('--text-muted', '215 16% 47%');
    elementClone.style.setProperty('--border', '214 32% 91%');
    
    container.appendChild(elementClone);

    // Configuración de html2pdf
    const opt = {
      margin: 0, // los márgenes internos ya vienen del padding del currículum
      filename: `CV_${candidate.nombre}_${candidate.apellido}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    // Ejecutar la generación del PDF usando la librería local importada
    html2pdf().set(opt).from(elementClone).save()
      .then(() => {
        document.documentElement.removeChild(container);
        window.showToast("PDF descargado con éxito.", "success");
      })
      .catch((err: any) => {
        console.error("Error generating PDF:", err);
        document.documentElement.removeChild(container);
        window.showToast("Error al generar el PDF.", "error");
      });
  };

  const sanitizeDate = (dateStr: string | undefined): string | null => {
    if (!dateStr || dateStr.trim() === '') return null;
    const trimmed = dateStr.trim();
    // Si solo tiene 4 dígitos (un año), lo completamos a un formato LocalDate válido (yyyy-01-01)
    if (/^\d{4}$/.test(trimmed)) {
      return `${trimmed}-01-01`;
    }
    return trimmed;
  };

  const handleSave = async () => {
    if (!editData) return;

    // 1. Campos obligatorios
    if (!editData.nombre.trim() || !editData.apellido.trim() || !editData.dni.trim() || !editData.cuil.trim() || !editData.fechaNacimiento || !editData.telefonoPrimario.trim()) {
      window.showToast('Por favor, completa los campos requeridos (*).', 'error');
      return;
    }

    // 2. Validar DNI
    const cleanDni = editData.dni.replace(/\D/g, '');
    if (cleanDni.length < 7 || cleanDni.length > 8) {
      window.showToast('El DNI debe tener 7 u 8 dígitos.', 'error');
      return;
    }

    // 3. Validar CUIL
    const cleanCuil = editData.cuil.replace(/\D/g, '');
    if (cleanCuil.length !== 11) {
      window.showToast('El CUIL debe tener exactamente 11 dígitos.', 'error');
      return;
    }

    // 4. Validar correlación DNI / CUIL
    if (!cleanCuil.includes(cleanDni)) {
      window.showToast('El CUIL no coincide con el DNI ingresado (el DNI debe estar contenido dentro del CUIL).', 'error');
      return;
    }

    // 5. Validar fecha de nacimiento
    const birthDate = new Date(editData.fechaNacimiento);
    const today = new Date();
    if (isNaN(birthDate.getTime())) {
      window.showToast('La fecha de nacimiento no es válida.', 'error');
      return;
    }
    if (birthDate > today) {
      window.showToast('La fecha de nacimiento no puede ser en el futuro.', 'error');
      return;
    }
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 14 || age > 100) {
      window.showToast('La edad del postulante debe estar entre 14 y 100 años.', 'error');
      return;
    }

    // 6. Validar fechas de experiencia laboral
    for (const exp of editData.experienciasLaborales) {
      if (!exp.empresa.trim() || !exp.puesto.trim()) {
        window.showToast('Por favor, completa la empresa y puesto de todas las experiencias laborales.', 'error');
        return;
      }
      if (exp.fechaInicio && exp.fechaFin && !exp.currentlyWorking) {
        const startYear = parseInt(exp.fechaInicio.substring(0, 4), 10);
        const endYear = parseInt(exp.fechaFin.substring(0, 4), 10);
        if (!isNaN(startYear) && !isNaN(endYear) && startYear > endYear) {
          window.showToast(`En la experiencia laboral (${exp.empresa}), el año de inicio no puede ser posterior al de fin.`, 'error');
          return;
        }
      }
    }

    // 7. Validar educación
    for (const edu of editData.educaciones) {
      if (!edu.institucion.trim() || !edu.nivelAlcanzado) {
        window.showToast('Por favor, completa la institución y nivel de todos los estudios.', 'error');
        return;
      }
      if (edu.anioUltimoAprobado) {
        const currentYear = new Date().getFullYear();
        if (edu.anioUltimoAprobado < 1940 || edu.anioUltimoAprobado > currentYear + 10) {
          window.showToast(`El año de egreso o último aprobado (${edu.anioUltimoAprobado}) no es válido.`, 'error');
          return;
        }
      }
    }

    setSaving(true);
    try {
      const cleanData = {
        ...editData,
        experienciasLaborales: editData.experienciasLaborales.map(exp => ({
          ...exp,
          fechaInicio: sanitizeDate(exp.fechaInicio) || '',
          fechaFin: exp.currentlyWorking ? undefined : sanitizeDate(exp.fechaFin)
        }))
      };

      const response = await fetch('/api/ciudadanos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cleanData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Error al guardar cambios.');
      }

      const updatedCandidate = await response.json();
      setCandidate(updatedCandidate);
      setEditData(JSON.parse(JSON.stringify(updatedCandidate)));
      setIsEditing(false);
      window.showToast('Currículum actualizado con éxito.', 'success');
    } catch (err: any) {
      window.showToast(err.message || 'Error al guardar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (candidate) {
      setEditData(JSON.parse(JSON.stringify(candidate)));
    }
    setIsEditing(false);
  };

  const getSkillsArray = (data: CandidateData | null) => {
    if (!data?.habilidades) return [];
    return data.habilidades.split(',').map(s => s.trim()).filter(Boolean);
  };

  const formatYearRange = (exp: WorkExperience) => {
    if (exp.currentlyWorking) {
      return 'Presente';
    }
    const start = exp.fechaInicio ? exp.fechaInicio.substring(0, 4) : '';
    const end = exp.fechaFin ? exp.fechaFin.substring(0, 4) : '';
    return start || end ? `${start} – ${end}` : '';
  };

  const formatEduYear = (edu: Education) => {
    if (edu.finalizado) {
      return edu.anioUltimoAprobado || 'Egreso';
    }
    return edu.anioUltimoAprobado ? `Cursando (${edu.anioUltimoAprobado})` : 'Cursando';
  };

  // Photo helpers
  const triggerPhotoUpload = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editData) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const MAX_WIDTH = 300;
          const MAX_HEIGHT = 300;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
            setEditData({ ...editData, foto: compressedBase64 });
          } else {
            setEditData({ ...editData, foto: event.target?.result as string });
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    if (editData) {
      setEditData({ ...editData, foto: '' });
    }
  };

  // Input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (!editData) return;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setEditData({ ...editData, [name]: checked });
    } else if (type === 'number') {
      setEditData({ ...editData, [name]: parseInt(value, 10) || 0 });
    } else {
      let val = value;
      if (name === 'dni' || name === 'cuil') {
        val = value.replace(/[^\d.\-]/g, '');
      } else if (name === 'telefonoPrimario' || name === 'telefonoSecundario') {
        val = value.replace(/[^\d\s+\-()]/g, '');
      }
      setEditData({ ...editData, [name]: val });
    }
  };

  // Skills handlers
  const handleAddSkill = () => {
    if (!newSkill.trim() || !editData) return;
    const current = getSkillsArray(editData);
    if (!current.includes(newSkill.trim())) {
      const updated = [...current, newSkill.trim()];
      setEditData({ ...editData, habilidades: updated.join(', ') });
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    if (!editData) return;
    const current = getSkillsArray(editData);
    const updated = current.filter(s => s !== skillToRemove);
    setEditData({ ...editData, habilidades: updated.join(', ') });
  };

  // Experience handlers
  const handleAddExperience = () => {
    if (!editData) return;
    const newExp: WorkExperience = {
      empresa: '',
      puesto: '',
      fechaInicio: new Date().getFullYear().toString(),
      fechaFin: '',
      currentlyWorking: false,
      tareasRealizadas: ''
    };
    setEditData({
      ...editData,
      experienciasLaborales: [...editData.experienciasLaborales, newExp]
    });
  };

  const handleRemoveExperience = (index: number) => {
    if (!editData) return;
    const updated = editData.experienciasLaborales.filter((_, i) => i !== index);
    setEditData({ ...editData, experienciasLaborales: updated });
  };

  const handleExperienceChange = (index: number, field: keyof WorkExperience, value: any) => {
    if (!editData) return;
    const updated = editData.experienciasLaborales.map((exp, i) => {
      if (i === index) {
        return { ...exp, [field]: value };
      }
      return exp;
    });
    setEditData({ ...editData, experienciasLaborales: updated });
  };

  // Education handlers
  const handleAddEducation = () => {
    if (!editData) return;
    const newEdu: Education = {
      nivelAlcanzado: 'Secundario',
      tituloObtenido: '',
      institucion: '',
      finalizado: true,
      anioUltimoAprobado: new Date().getFullYear()
    };
    setEditData({
      ...editData,
      educaciones: [...editData.educaciones, newEdu]
    });
  };

  const handleRemoveEducation = (index: number) => {
    if (!editData) return;
    const updated = editData.educaciones.filter((_, i) => i !== index);
    setEditData({ ...editData, educaciones: updated });
  };

  const handleEducationChange = (index: number, field: keyof Education, value: any) => {
    if (!editData) return;
    const updated = editData.educaciones.map((edu, i) => {
      if (i === index) {
        return { ...edu, [field]: value };
      }
      return edu;
    });
    setEditData({ ...editData, educaciones: updated });
  };

  // Rubros handlers
  const handleRubroToggle = (rubro: Rubro) => {
    if (!editData) return;
    const currentRubros = editData.rubros || [];
    const exists = currentRubros.some(r => r.id === rubro.id);
    let updatedRubros;
    if (exists) {
      updatedRubros = currentRubros.filter(r => r.id !== rubro.id);
    } else {
      updatedRubros = [...currentRubros, rubro];
    }
    setEditData({ ...editData, rubros: updatedRubros });
  };



  // Smart Skills Renderer (handles categories like Languages: Java, Frameworks: React, or general skills)
  const renderSkills = (data: CandidateData) => {
    const skills = getSkillsArray(data);
    if (skills.length === 0) return null;

    // Group by category (before ':')
    const categorized: { [key: string]: string[] } = {};
    const uncategorized: string[] = [];

    skills.forEach(skill => {
      if (skill.includes(':')) {
        const parts = skill.split(':');
        const category = parts[0].trim();
        const value = parts.slice(1).join(':').trim();
        if (!categorized[category]) {
          categorized[category] = [];
        }
        categorized[category].push(value);
      } else {
        uncategorized.push(skill);
      }
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px', color: 'var(--text-muted-hex)', lineHeight: 1.4 }}>
        {Object.entries(categorized).map(([category, values], idx) => (
          <div key={idx}>
            <strong style={{ color: 'var(--text-main-hex)' }}>{category}:</strong> {values.join(', ')}
          </div>
        ))}
        {uncategorized.length > 0 && (
          <div>
            {uncategorized.join(', ')}
          </div>
        )}
      </div>
    );
  };

  if (loading || !candidate) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <div className="animate-spin" style={{ width: '40px', height: '40px', border: '4px solid hsl(var(--primary) / 0.1)', borderTopColor: 'hsl(var(--primary))', borderRadius: '50%' }}></div>
        <span style={{ color: 'hsl(var(--text-muted))', fontWeight: 500 }}>Cargando Currículum Vitae...</span>
      </div>
    );
  }

  const displayData = isEditing ? (editData || candidate) : candidate;
  const renderCVSheet = () => (
    <div className="cv-print-layout" style={{
      backgroundColor: 'white',
      borderRadius: isEditing ? '8px' : '24px',
      boxShadow: isEditing ? '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05)' : 'var(--shadow-lg)',
      overflow: 'hidden',
      minHeight: '1050px',
      border: '1px solid hsl(var(--border))',
      padding: '44px 40px',
      fontFamily: "'Inter', 'Outfit', sans-serif",
      position: 'relative',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* SJ Ciudad Logo Top Right */}
      <div style={{ position: 'absolute', top: '40px', right: '40px', fontSize: '18px', fontWeight: 800 }}>
        <span style={{ color: '#00b4d8' }}>SJ</span> Ciudad
      </div>

      <table className="cv-print-table">
        <thead className="cv-print-thead">
          <tr>
            <td>
              <div className="cv-print-thead-spacer"></div>
            </td>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>
              {/* HEADER SECTION (Photo left, Text content right) */}
              <div className="cv-header" style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '14px' }}>
                {/* Profile Photo */}
                <div style={{
                  width: '130px',
                  height: '130px',
                  borderRadius: '24px',
                  overflow: 'hidden',
                  backgroundColor: 'var(--bg-alt-hex)',
                  border: '1px solid var(--border-hex)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {displayData.foto ? (
                    <img src={displayData.foto} alt={`${displayData.nombre} ${displayData.apellido}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <User size={64} style={{ color: 'var(--text-muted-hex)' }} />
                  )}
                </div>

                {/* Name and Contact Info */}
                <div style={{ flex: 1 }}>
                  <h1 style={{
                    fontSize: '30px',
                    color: 'var(--text-main-hex)',
                    margin: 0,
                    lineHeight: 1.2
                  }}>
                    <span style={{ fontWeight: 400 }}>{displayData.nombre} </span>
                    <span style={{ fontWeight: 700 }}>{displayData.apellido}</span>
                  </h1>

                  <div style={{ fontSize: '16px', fontWeight: 600, color: '#2563eb', marginTop: '4px' }}>
                    {displayData.cvUrl || 'Postulante'}
                  </div>

                  <div className="cv-contact-info" style={{
                    fontSize: '13px',
                    color: 'var(--text-muted-hex)',
                    marginTop: '8px',
                    fontWeight: 500,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    {displayData.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={13} style={{ flexShrink: 0, opacity: 0.7 }} />
                        <span>{displayData.email}</span>
                      </div>
                    )}
                    {displayData.telefonoPrimario && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={13} style={{ flexShrink: 0, opacity: 0.7 }} />
                        <span>{displayData.telefonoPrimario}</span>
                      </div>
                    )}
                    {(() => {
                      let addr = '';
                      if (displayData.direccion) {
                        addr = displayData.direccion;
                        if (displayData.barrio) addr += `, Barrio ${displayData.barrio.nombre}`;
                        if (displayData.puntosReferenciaDomicilio) addr += ` (${displayData.puntosReferenciaDomicilio})`;
                      } else if (displayData.barrio) {
                        addr = `Barrio ${displayData.barrio.nombre}`;
                        if (displayData.puntosReferenciaDomicilio) addr += ` (${displayData.puntosReferenciaDomicilio})`;
                      }
                      return addr ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <MapPin size={13} style={{ flexShrink: 0, opacity: 0.7 }} />
                          <span>{addr}</span>
                        </div>
                      ) : null;
                    })()}
                  </div>


                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td>
              {/* SINGLE-COLUMN LAYOUT BODY */}
              <div className="cv-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                {/* PERFIL */}
                {displayData.observacionesGenerales && displayData.observacionesGenerales.trim() && (
                  <div className="cv-section">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '4px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'hsl(var(--primary))', letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>
                        PERFIL
                      </h4>
                      <div style={{ flex: 1, height: '1.5px', backgroundColor: 'var(--border-hex)' }}></div>
                    </div>
                    <p className="cv-text" style={{ fontSize: '14px', color: 'var(--text-main-hex)', lineHeight: 1.45, textAlign: 'justify', margin: 0 }}>
                      {displayData.observacionesGenerales.replace(/^Perfil original Excel:\s*/gi, '')}
                    </p>
                  </div>
                )}

                {/* HABILIDADES / COMPETENCIAS */}
                {getSkillsArray(displayData).length > 0 && (
                  <div className="cv-section">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '4px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'hsl(var(--primary))', letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>
                        HABILIDADES
                      </h4>
                      <div style={{ flex: 1, height: '1.5px', backgroundColor: 'var(--border-hex)' }}></div>
                    </div>
                    <div className="cv-text" style={{ fontSize: '14px' }}>
                      {renderSkills(displayData)}
                    </div>
                  </div>
                )}

                {/* EXPERIENCIA LABORAL */}
                {displayData.experienciasLaborales.length > 0 && (
                  <div className="cv-section">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '6px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'hsl(var(--primary))', letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>
                        EXPERIENCIA LABORAL
                      </h4>
                      <div style={{ flex: 1, height: '1.5px', backgroundColor: 'var(--border-hex)' }}></div>
                    </div>
                    <div className="cv-item-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {displayData.experienciasLaborales.map((exp, idx) => (
                        <div key={idx} className="cv-item">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main-hex)' }}>{exp.empresa}</span>
                            <span style={{ fontSize: '13px', color: 'var(--text-muted-hex)', fontWeight: 600 }}>{formatYearRange(exp)}</span>
                          </div>
                          <div style={{ fontSize: '14px', fontStyle: 'italic', color: 'var(--text-muted-hex)', marginTop: '1px', fontWeight: 500 }}>{exp.puesto}</div>
                          {exp.tareasRealizadas && (
                            <ul style={{ paddingLeft: '20px', margin: '2px 0 0 0', fontSize: '13px', color: 'var(--text-main-hex)', lineHeight: 1.45 }}>
                              {exp.tareasRealizadas.split('\n').map(s => s.trim()).filter(Boolean).map((task, tidx) => {
                                const cleanTask = task.replace(/^[•\-\*\s]+/, '');
                                return <li key={tidx} style={{ marginBottom: '1px' }}>{cleanTask}</li>;
                              })}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* EDUCACIÓN */}
                {displayData.educaciones.length > 0 && (
                  <div className="cv-section">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '6px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'hsl(var(--primary))', letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>
                        FORMACIÓN ACADÉMICA
                      </h4>
                      <div style={{ flex: 1, height: '1.5px', backgroundColor: 'var(--border-hex)' }}></div>
                    </div>
                    <div className="cv-item-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {displayData.educaciones.map((edu, idx) => (
                        <div key={idx} className="cv-item">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-main-hex)' }}>{edu.institucion}</span>
                            <span style={{ fontSize: '13px', color: 'var(--text-muted-hex)', fontWeight: 600 }}>{formatEduYear(edu)}</span>
                          </div>
                          <div style={{ fontSize: '14px', fontStyle: 'italic', color: 'var(--text-muted-hex)', marginTop: '1px', fontWeight: 500 }}>
                            {edu.tituloObtenido || edu.nivelAlcanzado} {edu.finalizado ? '' : '(Incompleto / Cursando)'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* INTERESES / RUBROS */}
                {displayData.rubros && displayData.rubros.length > 0 && (
                  <div className="cv-section">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '4px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'hsl(var(--primary))', letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>
                        INTERESES
                      </h4>
                      <div style={{ flex: 1, height: '1.5px', backgroundColor: 'var(--border-hex)' }}></div>
                    </div>
                    <div className="cv-text" style={{ fontSize: '14px', color: 'var(--text-main-hex)', lineHeight: 1.4, fontWeight: 500 }}>
                      {displayData.rubros.map(r => r.nombre).join('  ·  ')}
                    </div>
                  </div>
                )}

                {/* INFORMACIÓN ADICIONAL */}
                {(() => {
                  const hasAdditional = displayData.movilidadPropia ||
                    (displayData.licenciaConducir && displayData.licenciaConducir !== 'NO_POSEE') ||
                    displayData.cudDiscapacidad ||
                    displayData.tieneObraSocial ||
                    displayData.planSocialActivo ||
                    displayData.estadoCivil ||
                    displayData.hijosACargo > 0;
                  if (!hasAdditional) return null;

                  const details = [];
                  if (displayData.estadoCivil) details.push(`Estado Civil: ${displayData.estadoCivil}`);
                  if (displayData.hijosACargo > 0) details.push(`Hijos a cargo: ${displayData.hijosACargo}`);
                  if (displayData.movilidadPropia) details.push(`Movilidad propia: Sí`);
                  if (displayData.licenciaConducir && displayData.licenciaConducir !== 'NO_POSEE') details.push(`Licencia: ${displayData.licenciaConducir}`);
                  if (displayData.cudDiscapacidad) details.push(`CUD Discapacidad: ${displayData.tipoDiscapacidad || 'Sí'}`);
                  if (displayData.tieneObraSocial) details.push(`Obra Social: Sí`);
                  if (displayData.planSocialActivo) details.push(`Plan Social: ${displayData.planSocialActivo}`);

                  return (
                    <div className="cv-section">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '4px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'hsl(var(--primary))', letterSpacing: '1.5px', textTransform: 'uppercase', margin: 0 }}>
                          INFORMACIÓN ADICIONAL
                        </h4>
                        <div style={{ flex: 1, height: '1.5px', backgroundColor: 'var(--border-hex)' }}></div>
                      </div>
                      <p className="cv-text" style={{ fontSize: '14px', color: 'var(--text-main-hex)', lineHeight: 1.4, margin: 0, fontWeight: 500 }}>
                        {details.join('  ·  ')}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </td>
          </tr>
        </tbody>

        <tfoot className="cv-print-tfoot">
          <tr>
            <td>
              <div className="cv-print-tfoot-spacer"></div>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );

  // Normal view mode
  if (!isEditing) {
    return (
      <div className="fade-in" style={{ padding: '40px', width: '100%' }}>
        {/* Top Action Bar (no-print) */}
        <div className="no-print" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '32px',
          maxWidth: '1200px',
          margin: '0 auto 32px auto'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={onBack}
              className="btn-secondary"
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <ArrowLeft size={16} />
              Volver al Listado
            </button>

            {/* Sequential Navigation */}
            {(onPrev || onNext) && (
              <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
                <button
                  onClick={onPrev}
                  disabled={!hasPrev}
                  className="btn-secondary"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    opacity: hasPrev ? 1 : 0.4,
                    cursor: hasPrev ? 'pointer' : 'not-allowed'
                  }}
                  title="CV Anterior"
                >
                  <ChevronLeft size={16} />
                  Anterior
                </button>
                <button
                  onClick={onNext}
                  disabled={!hasNext}
                  className="btn-secondary"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    opacity: hasNext ? 1 : 0.4,
                    cursor: hasNext ? 'pointer' : 'not-allowed'
                  }}
                  title="CV Siguiente"
                >
                  Siguiente
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setIsEditing(true)}
              className="btn-secondary"
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Edit size={16} />
              Editar CV
            </button>

            <button
              onClick={handleDownloadPDF}
              className="btn-secondary"
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Download size={16} />
              Descargar PDF
            </button>

            <button
              onClick={handlePrint}
              className="btn-primary"
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Printer size={16} />
              Imprimir
            </button>
          </div>
        </div>

        {/* Two-column layout: CV Sheet + Admin Panel */}
        <div style={{
          display: 'flex',
          gap: '24px',
          maxWidth: '1200px',
          margin: '0 auto',
          alignItems: 'flex-start'
        }}>
          {/* CV Paper Sheet */}
          <div style={{ flex: 1, maxWidth: '850px', minWidth: 0 }}>
            {renderCVSheet()}
          </div>

          {/* Admin Side Panel */}
          <div className="cv-admin-panel no-print" style={{
            width: '300px',
            flexShrink: 0,
            position: 'sticky',
            top: '100px',
            boxShadow: 'var(--shadow)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <MessageSquare size={16} style={{ color: 'hsl(var(--primary))' }} />
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main-hex)', margin: 0 }}>
                Panel del Entrevistador
              </h3>
            </div>

            {/* Star Rating */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label>Calificación</label>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => {
                      const newRating = star === adminRating ? 0 : star;
                      setAdminRating(newRating);
                      localStorage.setItem(`admin_rating_${candidateId}`, newRating.toString());
                      setSaveStatus('idle');
                    }}
                    onMouseEnter={() => setAdminHoverRating(star)}
                    onMouseLeave={() => setAdminHoverRating(0)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px',
                      transition: 'transform 0.15s ease',
                      transform: (adminHoverRating >= star || adminRating >= star) ? 'scale(1.15)' : 'scale(1)'
                    }}
                    title={`${star} estrella${star > 1 ? 's' : ''}`}
                  >
                    <Star
                      size={22}
                      fill={(adminHoverRating >= star || (!adminHoverRating && adminRating >= star)) ? '#f59e0b' : 'none'}
                      color={(adminHoverRating >= star || (!adminHoverRating && adminRating >= star)) ? '#f59e0b' : 'var(--text-muted-hex)'}
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label>Estado Laboral</label>
              <select
                value={adminEstadoLaboral}
                onChange={(e) => setAdminEstadoLaboral(e.target.value)}
                title="Seleccione el estado laboral del postulante"
              >
                {JSON.parse(localStorage.getItem('oficina_empleo_estados_laborales') || '["Entrevista", "Empleado", "En búsqueda activa", "Rechazado", "Programa Social", "Desempleado"]').map((estado: string) => {
                  const val = estado.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_');
                  return (
                    <option key={val} value={val}>
                      {estado}
                    </option>
                  );
                })}
                {adminEstadoLaboral && !JSON.parse(localStorage.getItem('oficina_empleo_estados_laborales') || '[]').map((estado: string) => estado.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_')).includes(adminEstadoLaboral) && (
                  <option value={adminEstadoLaboral}>
                    {adminEstadoLaboral === 'PROGRAMA_SOCIAL' ? 'Programa Social' :
                     adminEstadoLaboral === 'DESEMPLEADO' ? 'Desempleado' : adminEstadoLaboral}
                  </option>
                )}
              </select>
            </div>

            {/* Historial de Entrevistas y Visitas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ margin: 0 }}>Historial de Visitas</label>
                <button
                  type="button"
                  onClick={() => setShowInterviewForm(!showInterviewForm)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'hsl(var(--primary))',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    transition: 'background-color 0.15s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-alt-hex)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {showInterviewForm ? <X size={12} /> : <Plus size={12} />}
                  {showInterviewForm ? 'Cancelar' : 'Registrar'}
                </button>
              </div>

              {/* Formulario de Registro Inline */}
              {showInterviewForm && (
                <form onSubmit={handleSaveInterview} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-alt-hex)',
                  border: '1px solid var(--border-hex)',
                  marginTop: '4px'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-main-hex)' }}>Objetivo de la Consulta *</label>
                    <input
                      type="text"
                      value={newInterviewObjetivo}
                      onChange={(e) => setNewInterviewObjetivo(e.target.value)}
                      placeholder="Ej: Entrevista de seguimiento, Revisión de CV"
                      required
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        fontSize: '12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-hex)',
                        backgroundColor: 'var(--card-bg-hex)',
                        color: 'var(--text-main-hex)'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-main-hex)' }}>Observaciones / Evolución</label>
                    <textarea
                      value={newInterviewObservaciones}
                      onChange={(e) => setNewInterviewObservaciones(e.target.value)}
                      placeholder="Escriba los detalles de la evolución o notas técnicas..."
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        fontSize: '12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-hex)',
                        backgroundColor: 'var(--card-bg-hex)',
                        color: 'var(--text-main-hex)',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-main-hex)' }}>Prioridad</label>
                      <select
                        value={newInterviewPrioridad}
                        onChange={(e) => setNewInterviewPrioridad(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px',
                          fontSize: '12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-hex)',
                          backgroundColor: 'var(--card-bg-hex)',
                          color: 'var(--text-main-hex)'
                        }}
                      >
                        <option value="BAJA">Baja</option>
                        <option value="MEDIA">Media</option>
                        <option value="ALTA">Alta</option>
                      </select>
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-main-hex)' }}>Estado</label>
                      <select
                        value={newInterviewEstado}
                        onChange={(e) => setNewInterviewEstado(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '6px',
                          fontSize: '12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-hex)',
                          backgroundColor: 'var(--card-bg-hex)',
                          color: 'var(--text-main-hex)'
                        }}
                      >
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="EN_PROCESO">En Proceso</option>
                        <option value="FINALIZADO">Finalizado</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={savingInterview}
                    style={{
                      padding: '8px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      marginTop: '4px',
                      width: '100%'
                    }}
                  >
                    <Save size={12} />
                    {savingInterview ? 'Guardando...' : 'Registrar Visita'}
                  </button>
                </form>
              )}

              {/* Timeline Dinámico de Entrevistas */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                padding: '8px 0 8px 6px',
                position: 'relative',
                maxHeight: '350px',
                overflowY: 'auto',
                scrollbarWidth: 'thin'
              }}>
                {/* Línea vertical de fondo */}
                {candidate?.entrevistas && candidate.entrevistas.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    left: '11px',
                    top: '12px',
                    bottom: '12px',
                    width: '1px',
                    backgroundColor: 'var(--border-hex)'
                  }}></div>
                )}

                {candidate?.entrevistas && candidate.entrevistas.length > 0 ? (
                  candidate.entrevistas.map((entrevista) => {
                    const isExpanded = !!expandedInterviews[entrevista.id || 0];
                    const priorityColor =
                      entrevista.prioridadInsercion === 'ALTA' ? '#ef4444' :
                      entrevista.prioridadInsercion === 'MEDIA' ? '#f59e0b' : '#10b981';
                    
                    const priorityBadgeStyle = {
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor:
                        entrevista.prioridadInsercion === 'ALTA' ? 'rgba(239, 68, 68, 0.1)' :
                        entrevista.prioridadInsercion === 'MEDIA' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: priorityColor,
                      border: `1px solid ${
                        entrevista.prioridadInsercion === 'ALTA' ? 'rgba(239, 68, 68, 0.2)' :
                        entrevista.prioridadInsercion === 'MEDIA' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'
                      }`
                    };

                    const statusBadgeStyle = {
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor:
                        entrevista.estadoTramite === 'FINALIZADO' ? 'rgba(59, 130, 246, 0.1)' :
                        entrevista.estadoTramite === 'EN_PROCESO' ? 'rgba(249, 115, 22, 0.1)' : 'var(--bg-alt-hex)',
                      color:
                        entrevista.estadoTramite === 'FINALIZADO' ? '#3b82f6' :
                        entrevista.estadoTramite === 'EN_PROCESO' ? '#f97316' : 'var(--text-muted-hex)',
                      border: `1px solid ${
                        entrevista.estadoTramite === 'FINALIZADO' ? 'rgba(59, 130, 246, 0.2)' :
                        entrevista.estadoTramite === 'EN_PROCESO' ? 'rgba(249, 115, 22, 0.2)' : 'var(--border-hex)'
                      }`
                    };

                    // Helper to format date
                    const formatDate = (dateStr: string) => {
                      try {
                        const d = new Date(dateStr);
                        if (isNaN(d.getTime())) return dateStr;
                        const day = String(d.getDate()).padStart(2, '0');
                        const month = String(d.getMonth() + 1).padStart(2, '0');
                        const year = d.getFullYear();
                        return `${day}/${month}/${year}`;
                      } catch {
                        return dateStr;
                      }
                    };

                    return (
                      <div key={entrevista.id} style={{
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'flex-start',
                        position: 'relative',
                        zIndex: 1,
                        cursor: 'pointer'
                      }}
                      onClick={() => setExpandedInterviews({
                        ...expandedInterviews,
                        [entrevista.id || 0]: !isExpanded
                      })}>
                        {/* Timeline dot color coded by priority */}
                        <div style={{
                          width: '11px',
                          height: '11px',
                          borderRadius: '50%',
                          backgroundColor: priorityColor,
                          border: '2px solid var(--card-bg-hex)',
                          marginTop: '4px',
                          flexShrink: 0
                        }}></div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted-hex)', fontWeight: 600 }}>
                              {formatDate(entrevista.fechaEntrevista)}
                            </span>
                            <div style={{ display: 'flex', gap: '2px' }}>
                              {isExpanded ? <ChevronUp size={12} style={{ color: 'var(--text-muted-hex)' }} /> : <ChevronDown size={12} style={{ color: 'var(--text-muted-hex)' }} />}
                            </div>
                          </div>
                          <span style={{ fontSize: '13px', color: 'var(--text-main-hex)', fontWeight: 600, wordBreak: 'break-word' }}>
                            {entrevista.objetivoConsulta}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted-hex)', fontStyle: 'italic' }}>
                            Por: {entrevista.personal.nombreCompleto || entrevista.personal.username}
                          </span>

                          <div style={{ display: 'flex', gap: '4px', marginTop: '2px', flexWrap: 'wrap' }}>
                            <span style={priorityBadgeStyle}>{entrevista.prioridadInsercion}</span>
                            <span style={statusBadgeStyle}>{entrevista.estadoTramite.replace('_', ' ')}</span>
                          </div>

                          {isExpanded && (
                            <div style={{
                              marginTop: '6px',
                              padding: '8px 10px',
                              borderRadius: '6px',
                              backgroundColor: 'var(--bg-alt-hex)',
                              border: '1px solid var(--border-hex)',
                              fontSize: '12px',
                              color: 'var(--text-main-hex)',
                              lineHeight: 1.4,
                              wordBreak: 'break-word',
                              whiteSpace: 'pre-wrap'
                            }}>
                              {entrevista.observacionesTecnicas || <span style={{ color: 'var(--text-muted-hex)', fontStyle: 'italic' }}>Sin observaciones.</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted-hex)', fontStyle: 'italic', padding: '10px 0 10px 24px' }}>
                    No hay visitas registradas en el historial.
                  </div>
                )}
              </div>
            </div>

            {/* Private Notes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label>Notas Privadas</label>
              <textarea
                value={adminNotes}
                onChange={(e) => {
                  setAdminNotes(e.target.value);
                  localStorage.setItem(`admin_notes_${candidateId}`, e.target.value);
                  setSaveStatus('idle');
                }}
                placeholder="Escriba notas privadas sobre este postulante..."
                style={{ width: '100%' }}
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveAdminFeedback}
              className="btn-primary"
              disabled={saveStatus === 'saving'}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '8px',
                transition: 'all 0.3s ease',
                ...(saveStatus === 'saved' ? { backgroundColor: '#10b981', borderColor: '#10b981', color: 'white' } : {}),
                ...(saveStatus === 'error' ? { backgroundColor: '#ef4444', borderColor: '#ef4444', color: 'white' } : {}),
                ...(saveStatus === 'saving' ? { opacity: 0.8 } : {})
              }}
            >
              {saveStatus === 'saving' && <Loader2 size={14} className="animate-spin" />}
              {saveStatus === 'saved' && <span>✔</span>}
              {saveStatus === 'idle' && <Save size={14} />}
              {saveStatus === 'error' && <AlertCircle size={14} />}
              
              {saveStatus === 'saving' && 'Guardando...'}
              {saveStatus === 'saved' && 'Guardado'}
              {saveStatus === 'idle' && 'Guardar Feedback'}
              {saveStatus === 'error' && 'Error al guardar'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Split Screen Editor mode
  return (
    <div className="fade-in no-print" style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 70px)',
      overflow: 'hidden',
      width: '100%'
    }}>
      {/* Editor Header */}
      <div style={{
        height: '60px',
        backgroundColor: 'var(--card-bg-hex)',
        borderBottom: '1px solid var(--border-hex)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main-hex)' }}>
            Editor de Currículum: {candidate.nombre} {candidate.apellido}
          </h2>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleCancel}
            className="btn-secondary"
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <X size={14} />
            Cancelar
          </button>

          <button
            onClick={handleDownloadPDF}
            className="btn-secondary"
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Download size={14} />
            Descargar PDF
          </button>

          <button
            onClick={handlePrint}
            className="btn-secondary"
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Printer size={14} />
            Imprimir
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {saving ? (
              <span className="animate-spin" style={{ width: '12px', height: '12px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }}></span>
            ) : (
              <Save size={14} />
            )}
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* Editor Body (Split pane) */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Pane (Scrollable editor sidebar) */}
        <div className="cv-editor-left-pane" style={{
          width: '460px',
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          flexShrink: 0
        }}>
          {/* ACCORDION SECTIONS */}

          {/* 1. INFORMACIÓN PERSONAL */}
          <div className="cv-editor-card" style={{ borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
            <div className="cv-editor-card-header" style={{
              padding: '16px',
              fontWeight: 700,
              fontSize: '14px'
            }}>
              INFORMACIÓN PERSONAL
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Photo upload */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>FOTO DE PERFIL</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-hex)', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-app-hex)' }}>
                    {editData?.foto ? <img src={editData.foto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon size={24} style={{ color: '#94a3b8' }} />}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={triggerPhotoUpload} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px' }}>
                      Seleccionar Foto
                    </button>
                    {editData?.foto && (
                      <button type="button" onClick={removePhoto} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', color: '#ef4444', borderColor: '#fecaca' }}>
                        Eliminar
                      </button>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handlePhotoChange} accept="image/*" style={{ display: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>NOMBRE</label>
                  <input type="text" name="nombre" value={editData?.nombre || ''} onChange={handleInputChange} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>APELLIDO</label>
                  <input type="text" name="apellido" value={editData?.apellido || ''} onChange={handleInputChange} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>TÍTULO PROFESIONAL / OFICIO</label>
                <input type="text" name="cvUrl" value={editData?.cvUrl || ''} onChange={handleInputChange} placeholder="Ej: Administrativa / Electricista" style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>DNI</label>
                  <input type="text" name="dni" value={editData?.dni || ''} disabled style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', backgroundColor: '#f8fafc', color: '#64748b' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>CUIL</label>
                  <input type="text" name="cuil" value={editData?.cuil || ''} disabled style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', backgroundColor: '#f8fafc', color: '#64748b' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>EMAIL</label>
                  <input type="email" name="email" value={editData?.email || ''} onChange={handleInputChange} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>TELÉFONO PRIMARIO</label>
                  <input type="text" name="telefonoPrimario" value={editData?.telefonoPrimario || ''} onChange={handleInputChange} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>TELÉFONO SECUNDARIO</label>
                  <input type="text" name="telefonoSecundario" value={editData?.telefonoSecundario || ''} onChange={handleInputChange} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>DIRECCIÓN</label>
                  <input type="text" name="direccion" value={editData?.direccion || ''} onChange={handleInputChange} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>BARRIO</label>
                  <select
                    name="barrioId"
                    value={editData?.barrio?.id || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const selected = barriosList.find(b => b.id === parseInt(val, 10));
                      if (editData) {
                        setEditData({
                          ...editData,
                          barrio: selected || null
                        });
                      }
                    }}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-hex)', fontSize: '13px', backgroundColor: 'var(--bg-app-hex)' }}
                  >
                    <option value="">-- Seleccionar Barrio --</option>
                    {barriosList.map(b => (
                      <option key={b.id} value={b.id}>{b.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>PUNTOS DE REFERENCIA</label>
                  <input type="text" name="puntosReferenciaDomicilio" value={editData?.puntosReferenciaDomicilio || ''} onChange={handleInputChange} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>FECHA DE NACIMIENTO</label>
                  <input type="date" name="fechaNacimiento" value={editData?.fechaNacimiento ? editData.fechaNacimiento.substring(0, 10) : ''} onChange={handleInputChange} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>GÉNERO</label>
                  <select name="genero" value={editData?.genero || ''} onChange={handleInputChange} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}>
                    <option value="Femenino">Femenino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>ESTADO CIVIL</label>
                  <select name="estadoCivil" value={editData?.estadoCivil || ''} onChange={handleInputChange} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}>
                    <option value="">No especificado</option>
                    <option value="Soltero/a">Soltero/a</option>
                    <option value="Casado/a">Casado/a</option>
                    <option value="Divorciado/a">Divorciado/a</option>
                    <option value="Viudo/a">Viudo/a</option>
                    <option value="Unión de hecho">Unión de hecho</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>HIJOS A CARGO</label>
                  <input type="number" name="hijosACargo" value={editData?.hijosACargo || 0} onChange={handleInputChange} style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                </div>
              </div>
            </div>
          </div>

          {/* 2. PERFIL PROFESIONAL */}
          <div className="cv-editor-card" style={{ borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
            <div className="cv-editor-card-header" style={{
              padding: '16px',
              fontWeight: 700,
              fontSize: '14px'
            }}>
              PERFIL PROFESIONAL
            </div>
            <div style={{ padding: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>RESUMEN / OBSERVACIONES GENERALES</label>
              <textarea
                name="observacionesGenerales"
                rows={6}
                value={editData?.observacionesGenerales || ''}
                onChange={handleInputChange}
                placeholder="Describe tu perfil laboral, fortalezas, y objetivos profesionales..."
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', lineHeight: 1.5, resize: 'vertical' }}
              />
            </div>
          </div>

          {/* 3. EXPERIENCIA LABORAL */}
          <div className="cv-editor-card" style={{ borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
            <div className="cv-editor-card-header" style={{
              padding: '16px',
              fontWeight: 700,
              fontSize: '14px'
            }}>
              EXPERIENCIA LABORAL ({editData?.experienciasLaborales.length || 0})
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {editData?.experienciasLaborales.map((exp, idx) => (
                <div key={idx} className="cv-editor-subcard" style={{ padding: '14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative', backgroundColor: 'var(--bg-alt-hex)', border: '1px solid var(--border-hex)' }}>
                  <button
                    type="button"
                    onClick={() => handleRemoveExperience(idx)}
                    style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                    title="Eliminar experiencia"
                  >
                    <Trash2 size={16} />
                  </button>

                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted-hex)' }}>FORMACIÓN LABORAL #{idx + 1}</span>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted-hex)', marginBottom: '3px' }}>EMPRESA</label>
                    <input type="text" value={exp.empresa} onChange={(e) => handleExperienceChange(idx, 'empresa', e.target.value)} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-hex)', fontSize: '12px' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted-hex)', marginBottom: '3px' }}>PUESTO / ROL</label>
                    <input type="text" value={exp.puesto} onChange={(e) => handleExperienceChange(idx, 'puesto', e.target.value)} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-hex)', fontSize: '12px' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted-hex)', marginBottom: '3px' }}>AÑO INICIO</label>
                      <input type="text" placeholder="Ej: 2021" value={exp.fechaInicio} onChange={(e) => handleExperienceChange(idx, 'fechaInicio', e.target.value)} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-hex)', fontSize: '12px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted-hex)', marginBottom: '3px' }}>AÑO FIN</label>
                      <input type="text" placeholder="Ej: 2023" value={exp.fechaFin || ''} disabled={exp.currentlyWorking} onChange={(e) => handleExperienceChange(idx, 'fechaFin', e.target.value)} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: exp.currentlyWorking ? '1px solid var(--border-hex)' : '1px solid var(--border-hex)', fontSize: '12px', backgroundColor: exp.currentlyWorking ? 'var(--bg-alt-hex)' : 'var(--bg-app-hex)' }} />
                    </div>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-main-hex)', cursor: 'pointer', marginTop: '2px' }}>
                    <input type="checkbox" checked={exp.currentlyWorking} onChange={(e) => handleExperienceChange(idx, 'currentlyWorking', e.target.checked)} />
                    Actualmente trabajo aquí
                  </label>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted-hex)', marginBottom: '3px' }}>TAREAS REALIZADAS</label>
                    <textarea rows={3} value={exp.tareasRealizadas} onChange={(e) => handleExperienceChange(idx, 'tareasRealizadas', e.target.value)} placeholder="Breve detalle de tareas (puedes separar tareas con Enter para crear viñetas)..." style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-hex)', fontSize: '12px', resize: 'vertical' }} />
                  </div>
                </div>
              ))}

              <button type="button" onClick={handleAddExperience} className="btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '8px', fontSize: '13px', borderStyle: 'dashed', borderColor: 'hsl(var(--primary) / 0.5)', color: 'hsl(var(--primary))' }}>
                <Plus size={16} />
                Añadir Experiencia
              </button>
            </div>
          </div>

          {/* 4. FORMACIÓN ACADÉMICA */}
          <div className="cv-editor-card" style={{ borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
            <div className="cv-editor-card-header" style={{
              padding: '16px',
              fontWeight: 700,
              fontSize: '14px'
            }}>
              FORMACIÓN ACADÉMICA ({editData?.educaciones.length || 0})
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {editData?.educaciones.map((edu, idx) => (
                <div key={idx} className="cv-editor-subcard" style={{ padding: '14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px', position: 'relative', backgroundColor: 'var(--bg-alt-hex)', border: '1px solid var(--border-hex)' }}>
                  <button
                    type="button"
                    onClick={() => handleRemoveEducation(idx)}
                    style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                    title="Eliminar educación"
                  >
                    <Trash2 size={16} />
                  </button>

                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted-hex)' }}>FORMACIÓN ACADÉMICA #{idx + 1}</span>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted-hex)', marginBottom: '3px' }}>INSTITUCIÓN</label>
                    <input type="text" value={edu.institucion} onChange={(e) => handleEducationChange(idx, 'institucion', e.target.value)} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-hex)', fontSize: '12px' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted-hex)', marginBottom: '3px' }}>TÍTULO / CERTIFICADO</label>
                    <input type="text" value={edu.tituloObtenido} onChange={(e) => handleEducationChange(idx, 'tituloObtenido', e.target.value)} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-hex)', fontSize: '12px' }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted-hex)', marginBottom: '3px' }}>NIVEL</label>
                      <select value={edu.nivelAlcanzado} onChange={(e) => handleEducationChange(idx, 'nivelAlcanzado', e.target.value)} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-hex)', fontSize: '12px', backgroundColor: 'var(--bg-app-hex)' }}>
                        {JSON.parse(localStorage.getItem('oficina_empleo_niveles_educativos') || '["Primario", "Secundario", "Terciario", "Universitario", "Posgrado"]').map((nivel: string) => (
                          <option key={nivel} value={nivel}>
                            {nivel}
                          </option>
                        ))}
                        {edu.nivelAlcanzado && !JSON.parse(localStorage.getItem('oficina_empleo_niveles_educativos') || '[]').includes(edu.nivelAlcanzado) && (
                          <option value={edu.nivelAlcanzado}>{edu.nivelAlcanzado}</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'var(--text-muted-hex)', marginBottom: '3px' }}>AÑO DE EGRESO</label>
                      <input type="number" placeholder="Ej: 2018" value={edu.anioUltimoAprobado || ''} onChange={(e) => handleEducationChange(idx, 'anioUltimoAprobado', e.target.value ? parseInt(e.target.value) : undefined)} style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-hex)', fontSize: '12px' }} />
                    </div>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-main-hex)', cursor: 'pointer', marginTop: '2px' }}>
                    <input type="checkbox" checked={edu.finalizado} onChange={(e) => handleEducationChange(idx, 'finalizado', e.target.checked)} />
                    Nivel finalizado completo
                  </label>
                </div>
              ))}

              <button type="button" onClick={handleAddEducation} className="btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '8px', fontSize: '13px', borderStyle: 'dashed', borderColor: 'hsl(var(--primary) / 0.5)', color: 'hsl(var(--primary))' }}>
                <Plus size={16} />
                Añadir Educación
              </button>
            </div>
          </div>

          {/* 5. HABILIDADES Y COMPETENCIAS */}
          <div className="cv-editor-card" style={{ borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
            <div className="cv-editor-card-header" style={{
              padding: '16px',
              fontWeight: 700,
              fontSize: '14px'
            }}>
              HABILIDADES Y COMPETENCIAS
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ fontSize: '12px', color: '#64748b' }}>Escribe una habilidad. Para categorizarla como en la planilla, escribe <strong>Categoría: Valor</strong> (ejemplo: <em>Languages: Java</em> o <em>Frameworks: React</em>).</p>

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  placeholder="Ej: Languages: Java..."
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
                <button type="button" onClick={handleAddSkill} className="btn-primary" style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
                  Añadir
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                {getSkillsArray(editData).map((skill, idx) => (
                  <div key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '20px', padding: '4px 10px', fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                    <span>{skill}</span>
                    <button type="button" onClick={() => handleRemoveSkill(skill)} style={{ border: 'none', background: 'none', color: '#94a3b8', display: 'inline-flex', cursor: 'pointer', padding: 0 }} title="Remover">
                      <X size={12} style={{ color: '#ef4444' }} />
                    </button>
                  </div>
                ))}
                {getSkillsArray(editData).length === 0 && (
                  <span style={{ fontSize: '12px', color: '#cbd5e1', fontStyle: 'italic' }}>Sin habilidades agregadas aún.</span>
                )}
              </div>
            </div>
          </div>

          {/* 6. OTROS DATOS / HABILITACIONES */}
          <div className="cv-editor-card" style={{ borderRadius: '12px', overflow: 'hidden', flexShrink: 0 }}>
            <div className="cv-editor-card-header" style={{
              padding: '16px',
              fontWeight: 700,
              fontSize: '14px'
            }}>
              MÁS DATOS E INTERESES
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Rubros de Interés */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted-hex)', marginBottom: '8px' }}>RUBROS DE INTERÉS</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-hex)', padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-app-hex)' }}>
                  {rubrosList.map(rubro => {
                    const isSelected = editData?.rubros?.some(r => r.id === rubro.id);
                    return (
                      <label key={rubro.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-main-hex)', cursor: 'pointer', padding: '4px 0' }}>
                        <input type="checkbox" checked={!!isSelected} onChange={() => handleRubroToggle(rubro)} />
                        {rubro.nombre}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-hex)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-main-hex)', cursor: 'pointer' }}>
                  <input type="checkbox" name="movilidadPropia" checked={!!editData?.movilidadPropia} onChange={handleInputChange} />
                  Posee movilidad propia
                </label>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--text-muted-hex)', marginBottom: '4px' }}>CATEGORÍA LICENCIA CONDUCIR</label>
                  <select
                    name="licenciaConducir"
                    value={editData?.licenciaConducir || 'NO_POSEE'}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-hex)', fontSize: '13px', backgroundColor: 'var(--bg-app-hex)' }}
                  >
                    <option value="NO_POSEE">No posee</option>
                    <option value="B1">Si</option>
                    <option value="POFESIONAL">Licencia profesional</option>
                  </select>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#334155', cursor: 'pointer' }}>
                  <input type="checkbox" name="cudDiscapacidad" checked={!!editData?.cudDiscapacidad} onChange={handleInputChange} />
                  Posee Certificado CUD (Discapacidad)
                </label>

                {editData?.cudDiscapacidad && (
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>TIPO DE DISCAPACIDAD</label>
                    <input type="text" name="tipoDiscapacidad" value={editData?.tipoDiscapacidad || ''} onChange={handleInputChange} placeholder="Detalle del CUD..." style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#334155', cursor: 'pointer' }}>
                  <input type="checkbox" name="tieneObraSocial" checked={!!editData?.tieneObraSocial} onChange={handleInputChange} />
                  Posee cobertura de Obra Social
                </label>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>PLAN SOCIAL ACTIVO (OPCIONAL)</label>
                  <input type="text" name="planSocialActivo" value={editData?.planSocialActivo || ''} onChange={handleInputChange} placeholder="Ej: Tarjeta Alimentar..." style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                </div>
              </div>

              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>SITUACIÓN IMPOSITIVA / HABILITACIONES</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#334155', cursor: 'pointer' }}>
                    <input type="checkbox" name="situacionMonotributo" checked={!!editData?.situacionMonotributo} onChange={handleInputChange} />
                    Monotributista activo
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#334155', cursor: 'pointer' }}>
                    <input type="checkbox" name="situacionResponsableInscripto" checked={!!editData?.situacionResponsableInscripto} onChange={handleInputChange} />
                    Responsable Inscripto
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#334155', cursor: 'pointer' }}>
                    <input type="checkbox" name="situacionAter" checked={!!editData?.situacionAter} onChange={handleInputChange} />
                    Registro ATER
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#334155', cursor: 'pointer' }}>
                    <input type="checkbox" name="situacionHabilitacionMunicipal" checked={!!editData?.situacionHabilitacionMunicipal} onChange={handleInputChange} />
                    Habilitación Municipal
                  </label>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>OTRO REGISTRO ESPECÍFICO</label>
                    <input type="text" name="situacionRegistroEspecifico" value={editData?.situacionRegistroEspecifico || ''} onChange={handleInputChange} placeholder="Ej: Carnet manipulador alimentos..." style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Pane (Live preview area) */}
        <div className="cv-editor-preview-pane" style={{
          flex: 1,
          overflowY: 'auto',
          padding: '40px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start'
        }}>
          <div style={{ maxWidth: '800px', width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted-hex)', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center', display: 'block' }}>
              VISTA PREVIA EN TIEMPO REAL
            </span>
            {renderCVSheet()}
          </div>
        </div>
      </div>
    </div>
  );
}
