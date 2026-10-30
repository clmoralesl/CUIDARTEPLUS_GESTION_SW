import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { BitacoraModule } from './comun/bitacora/bitacora.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProyectosModule } from './proyectos/proyectos.module';
import { SaludModule } from './salud/salud.module';
import { TareasModule } from './tareas/tareas.module';

@Module({
  imports: [PrismaModule, BitacoraModule, SaludModule, ProyectosModule, TareasModule],
  controllers: [AppController],
})
export class AppModule {}
