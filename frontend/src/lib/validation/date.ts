import { z } from "zod";

const isValidDate = (date: Date): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

const isValidYear = (year: number): boolean => {
  const currentYear = new Date().getFullYear();
  return year >= 1900 && year <= currentYear;
};

const isValidMonth = (month: number): boolean => {
  return month >= 1 && month <= 12;
};

const isValidDay = (year: number, month: number, day: number): boolean => {
  const date = new Date(year, month - 1, day);
  return date.getDate() === day && date.getMonth() === month - 1;
};

export const validateDateString = (dateString: string, options: {
  maxDate?: Date;
  minDate?: Date;
  allowFuture?: boolean;
} = {}): boolean => {
  const date = new Date(dateString);
  if (!isValidDate(date)) return false;

  const [year, month, day] = dateString.split('-').map(Number);
  if (!isValidYear(year) || !isValidMonth(month) || !isValidDay(year, month, day)) {
    return false;
  }

  if (options.maxDate && date > options.maxDate) return false;
  if (options.minDate && date < options.minDate) return false;
  if (!options.allowFuture && date > new Date()) return false;

  return true;
};

export const dateSchema = (options: {
  maxDate?: Date;
  minDate?: Date;
  allowFuture?: boolean;
  errorMessage?: string;
} = {}) => {
  return z.string().refine(
    (date) => validateDateString(date, options),
    {
      message: options.errorMessage || "Please enter a valid date.",
    }
  );
}; 