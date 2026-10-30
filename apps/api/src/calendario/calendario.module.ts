import { Module } from '@nestjs/common';
import { TareasModule } from '../tareas/tareas.module';
import { CalendarioController } from './calendario.controller';
import { CalendarioService } from './calendario.service';

@Module({
  imports: [TareasModule],
  controllers: [CalendarioController],
  providers: [CalendarioService],
  exports: [CalendarioService],
})
export class CalendarioModule {}
