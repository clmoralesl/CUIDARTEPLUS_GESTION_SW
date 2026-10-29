import { createContext, ReactNode, useCallback, useContext } from 'react';
import { useLocalStorage } from '@mantine/hooks';
import type { Rol } from '@cuidarte/core';
import { clienteConsultas } from '../api/cliente-consultas';
import {
  CLAVE_PROYECTO,
  CLAVE_ROL,
  interpretarProyecto,
  interpretarRol,
  ROL_POR_DEFECTO,
} from './almacenamiento';

interface ContextoSesion {
  rol: Rol;
  cambiarRol: (nuevoRol: Rol) => void;
  proyectoActivoId: number | null;
  cambiarProyecto: (nuevoProyectoId: number | null) => void;
}

const ContextoSesion = createContext<ContextoSesion | null>(null);

interface ProveedorSesionProps {
  children: ReactNode;
}

export function ProveedorSesion({ children }: ProveedorSesionProps) {
  const [rol, setRol] = useLocalStorage<Rol>({
    key: CLAVE_ROL,
    defaultValue: ROL_POR_DEFECTO,
    getInitialValueInEffect: false,
    serialize: (valor) => valor,
    deserialize: interpretarRol,
  });

  const [proyectoActivoId, setProyectoActivoId] = useLocalStorage<number | null>({
    key: CLAVE_PROYECTO,
    defaultValue: null,
    getInitialValueInEffect: false,
    serialize: (valor) => (valor === null ? '' : String(valor)),
    deserialize: interpretarProyecto,
  });

  const cambiarRol = useCallback(
    (nuevoRol: Rol) => {
      try {
        localStorage.setItem(CLAVE_ROL, nuevoRol);
      } catch (_error: unknown) {
        void _error;
      }
      setRol(nuevoRol);
      void clienteConsultas.invalidateQueries();
    },
    [setRol],
  );

  const cambiarProyecto = useCallback(
    (nuevoProyectoId: number | null) => {
      setProyectoActivoId(nuevoProyectoId);
    },
    [setProyectoActivoId],
  );

  return (
    <ContextoSesion.Provider
      value={{
        rol,
        cambiarRol,
        proyectoActivoId,
        cambiarProyecto,
      }}
    >
      {children}
    </ContextoSesion.Provider>
  );
}

export function useSesion(): ContextoSesion {
  const contexto = useContext(ContextoSesion);
  if (!contexto) {
    throw new Error('useSesion debe usarse dentro de un ProveedorSesion');
  }
  return contexto;
}
