import { localStorageColorSchemeManager, MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { clienteConsultas } from '../api/cliente-consultas';
import { ProveedorSesion } from '../sesion/proveedor-sesion';
import { enrutador } from './enrutador';
import { CLAVE_ESQUEMA_COLOR, tema } from './tema';

const gestorEsquemaColor = localStorageColorSchemeManager({ key: CLAVE_ESQUEMA_COLOR });

export function ProveedoresApp() {
  return (
    <MantineProvider
      theme={tema}
      defaultColorScheme="light"
      colorSchemeManager={gestorEsquemaColor}
    >
      <Notifications position="top-right" />
      <QueryClientProvider client={clienteConsultas}>
        <ProveedorSesion>
          <RouterProvider router={enrutador} />
        </ProveedorSesion>
      </QueryClientProvider>
    </MantineProvider>
  );
}
