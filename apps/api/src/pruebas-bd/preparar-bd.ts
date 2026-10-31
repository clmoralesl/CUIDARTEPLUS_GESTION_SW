import { execSync } from 'node:child_process';

export default function setup(): void {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL no está definida.');
  }
  const pathname = new URL(url).pathname;
  if (!pathname.endsWith('_pruebas')) {
    throw new Error(
      `La base de datos de pruebas debe terminar en '_pruebas'. Recibido: ${pathname}`,
    );
  }
  execSync('pnpm exec prisma migrate reset --force --skip-seed --skip-generate', {
    stdio: 'inherit',
    env: process.env,
  });
}
