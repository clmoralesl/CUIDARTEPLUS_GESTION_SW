import { Badge, createTheme, MantineColorsTuple } from '@mantine/core';

const petroleo: MantineColorsTuple = [
  '#e6f4f5',
  '#cfe6e8',
  '#9fcdd2',
  '#6bb3bb',
  '#439ea8',
  '#2a909b',
  '#1b8995',
  '#0c7782',
  '#006a74',
  '#005c65',
];

export const tema = createTheme({
  primaryColor: 'petroleo',
  primaryShade: { light: 7, dark: 5 },
  colors: { petroleo },
  fontFamily: "'Inter Variable', system-ui, sans-serif",
  headings: { fontFamily: "'Inter Variable', system-ui, sans-serif" },
  defaultRadius: 'sm',
  components: {
    Badge: Badge.extend({ styles: { root: { minWidth: 'max-content' } } }),
  },
});

export const CLAVE_ESQUEMA_COLOR = 'autofix:esquema-color';
