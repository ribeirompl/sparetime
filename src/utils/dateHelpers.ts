/**
 * Date Helper Utilities
 * Wrappers for date-fns functions used throughout the app
 * Per research.md - use tree-shakeable imports
 */

import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  addHours,
  differenceInDays,
  startOfDay,
  parseISO,
  formatISO,
  isBefore,
  isAfter,
  isEqual,
  format
} from 'date-fns'

import type { IntervalUnit, RecurringPattern } from '@/types/task'

/**
 * Format a date for display using user's locale preferences
 * Uses Intl.DateTimeFormat for locale-aware formatting
 *
 * @param date - ISO date string or Date to format
 * @param options - Optional Intl.DateTimeFormatOptions
 * @returns Formatted date string in user's locale
 */
export function formatDateLocale(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }
  
  return new Intl.DateTimeFormat(undefined, options ?? defaultOptions).format(dateObj)
}

/**
 * Format a date with time for display using user's locale preferences
 *
 * @param date - ISO date string or Date to format
 * @returns Formatted date-time string in user's locale
 */
export function formatDateTimeLocale(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  
  return new Intl.DateTimeFormat(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(dateObj)
}

/**
 * Format a date in short format for display (e.g., "Jan 15")
 *
 * @param date - ISO date string or Date to format
 * @returns Short formatted date string
 */
export function formatDateShort(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'MMM d')
}

/**
 * Format a date relative to today (e.g., "Today", "Tomorrow", "Jan 15")
 *
 * @param date - ISO date string or Date to format
 * @param now - Current date (defaults to today)
 * @returns Relative or formatted date string
 */
export function formatDateRelative(date: string | Date, now: Date = new Date()): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  const days = differenceInDays(startOfDay(dateObj), startOfDay(now))
  
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  
  return formatDateLocale(dateObj)
}

/**
 * Calculate the next due date for a recurring task
 * Note: date-fns handles month-end edge cases by rolling to next valid date
 * e.g., Jan 31 + 1 month = Feb 28/29
 *
 * @param lastCompletedDate - ISO date string of last completion
 * @param intervalValue - Number of intervals
 * @param intervalUnit - Unit of interval (hours, days, weeks, months, years)
 * @returns Date object representing next due date
 */
export function calculateNextDueDate(
  lastCompletedDate: string | Date,
  intervalValue: number,
  intervalUnit: IntervalUnit
): Date {
  const baseDate =
    typeof lastCompletedDate === 'string' ? parseISO(lastCompletedDate) : lastCompletedDate

  switch (intervalUnit) {
    case 'hours':
      return addHours(baseDate, intervalValue)
    case 'days':
      return addDays(baseDate, intervalValue)
    case 'weeks':
      return addWeeks(baseDate, intervalValue)
    case 'months':
      return addMonths(baseDate, intervalValue)
    case 'years':
      return addYears(baseDate, intervalValue)
    default:
      // Default to days if unknown unit
      return addDays(baseDate, intervalValue)
  }
}

/**
 * Calculate next due date from a RecurringPattern
 *
 * @param pattern - Recurring pattern object
 * @returns ISO date string of next due date
 */
export function calculateNextDueDateFromPattern(pattern: Omit<RecurringPattern, 'nextDueDate'>): string {
  const nextDue = calculateNextDueDate(
    pattern.lastCompletedDate,
    pattern.intervalValue,
    pattern.intervalUnit
  )
  return formatISO(nextDue)
}

/**
 * Calculate urgency value for a task
 * Positive for overdue (days overdue), negative for future (-days until due)
 *
 * @param nextDueDate - ISO date string or Date of next due date
 * @param now - Current date (defaults to today)
 * @returns Urgency value (positive = overdue, negative = future, 0 = today)
 */
export function calculateUrgency(nextDueDate: string | Date, now: Date = new Date()): number {
  const dueDate = typeof nextDueDate === 'string' ? parseISO(nextDueDate) : nextDueDate
  const todayStart = startOfDay(now)
  const dueDateStart = startOfDay(dueDate)

  // Positive means overdue (today - due = positive when due is in past)
  // Negative means future (today - due = negative when due is in future)
  return differenceInDays(todayStart, dueDateStart)
}

/**
 * Check if a date is before today
 *
 * @param date - ISO date string or Date to check
 * @param now - Current date (defaults to today)
 * @returns true if date is before today
 */
export function isOverdue(date: string | Date, now: Date = new Date()): boolean {
  const checkDate = typeof date === 'string' ? parseISO(date) : date
  const todayStart = startOfDay(now)
  const dateStart = startOfDay(checkDate)
  return isBefore(dateStart, todayStart)
}

/**
 * Check if a date is today
 *
 * @param date - ISO date string or Date to check
 * @param now - Current date (defaults to today)
 * @returns true if date is today
 */
export function isDueToday(date: string | Date, now: Date = new Date()): boolean {
  const checkDate = typeof date === 'string' ? parseISO(date) : date
  const todayStart = startOfDay(now)
  const dateStart = startOfDay(checkDate)
  return isEqual(dateStart, todayStart)
}

/**
 * Check if a date is in the future
 *
 * @param date - ISO date string or Date to check
 * @param now - Current date (defaults to today)
 * @returns true if date is after today
 */
export function isFuture(date: string | Date, now: Date = new Date()): boolean {
  const checkDate = typeof date === 'string' ? parseISO(date) : date
  const todayStart = startOfDay(now)
  const dateStart = startOfDay(checkDate)
  return isAfter(dateStart, todayStart)
}

/**
 * Get current timestamp as ISO string
 *
 * @returns Current time as ISO date string
 */
export function nowISO(): string {
  return formatISO(new Date())
}

/**
 * Get today's date at start of day as ISO string
 *
 * @returns Today at 00:00:00 as ISO date string
 */
export function todayISO(): string {
  return formatISO(startOfDay(new Date()))
}

/**
 * Parse an ISO date string to Date object
 *
 * @param isoString - ISO date string
 * @returns Date object
 */
export function parseISODate(isoString: string): Date {
  return parseISO(isoString)
}

/**
 * Format a Date object to ISO string
 *
 * @param date - Date object
 * @returns ISO date string
 */
export function toISOString(date: Date): string {
  return formatISO(date)
}

/**
 * Get days until a date
 *
 * @param targetDate - ISO date string or Date
 * @param from - Start date (defaults to today)
 * @returns Number of days until target (negative if in past)
 */
export function daysUntil(targetDate: string | Date, from: Date = new Date()): number {
  const target = typeof targetDate === 'string' ? parseISO(targetDate) : targetDate
  const fromStart = startOfDay(from)
  const targetStart = startOfDay(target)
  return differenceInDays(targetStart, fromStart)
}
