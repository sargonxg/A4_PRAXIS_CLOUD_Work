// Convenience re-export of all date/time utilities for PRAXIS.
// Consumers should import from '@/lib/utils/date' for any date-related helpers.
export {
  formatDiplomaticDate,
  formatShortDate,
  formatISODate,
  formatRelativeTime,
  formatDateRange,
  isThisWeek,
  isToday,
  getGreeting,
} from './format';
