// Placeholder so the `test` gate exercises the jest-expo harness end-to-end
// (preset load + transform). Replace / extend with real unit tests — the api
// client, zustand stores, and env precedence in src/lib/env.ts are good first
// targets.
describe('ci harness', () => {
  it('runs jest-expo', () => {
    expect(1 + 1).toBe(2);
  });
});
