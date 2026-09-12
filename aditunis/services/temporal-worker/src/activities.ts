import type { Activities } from "./types";

/**
 * Activity implementations are infrastructure-specific and are deliberately not
 * bundled into the foundation. Workers must provide an object satisfying this contract.
 */
export type AditunisActivities = Activities;
