/**
 * Baseline per-order expense assumptions — automatically applied to every
 * non-cancelled order (residential + commercial) with no manual entry
 * required. Starting point for the finances dashboard; adjust here if real
 * costs change.
 */
export const DUMPING_FEE_PER_ORDER = 100;
export const GAS_FEE_PER_ORDER = 50;
export const FIXED_EXPENSE_PER_ORDER = DUMPING_FEE_PER_ORDER + GAS_FEE_PER_ORDER;
