import { createBrowserRouter, Navigate } from 'react-router';
import { EstructuraApp } from '../diseno/estructura-app';
import { PaginaDetalleProyecto } from '../paginas/pagina-detalle-proyecto';
import { PaginaNoEncontrada } from '../paginas/pagina-no-encontrada';
import { PaginaProyectos } from '../paginas/pagina-proyectos';
import { PaginaProximamente } from '../paginas/pagina-proximamente';
import { MODULOS } from './modulos';

const rutasModulos = MODULOS.map((m) => ({
  path: m.ruta,
  element: m.ruta === 'proyectos' ? <PaginaProyectos /> : <PaginaProximamente titulo={m.titulo} />,
}));

export const enrutador = createBrowserRouter([
  {
    path: '/',
    element: <EstructuraApp />,
    children: [
      {
        index: true,
        element: <Navigate to="/proyectos" replace />,
      },
      ...rutasModulos,
      {
        path: 'proyectos/:proyectoId',
        element: <PaginaDetalleProyecto />,
      },
      {
        path: '*',
        element: <PaginaNoEncontrada />,
      },
    ],
  },
]);
