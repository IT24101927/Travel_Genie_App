# Components
This directory houses reusable UI components, split between generic shared components and feature-specific components.

## Structure
- `/common`: Highly reusable, generic components (Buttons, Inputs, Loaders, Error Texts) used across the entire app.
- `/expenses`, `/trips`, and `/transport`: Feature-specific components (Cards, List Items, Charts, Route Cards) that are deeply coupled with their respective domains.

**Guideline**: Components should be "dumb" whenever possible. They should rely on props for their data and event handlers rather than fetching data or connecting to context internally.
