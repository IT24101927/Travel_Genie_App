# Utils
These are pure, stateless helper functions meant to handle formatting, calculation, or extraction.

## Structure
- `dateFormat.js`: Transforms ISO strings into human-readable strings.
- `currencyFormat.js`: Transforms numbers into locale-aware currency strings.
- `validators.js`: Regex and boolean logic to parse invalid text inputs.
- `apiError.js`: Safe catch-blocks that parse backend error dictionaries into usable React strings.

**Guideline**: Functions in this folder must *never* rely on Context, React State, or directly render JSX logic. They take arguments and return values purely.
