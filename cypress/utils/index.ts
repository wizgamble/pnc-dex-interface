export const getTestSelector = (selectorId: string) =>
  `[data-testid=${selectorId}]`;

export const getTestSelectorStartsWith = (selectorId: string) =>
  `[data-testid^=${selectorId}]`;
