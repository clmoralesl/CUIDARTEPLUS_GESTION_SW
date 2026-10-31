import { Injectable } from '@nestjs/common';
import { hoyEnZona } from '@autofix/core';

@Injectable()
export class Reloj {
  hoy(): string {
    return hoyEnZona();
  }
}
