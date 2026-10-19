import { expect, it } from 'vitest';
import { surveyDisplay } from './SurveyResults.tsx';

it('preserves opaque labels, null, zero and tiny nonzero geometry without changing source values', () => {
  expect(surveyDisplay('001')).toBe('001');
  expect(surveyDisplay('  001  ')).toBe('  001  ');
  expect(surveyDisplay(null, true)).toBe('—');
  expect(surveyDisplay(0, true)).toBe('0.000');
  expect(surveyDisplay(0.0001, true)).toBe('0.0001');
  expect(surveyDisplay(5e-324, true)).toBe('5e-324');
  expect(surveyDisplay('100.000001', true)).toBe('100.000');
  expect(surveyDisplay('pass')).toBe('pass');
});
