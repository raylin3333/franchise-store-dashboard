// Real useActor hook — wires the Backend class from backend.ts into the
// caffeine core-infrastructure useActor, which handles agent setup, Internet
// Identity, and actor lifecycle automatically.

import { useActor as useCaffeineActor } from "@caffeineai/core-infrastructure";
import { createActor } from "../backend";
import type { Backend } from "../backend";

export function useActor(): { actor: Backend | null; isFetching: boolean } {
  return useCaffeineActor(createActor) as {
    actor: Backend | null;
    isFetching: boolean;
  };
}
