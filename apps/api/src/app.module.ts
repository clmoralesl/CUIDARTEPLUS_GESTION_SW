import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { ProyectosModule } from './proyectos/proyectos.module';
import { SaludModule } from './salud/salud.module';

@Module({
  imports: [PrismaModule, SaludModule, ProyectosModule],
  controllers: [AppController],
})
export class AppModule {}
