import React, { useState } from 'react';
import { User, Lock, ShieldAlert } from 'lucide-react';
import logoSjCiudad from './assets/sj_ciudad.png';
import logoSafe from './assets/logo_safe.png';
import logoSafeDark from './assets/logo_safe_dark.png';

interface LoginProps {
  onLoginSuccess: (token: string, userProfile?: any) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Credenciales incorrectas. Inténtalo de nuevo.');
        }
        throw new Error('Error al conectar con el servidor.');
      }

      const data = await response.json();
      if (data.username && data.role) {
        onLoginSuccess('session-cookie', data);
      } else if (data.token) {
        onLoginSuccess(data.token);
      } else {
        throw new Error('Respuesta inválida del servidor.');
      }
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'var(--login-bg)',
      position: 'relative'
    }}>
      <div className="fade-in" style={{
        backgroundColor: 'var(--card-bg-hex)',
        borderRadius: '24px',
        boxShadow: 'var(--shadow-lg)',
        width: '100%',
        maxWidth: '480px',
        padding: '40px',
        border: '1px solid var(--border-hex)'
      }}>
        {/* Logo Header */}
        <div style={{
          backgroundColor: 'var(--bg-app-hex)',
          borderRadius: '16px',
          height: '96px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '32px',
          border: '1px solid var(--border-hex)'
        }}>
          <img src={logoSjCiudad} alt="SJ Ciudad" style={{ maxHeight: '60px', objectFit: 'contain' }} />
        </div>

        <h2 style={{
          textAlign: 'center',
          fontSize: '25px',
          fontWeight: 700,
          color: 'var(--text-main-hex)',
          marginBottom: '24px'
        }}>Oficina de Empleo</h2>

        {error && (
          <div style={{
            backgroundColor: 'hsl(var(--color-rechazado) / 0.08)',
            border: '1px solid hsl(var(--color-rechazado) / 0.2)',
            color: 'hsl(var(--color-rechazado))',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '15px'
          }}>
            <ShieldAlert size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Nombre de usuario</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'hsl(var(--text-muted))'
              }} />
              <input
                id="username"
                type="text"
                placeholder="Nombre de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ paddingLeft: '48px' }}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label htmlFor="password">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'hsl(var(--text-muted))'
              }} />
              <input
                id="password"
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '48px' }}
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              marginBottom: '24px'
            }}
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Ingresar al Sistema'}
          </button>
        </form>


      </div>

      {/* Safe Software brand logo */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        right: '24px',
        opacity: 1,
        pointerEvents: 'none'
      }}>
        <img
          src={theme === 'dark' ? logoSafeDark : logoSafe}
          alt="Safe Software"
          style={{ maxHeight: '48px', objectFit: 'contain' }}
        />
      </div>
    </div>
  );
}
