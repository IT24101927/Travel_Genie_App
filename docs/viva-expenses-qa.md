# Viva Q&A (Expenses Module)

## Q1: Why did you separate expense summary endpoints from CRUD endpoints?

A: CRUD handles transaction-level records while summary endpoints provide analytics. Separation improves readability, easier testing, and cleaner service logic.

## Q2: How do you ensure only the correct user can manage expenses?

A: All expense routes use JWT `protect` middleware. The service layer filters by `req.user.userId` so a user can only access their own records.

## Q3: How is budget usage percentage calculated?

A: For each trip, total expenses are aggregated and divided by trip budget.

Formula:

`budgetUsagePercentage = (totalSpent / tripBudget) * 100`

## Q4: What happens when trip budget is zero?

A: We safely return usage as 0 to avoid divide-by-zero.

## Q5: How do you validate expense input?

A: `express-validator` checks required fields and enums:
- valid `tripId`
- `category` from approved values
- `amount > 0`
- ISO date
- valid payment method enum

## Q6: Why use Mongo indexes for expenses?

A: Indexes on `userId`, `tripId`, and `date` speed up listing and summary queries for large datasets.

## Q7: How does this support your module ownership?

A: I own complete expense flow: model, validation, controller, services, summary services, routes, and mobile expense screens.
