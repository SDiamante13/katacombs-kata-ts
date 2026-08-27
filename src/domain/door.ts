import { Thing } from './thing.ts';

export class Door extends Thing {
  describe(open: boolean): string {
    return `${this.detail} It is ${open ? 'open' : 'closed'}.`;
  }

  closed(): string {
    return this.#reads('closed');
  }

  opens(): string {
    return this.#reads('now open');
  }

  alreadyOpen(): string {
    return this.#reads('already open');
  }

  #reads(state: string): string {
    return `The ${this.name} is ${state}.`;
  }
}
