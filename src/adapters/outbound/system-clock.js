import { Clock } from '../../application/ports/clock.js';

export class SystemClock extends Clock {
  now() {
    return new Date();
  }
}
