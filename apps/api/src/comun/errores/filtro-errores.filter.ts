import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { traducirError } from './traducir-error';

interface RespuestaHttp {
  status(estado: number): { json(cuerpo: unknown): void };
}

@Catch()
export class FiltroErrores implements ExceptionFilter {
  private readonly registro = new Logger(FiltroErrores.name);

  catch(excepcion: unknown, host: ArgumentsHost): void {
    const { estado, cuerpo } = traducirError(excepcion);
    if (estado >= 500) {
      this.registro.error(
        cuerpo.codigo,
        excepcion instanceof Error ? excepcion.stack : String(excepcion),
      );
    }
    host.switchToHttp().getResponse<RespuestaHttp>().status(estado).json(cuerpo);
  }
}
