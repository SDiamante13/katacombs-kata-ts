import { Thing } from './thing.ts';

export class Item extends Thing {
  describe(): string {
    return this.detail;
  }

  held(): string {
    return this.#a('.');
  }

  lying(): string {
    return this.#a(' lies here.');
  }

  taken(): string {
    return this.#youHave('take');
  }

  dropped(): string {
    return this.#youHave('drop');
  }

  #a(rest: string): string {
    return `A ${this.name}${rest}`;
  }

  #youHave(verb: string): string {
    return `You ${verb} the ${this.name}.`;
  }
}
