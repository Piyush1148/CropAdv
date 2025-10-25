/**
 * Validation Schemas for Forms
 * Centralized validation rules using Yup
 */

import * as yup from 'yup';

// Crop Prediction Form Validation Schema
// ✅ UPDATED: Validation ranges now match backend API (crops.py)
export const cropPredictionSchema = yup.object({
  N: yup
    .number()
    .typeError('Nitrogen must be a number')
    .required('Nitrogen (N) is required')
    .min(0, 'Nitrogen must be at least 0 kg/ha')
    .max(300, 'Nitrogen must not exceed 300 kg/ha')
    .test('is-decimal', 'Nitrogen must have at most 2 decimal places', (value) => {
      if (value === undefined) return true;
      return /^\d+(\.\d{1,2})?$/.test(value.toString());
    }),

  P: yup
    .number()
    .typeError('Phosphorus must be a number')
    .required('Phosphorus (P) is required')
    .min(0, 'Phosphorus must be at least 0 kg/ha')
    .max(300, 'Phosphorus must not exceed 300 kg/ha')
    .test('is-decimal', 'Phosphorus must have at most 2 decimal places', (value) => {
      if (value === undefined) return true;
      return /^\d+(\.\d{1,2})?$/.test(value.toString());
    }),

  K: yup
    .number()
    .typeError('Potassium must be a number')
    .required('Potassium (K) is required')
    .min(0, 'Potassium must be at least 0 kg/ha')
    .max(300, 'Potassium must not exceed 300 kg/ha')
    .test('is-decimal', 'Potassium must have at most 2 decimal places', (value) => {
      if (value === undefined) return true;
      return /^\d+(\.\d{1,2})?$/.test(value.toString());
    }),

  temperature: yup
    .number()
    .typeError('Temperature must be a number')
    .required('Temperature is required')
    .min(-10, 'Temperature must be at least -10°C')
    .max(60, 'Temperature must not exceed 60°C')
    .test('is-decimal', 'Temperature must have at most 2 decimal places', (value) => {
      if (value === undefined) return true;
      return /^-?\d+(\.\d{1,2})?$/.test(value.toString());
    }),

  humidity: yup
    .number()
    .typeError('Humidity must be a number')
    .required('Humidity is required')
    .min(0, 'Humidity must be at least 0%')
    .max(100, 'Humidity must not exceed 100%')
    .test('is-decimal', 'Humidity must have at most 2 decimal places', (value) => {
      if (value === undefined) return true;
      return /^\d+(\.\d{1,2})?$/.test(value.toString());
    }),

  ph: yup
    .number()
    .typeError('pH must be a number')
    .required('pH value is required')
    .min(0, 'pH must be at least 0')
    .max(14, 'pH must not exceed 14')
    .test('is-decimal', 'pH must have at most 2 decimal places', (value) => {
      if (value === undefined) return true;
      return /^\d+(\.\d{1,2})?$/.test(value.toString());
    }),

  rainfall: yup
    .number()
    .typeError('Rainfall must be a number')
    .required('Rainfall is required')
    .min(0, 'Rainfall must be at least 0mm')
    .max(4000, 'Rainfall must not exceed 4000mm')
    .test('is-decimal', 'Rainfall must have at most 2 decimal places', (value) => {
      if (value === undefined) return true;
      return /^\d+(\.\d{1,2})?$/.test(value.toString());
    }),

  location: yup
    .string()
    .max(100, 'Location must not exceed 100 characters')
}).required();

// Login Form Validation Schema
export const loginSchema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters')
}).required();

// Registration Form Validation Schema
export const registrationSchema = yup.object({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords must match'),
  
  fullName: yup
    .string()
    .required('Full name is required')
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name must not exceed 50 characters'),
  
  farmName: yup
    .string()
    .required('Farm name is required')
    .min(2, 'Farm name must be at least 2 characters')
    .max(100, 'Farm name must not exceed 100 characters'),
  
  location: yup
    .string()
    .required('Location is required')
    .min(2, 'Location must be at least 2 characters')
    .max(100, 'Location must not exceed 100 characters'),
  
  farmSize: yup
    .number()
    .typeError('Farm size must be a number')
    .required('Farm size is required')
    .positive('Farm size must be a positive number')
    .max(10000, 'Farm size must not exceed 10,000 acres')
}).required();

// Profile Update Schema
export const profileUpdateSchema = yup.object({
  fullName: yup
    .string()
    .required('Full name is required')
    .min(2, 'Full name must be at least 2 characters')
    .max(50, 'Full name must not exceed 50 characters'),
  
  farmName: yup
    .string()
    .required('Farm name is required')
    .min(2, 'Farm name must be at least 2 characters')
    .max(100, 'Farm name must not exceed 100 characters'),
  
  location: yup
    .string()
    .required('Location is required')
    .min(2, 'Location must be at least 2 characters')
    .max(100, 'Location must not exceed 100 characters'),
  
  farmSize: yup
    .number()
    .typeError('Farm size must be a number')
    .required('Farm size is required')
    .positive('Farm size must be a positive number')
    .max(10000, 'Farm size must not exceed 10,000 acres')
}).required();
