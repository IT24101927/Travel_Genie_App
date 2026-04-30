import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ExpenseListScreen from '../screens/expenses/ExpenseListScreen';
import AddExpenseScreen from '../screens/expenses/AddExpenseScreen';
import EditExpenseScreen from '../screens/expenses/EditExpenseScreen';
import ExpenseSummaryScreen from '../screens/expenses/ExpenseSummaryScreen';
import BudgetUsageScreen from '../screens/expenses/BudgetUsageScreen';

const Stack = createNativeStackNavigator();

const ExpenseStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ExpenseList" component={ExpenseListScreen} />
      <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
      <Stack.Screen name="EditExpense" component={EditExpenseScreen} />
      <Stack.Screen name="ExpenseSummary" component={ExpenseSummaryScreen} />
      <Stack.Screen name="BudgetUsage" component={BudgetUsageScreen} />
    </Stack.Navigator>
  );
};

export default ExpenseStackNavigator;
