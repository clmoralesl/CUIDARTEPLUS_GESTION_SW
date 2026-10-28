import { APP_NOMBRE, TIPOS_DEPENDENCIA } from '@cuidarte/core';

export function App() {
  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
      <h1>{APP_NOMBRE}</h1>
      <p>Tipos de dependencia soportados: {TIPOS_DEPENDENCIA.join(', ')}</p>
    </main>
  );
}
