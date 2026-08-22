import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { ledgerPath, record } from '../../scripts/session-ledger.mjs';
import { fireHook } from './sensor-harness.mjs';

// A turn, as the Stop hook sees one: work on disk and a ledger saying it changed.
export function turnProbe({ session, source, spec }) {
  const sourceFile = path.resolve(source);
  const specFile = path.resolve(spec);

  return {
    plant(sourceText, specText) {
      mkdirSync(path.dirname(sourceFile), { recursive: true });
      writeFileSync(sourceFile, sourceText);
      writeFileSync(specFile, specText);
      record(session, [source]);
    },
    stop(payload = {}) {
      const { out } = fireHook('scripts/stop-sensor.mjs', {
        session_id: session,
        stop_hook_active: false,
        ...payload,
      });

      return JSON.parse(out);
    },
    uproot() {
      rmSync(ledgerPath(session), { force: true });
      rmSync(sourceFile, { force: true });
      rmSync(specFile, { force: true });
    },
  };
}
