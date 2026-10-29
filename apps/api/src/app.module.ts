import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { BitacoraModule } from './comun/bitacora/bitacora.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProyectosModule } from './proyectos/proyectos.module';
import { SaludModule } from './salud/salud.module';

@Module({
  imports: [PrismaModule, BitacoraModule, SaludModule, ProyectosModule],
  controllers: [AppController],
})
export class AppModule {}
