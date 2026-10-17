/** Reviewed test-only allowlist (#174); extending it requires explicit operation review. */
export const unpublishedTargets = [
  {
    packageName: '@mangotools/engine-survey',
    directory: 'engines/survey',
    operation: 'survey.leveling.reduce@1',
    minimumFixtures: 37,
  },
] as const;
