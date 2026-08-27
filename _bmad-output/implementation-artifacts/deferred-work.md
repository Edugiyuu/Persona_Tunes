- source_spec: `_bmad-output/implementation-artifacts/spec-home-menu-hover-treatment.md`
  summary: Align the Home animation export and its test mock, then adopt a hook-style name.
  evidence: The existing `Animations` rename is not reflected in `Home.test.tsx`, causing both Home tests to fail.
- source_spec: `_bmad-output/implementation-artifacts/spec-home-menu-hover-treatment.md`
  summary: Scope and clean up Home GSAP animations across mount and unmount cycles.
  evidence: Existing global selectors and infinite tweens have no effect cleanup and can duplicate under React Strict Mode.
- source_spec: `_bmad-output/implementation-artifacts/spec-home-menu-hover-treatment.md`
  summary: Type CustomLink props and limit its new title wrapper to consumers that need it.
  evidence: The existing shared component change expands DOM impact and still fails lint because its props use `any`.
