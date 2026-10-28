import { useEffect, useState } from 'react';
import { APP_NOMBRE } from '@cuidarte/core';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

type EstadoSalud =
  | { tipo: 'cargando' }
  | { tipo: 'respuesta'; http: number; estado: string; bd: string }
  | { tipo: 'sin-conexion' };

export function App() {
  const [salud, setSalud] = useState<EstadoSalud>({ tipo: 'cargando' });

  useEffect(() => {
    fetch(`${API_URL}/salud`)
      .then(async (res) => {
        const cuerpo = (await res.json()) as { estado: string; bd: string };
        setSalud({ tipo: 'respuesta', http: res.status, ...cuerpo });
      })
      .catch(() => setSalud({ tipo: 'sin-conexion' }));
  }, []);

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: 640 }}>
      <h1>{APP_NOMBRE}</h1>
      <h2>Estado del sistema</h2>
      <ul>
        <li>Web: operativa</li>
        <li>API: {textoApi(salud)}</li>
        <li>Base de datos: {textoBaseDatos(salud)}</li>
      </ul>
    </main>
  );
}

function textoApi(salud: EstadoSalud): string {
  if (salud.tipo === 'cargando') return 'consultando…';
  if (salud.tipo === 'sin-conexion') return `sin conexión (${API_URL})`;
  return `responde ${salud.http}`;
}

function textoBaseDatos(salud: EstadoSalud): string {
  if (salud.tipo === 'cargando') return 'consultando…';
  if (salud.tipo === 'sin-conexion') return 'desconocido';
  return salud.bd;
}
