const CURRENT_MODEL_TIMESTAMP_COLOR = '#59E4DA';
const OTHER_MODEL_TIMESTAMP_COLOR = '#39B5FB';

export class OkSequence {
  start: string = '';
  stop: string = '';
  #saved: boolean = false;
  #mode: 'default' | 'extra' = 'default';

  constructor(start: string, stop: string) {
    this.start = start;
    this.stop = stop;
  }

  get saved() {
    return this.#saved;
  }

  set saved(value: boolean) {
    this.#saved = value;
  }

  get mode() {
    return this.#mode;
  }

  set mode(value: 'default' | 'extra') {
    this.#mode = value;
  }

  get color() {
    return this.#mode === 'extra' ? OTHER_MODEL_TIMESTAMP_COLOR : CURRENT_MODEL_TIMESTAMP_COLOR;
  }
}
