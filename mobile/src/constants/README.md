# Constants
This directory maintains globally static, magic strings, and configuration variables.

## Key Files
- `colors.js`: The central Theme and Color Palette definition for the application.
- `expenseCategories.js`: Arrays defining valid system selections for forms.
- `apiConfig.js`: Backend API base URL configuration used by all feature APIs, including transport.
- `roles.js`: Shared role names for user/admin access decisions.

**Guideline**: If a value is used cleanly across 3 or more files, or defines an aspect of the application's core structural identity (like colors or base URLs), it should be extracted here.
