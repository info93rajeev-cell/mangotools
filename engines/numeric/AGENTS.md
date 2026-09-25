# engines/numeric — lane rules

- Only this package may import `big.js`.
- Functions take and return decimal strings. Never return `Big` objects or JavaScript numbers for money.
- No DOM, network, time, randomness or `Intl`.
- Changing rounding behaviour changes results everywhere: it needs founder approval and new fixtures.
