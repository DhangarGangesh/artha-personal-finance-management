/**
 * Standard categories matching the Artha backend validation rules exactly.
 * Backend: backend/utils/categories.js
 */
export const EXPENSE_CATEGORIES = [
  'Food',
  'Rent',
  'Transport',
  'Utilities',
  'Shopping',
  'Entertainment',
  'Health',
  'Education',
  'Travel',
  'Insurance',
  'EMI/Loan',
  'Other',
];

export const ESSENTIAL_CATEGORIES = [
  'Food',
  'Rent',
  'Transport',
  'Utilities',
  'Health',
  'Education',
  'Insurance',
  'EMI/Loan',
];

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Business',
  'Investment',
  'Gift',
  'Other',
];

export const ALL_CATEGORIES = Array.from(new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]));

export const getCategoriesForType = (type) => {
  if (type === 'income') return INCOME_CATEGORIES;
  return EXPENSE_CATEGORIES;
};
