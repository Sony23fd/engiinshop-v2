import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const DAY_NAMES = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"];

export function getUpcomingDeliveryDates(scheduleDaysStr: string, count: number = 2): { date: Date, formatted: string }[] {
  if (!scheduleDaysStr) scheduleDaysStr = "3,6";
  const allowedDays = scheduleDaysStr.split(",").map(Number).filter(n => !isNaN(n) && n >= 0 && n <= 6);
  if (allowedDays.length === 0) allowedDays.push(3, 6);

  allowedDays.sort((a, b) => a - b);
  
  const results = [];
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  
  // Start from tomorrow
  currentDate.setDate(currentDate.getDate() + 1);

  let daysChecked = 0;
  while (results.length < count && daysChecked < 30) {
    const dayOfWeek = currentDate.getDay();
    if (allowedDays.includes(dayOfWeek)) {
      const mnDateStr = `${currentDate.getMonth() + 1} сарын ${currentDate.getDate()}, ${DAY_NAMES[dayOfWeek]}`;
      results.push({
        date: new Date(currentDate), // Keep exact Date
        formatted: mnDateStr
      });
    }
    currentDate.setDate(currentDate.getDate() + 1);
    daysChecked++;
  }
  
  return results;
}
