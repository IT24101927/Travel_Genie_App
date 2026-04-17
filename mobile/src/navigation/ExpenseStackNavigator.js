import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import colors from '../constants/colors';

import ExpenseListScreen from '../screens/expenses/ExpenseListScreen';
import AddExpenseScreen from '../screens/expenses/AddExpenseScreen';
import EditExpenseScreen from '../screens/expenses/EditExpenseScreen';
import ExpenseSummaryScreen from '../screens/expenses/ExpenseSummaryScreen';
import BudgetUsageScreen from '../screens/expenses/BudgetUsageScreen';

const Stack = createNativeStackNavigator();

const defaultStackOptions = {
  headerStyle: {
    backgroundColor: colors.background,
  },
  headerTintColor: colors.primary,
  headerTitleStyle: {
    fontWeight: '800',
    color: colors.textPrimary,
  },
  headerShadowVisible: false,
};

const ExpenseStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={defaultStackOptions}>
      <Stack.Screen name="ExpenseList" component={ExpenseListScreen} options={{ title: 'Expenses' }} />
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'Add Expense' }} />
      <Stack.Screen name="EditExpense" component={EditExpenseScreen} options={{ title: 'Edit Expense' }} />
      <Stack.Screen name="ExpenseSummary" component={ExpenseSummaryScreen} options={{ title: 'Expense Summary' }} />
      <Stack.Screen name="BudgetUsage" component={BudgetUsageScreen} options={{ title: 'Budget Usage' }} />
    </Stack.Navigator>
  );
};

export default ExpenseStackNavigator;
