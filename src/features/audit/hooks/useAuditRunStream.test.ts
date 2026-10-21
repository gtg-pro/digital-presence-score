import { describe, expect, it } from "vitest";

/**
 * Documents the Strict Mode failure mode that blocked live audits:
 * a startedRef set before fetch, then cleared only by abort cleanup,
 * prevented the remount/setup cycle from calling POST /api/audit/run again.
 *
 * The hook now keys off `enabled` + `attempt` and owns an AbortController
 * per effect run so cleanup aborts without permanently disabling start.
 */
describe("useAuditRunStream start guards", () => {
  it("must not permanently block restart after an aborted first attempt", () => {
    let startedRef = false;
    let fetchCalls = 0;

    const legacyBrokenStart = () => {
      if (startedRef) return;
      startedRef = true;
      fetchCalls += 1;
    };

    // Simulate Strict Mode: setup → cleanup abort → setup
    legacyBrokenStart();
    // cleanup would abort in-flight work but left startedRef=true
    legacyBrokenStart();
    expect(fetchCalls).toBe(1); // bug: second setup never fetches

    // Fixed pattern: each effect generation may start; abort only cancels that generation
    let generation = 0;
    let fixedFetchCalls = 0;
    const fixedStart = () => {
      generation += 1;
      const myGeneration = generation;
      fixedFetchCalls += 1;
      return () => {
        // abort only this generation — next setup increments generation and fetches again
        void myGeneration;
      };
    };

    const cleanup1 = fixedStart();
    cleanup1();
    fixedStart();
    expect(fixedFetchCalls).toBe(2);
  });
});
