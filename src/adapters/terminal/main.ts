import { stdin, stdout } from 'node:process';
import { createInterface } from 'node:readline';

// Why every import ends in .ts, and why there is no build: `context/no-build-step.md`
import { playInTerminal } from './terminal-game.ts';

await playInTerminal(createInterface(stdin, stdout), stdout);
