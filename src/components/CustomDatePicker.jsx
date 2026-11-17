import React, { useState, useEffect, useRef } from "react";
import dayjs from "dayjs";
import {
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import {
  MONTHS,
  WEEK_DAYS,
  STYLES,
  DATE_FORMATS,
  DATE_UNITS,
  DATE_VIEWS,
  TIME_CONSTANTS,
  VALIDATION_TYPES,
  BUTTON_TYPES,
  QUICK_FILTER_KEYS,
  PAST_QUICK_FILTER_VALUES,
  PAST_QUICK_FILTER_LABELS,
  FUTURE_QUICK_FILTER_VALUES,
  FUTURE_QUICK_FILTER_LABELS,
} from "../contants/constants";

function DateTimeRangePickerComponent({
  dateRange,
  setDateRange,
  displayText,
  handleClearDates,
  t,
  maxDate,
  minDate,
  allowFutureDates = true,
  useFuturePresets = false,
}) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [tempRange, setTempRange] = useState({ start: null, end: null });

  const [timeRange, setTimeRange] = useState({
    startTime: useFuturePresets
      ? dayjs().format(DATE_FORMATS.time)
      : dayjs().subtract(1, DATE_UNITS.HOUR).format(DATE_FORMATS.time),
    endTime: useFuturePresets
      ? dayjs().add(1, DATE_UNITS.HOUR).format(DATE_FORMATS.time)
      : dayjs().format(DATE_FORMATS.time),
  });

  const [view, setView] = useState(DATE_VIEWS.DAYS);
  const [validationError, setValidationError] = useState(null);
  const calendarRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setShowCalendar(false);
        setShowDropdown(false); // Also close the main dropdown
        setView(DATE_VIEWS.DAYS);
        setValidationError(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!dateRange.start && !dateRange.end) {
      setTimeRange({
        startTime: useFuturePresets
          ? dayjs().format(DATE_FORMATS.time)
          : dayjs().subtract(1, DATE_UNITS.HOUR).format(DATE_FORMATS.time),
        endTime: useFuturePresets
          ? dayjs().add(1, DATE_UNITS.HOUR).format(DATE_FORMATS.time)
          : dayjs().format(DATE_FORMATS.time),
      });
      setTempRange({ start: null, end: null });
    }
  }, [dateRange, useFuturePresets]);

  const validateTime = (time) => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  };

  const validateDateRange = (start, end) => {
    if (!start || !end) {
      return { type: VALIDATION_TYPES.RANGE, message: t("VALIDATION.SELECT_BOTH_DATES") };
    }

    if (!start.isValid() || !end.isValid()) {
      return { type: VALIDATION_TYPES.DATE, message: t("VALIDATION.INVALID_DATE") };
    }

    if (end.isBefore(start)) {
      return { type: VALIDATION_TYPES.RANGE, message: t("VALIDATION.END_BEFORE_START") };
    }

    if (!allowFutureDates && start.isAfter(dayjs(), DATE_UNITS.DAY)) {
      return { type: VALIDATION_TYPES.DATE, message: t("VALIDATION.NO_FUTURE_DATES") };
    }

    if (minDate && start.isBefore(minDate, DATE_UNITS.DAY)) {
      return {
        type: VALIDATION_TYPES.DATE,
        message: t("VALIDATION.MIN_DATE", {
          date: minDate.format(DATE_FORMATS.DATE_DISPLAY),
        }),
      };
    }

    if (maxDate && end.isAfter(maxDate, DATE_UNITS.DAY)) {
      return {
        type: VALIDATION_TYPES.DATE,
        message: t("VALIDATION.MAX_DATE", {
          date: maxDate.format(DATE_FORMATS.DATE_DISPLAY),
        }),
      };
    }

    const daysDiff = end.diff(start, DATE_UNITS.DAY);
    if (daysDiff > 365) {
      return { type: VALIDATION_TYPES.RANGE, message: t("VALIDATION.MAX_RANGE_365") };
    }

    return null;
  };

  const validateTimeRange = (startTime, endTime, startDate, endDate) => {
    if (!validateTime(startTime) || !validateTime(endTime)) {
      return { type: VALIDATION_TYPES.TIME, message: t("VALIDATION.INVALID_TIME_FORMAT") };
    }

    if (startDate.isSame(endDate, DATE_UNITS.DAY)) {
      const [startHour, startMin] = startTime.split(":").map(Number);
      const [endHour, endMin] = endTime.split(":").map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (endMinutes <= startMinutes) {
        return { type: VALIDATION_TYPES.TIME, message: t("VALIDATION.END_TIME_AFTER_START") };
      }
    }

    return null;
  };

  const handleQuickFilterSelection = (filterValue) => {
    setValidationError(null);
    const now = dayjs();
    let start, end;
    let startTime, endTime;

    switch (filterValue) {
      // Future presets
      case QUICK_FILTER_KEYS.NEXT_3_HOURS:
        start = now;
        end = now.add(3, DATE_UNITS.HOUR);
        startTime = start.format(DATE_FORMATS.time);
        endTime = end.format(DATE_FORMATS.time);
        break;

      case QUICK_FILTER_KEYS.NEXT_6_HOURS:
        start = now;
        end = now.add(6, DATE_UNITS.HOUR);
        startTime = start.format(DATE_FORMATS.time);
        endTime = end.format(DATE_FORMATS.time);
        break;

      case QUICK_FILTER_KEYS.NEXT_12_HOURS:
        start = now;
        end = now.add(12, DATE_UNITS.HOUR);
        startTime = start.format(DATE_FORMATS.time);
        endTime = end.format(DATE_FORMATS.time);
        break;

      case QUICK_FILTER_KEYS.NEXT_24_HOURS:
        start = now;
        end = now.add(24, DATE_UNITS.HOUR);
        startTime = start.format(DATE_FORMATS.time);
        endTime = end.format(DATE_FORMATS.time);
        break;

      case QUICK_FILTER_KEYS.NEXT_2_DAYS:
        start = now;
        end = now.add(2, DATE_UNITS.DAY);
        startTime = start.format(DATE_FORMATS.time);
        endTime = end.format(DATE_FORMATS.time);
        break;

      case QUICK_FILTER_KEYS.NEXT_7_DAYS:
        start = now;
        end = now.add(7, DATE_UNITS.DAY);
        startTime = start.format(DATE_FORMATS.time);
        endTime = end.format(DATE_FORMATS.time);
        break;

      // Past presets
      case QUICK_FILTER_KEYS.LAST_3_HOURS:
        start = now.subtract(3, DATE_UNITS.HOUR);
        end = now;
        startTime = start.format(DATE_FORMATS.time);
        endTime = end.format(DATE_FORMATS.time);
        break;

      case QUICK_FILTER_KEYS.LAST_6_HOURS:
        start = now.subtract(6, DATE_UNITS.HOUR);
        end = now;
        startTime = start.format(DATE_FORMATS.time);
        endTime = end.format(DATE_FORMATS.time);
        break;

      case QUICK_FILTER_KEYS.LAST_12_HOURS:
        start = now.subtract(12, DATE_UNITS.HOUR);
        end = now;
        startTime = start.format(DATE_FORMATS.time);
        endTime = end.format(DATE_FORMATS.time);
        break;

      case QUICK_FILTER_KEYS.LAST_24_HOURS:
        start = now.subtract(24, DATE_UNITS.HOUR);
        end = now;
        startTime = start.format(DATE_FORMATS.time);
        endTime = end.format(DATE_FORMATS.time);
        break;

      case QUICK_FILTER_KEYS.TODAY:
        start = now.startOf(DATE_UNITS.DAY);
        end = now;
        startTime = TIME_CONSTANTS.MIDNIGHT;
        endTime = end.format(DATE_FORMATS.time);
        break;

      case QUICK_FILTER_KEYS.LAST_2_DAYS:
        start = now.subtract(2, DATE_UNITS.DAY).startOf(DATE_UNITS.DAY);
        end = now;
        startTime = TIME_CONSTANTS.MIDNIGHT;
        endTime = end.format(DATE_FORMATS.time);
        break;

      case QUICK_FILTER_KEYS.LAST_7_DAYS:
        start = now.subtract(7, DATE_UNITS.DAY).startOf(DATE_UNITS.DAY);
        end = now;
        startTime = TIME_CONSTANTS.MIDNIGHT;
        endTime = end.format(DATE_FORMATS.time);
        break;

      case QUICK_FILTER_KEYS.LAST_30_DAYS:
        start = now.subtract(30, DATE_UNITS.DAY).startOf(DATE_UNITS.DAY);
        end = now;
        startTime = TIME_CONSTANTS.MIDNIGHT;
        endTime = end.format(DATE_FORMATS.time);
        break;

      case QUICK_FILTER_KEYS.THIS_MONTH:
        start = now.startOf("month");
        end = now;
        startTime = TIME_CONSTANTS.MIDNIGHT;
        endTime = end.format(DATE_FORMATS.time);
        break;

      default:
        if (useFuturePresets) {
          start = now;
          end = now.add(3, DATE_UNITS.HOUR);
        } else {
          start = now.subtract(3, DATE_UNITS.HOUR);
          end = now;
        }
        startTime = start.format(DATE_FORMATS.time);
        endTime = end.format(DATE_FORMATS.time);
    }

    const error = validateDateRange(start, end);
    if (error) {
      setValidationError(error);
      return;
    }

    setDateRange({ start, end });
    setTimeRange({ startTime, endTime });
    setTempRange({
      start: start.startOf(DATE_UNITS.DAY),
      end: end.startOf(DATE_UNITS.DAY),
    });
    setSelectedMonth(start);
    setShowDropdown(false);
  };

  const quickFilterValues = useFuturePresets
    ? FUTURE_QUICK_FILTER_VALUES
    : PAST_QUICK_FILTER_VALUES;
  const quickFilterLabels = useFuturePresets
    ? FUTURE_QUICK_FILTER_LABELS
    : PAST_QUICK_FILTER_LABELS;

  const filteredQuickFilters = quickFilterValues.map((value, index) => ({
    value,
    label: quickFilterLabels[index],
  }));

  const startOfMonth = selectedMonth.startOf(DATE_UNITS.MONTH);
  const endOfMonth = selectedMonth.endOf(DATE_UNITS.MONTH);
  const startDay = startOfMonth.day();
  const daysInMonth = endOfMonth.date();

  const days = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const currentYear = dayjs().year();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  const isDateDisabled = (date) => {
    if (!allowFutureDates && date.isAfter(dayjs(), DATE_UNITS.DAY)) {
      return true;
    }
    if (minDate && date.isBefore(minDate, DATE_UNITS.DAY)) {
      return true;
    }
    if (maxDate && date.isAfter(maxDate, DATE_UNITS.DAY)) {
      return true;
    }
    return false;
  };

  const handleDateClick = (day) => {
    if (!day) return;

    const clickedDate = selectedMonth.date(day);

    if (isDateDisabled(clickedDate)) {
      setValidationError({
        type: VALIDATION_TYPES.DATE,
        message: t("VALIDATION.DATE_NOT_SELECTABLE"),
      });
      return;
    }

    setValidationError(null);

    if (!tempRange.start || (tempRange.start && tempRange.end)) {
      setTempRange({ start: clickedDate, end: null });
    } else if (clickedDate.isBefore(tempRange.start, DATE_UNITS.DAY)) {
      setTempRange({ start: clickedDate, end: tempRange.start });
    } else {
      const error = validateDateRange(tempRange.start, clickedDate);
      if (error) {
        setValidationError(error);
        return;
      }
      setTempRange({ ...tempRange, end: clickedDate });
    }
  };

  const handleMonthSelect = (monthIndex) => {
    setSelectedMonth(selectedMonth.month(monthIndex));
    setView(DATE_VIEWS.DAYS);
  };

  const handleYearSelect = (year) => {
    setSelectedMonth(selectedMonth.year(year));
    setView(DATE_VIEWS.MONTHS);
  };

  const handleTimeChange = (type, value) => {
    const newTimeRange = {
      ...timeRange,
      [type === TIME_CONSTANTS.START ? TIME_CONSTANTS.START_TIME : TIME_CONSTANTS.END_TIME]: value,
    };

    if (!validateTime(value)) {
      setValidationError({
        type: VALIDATION_TYPES.TIME,
        message: t("VALIDATION.INVALID_TIME_FORMAT"),
      });
      return;
    }

    setValidationError(null);
    setTimeRange(newTimeRange);
  };

  const applyDateRange = () => {
    if (!tempRange.start || !tempRange.end) {
      setValidationError({
        type: VALIDATION_TYPES.RANGE,
        message: t("VALIDATION.SELECT_BOTH_DATES"),
      });
      return;
    }

    const dateError = validateDateRange(tempRange.start, tempRange.end);
    if (dateError) {
      setValidationError(dateError);
      return;
    }

    const timeError = validateTimeRange(
      timeRange.startTime,
      timeRange.endTime,
      tempRange.start,
      tempRange.end
    );
    if (timeError) {
      setValidationError(timeError);
      return;
    }

    const [startHour, startMin] = timeRange.startTime.split(":").map(Number);
    const [endHour, endMin] = timeRange.endTime.split(":").map(Number);

    const finalStart = dayjs(tempRange.start)
      .hour(startHour)
      .minute(startMin)
      .second(0);
    const finalEnd = dayjs(tempRange.end)
      .hour(endHour)
      .minute(endMin)
      .second(59);

    setDateRange({ start: finalStart, end: finalEnd });
    setShowCalendar(false);
    setView(DATE_VIEWS.DAYS);
    setValidationError(null);
  };

  const handleClearAll = () => {
    handleClearDates();
    // Reset to current time for end when clearing
    setTimeRange({
      startTime: dayjs().subtract(1, DATE_UNITS.HOUR).format(DATE_FORMATS.time),
      endTime: dayjs().format(DATE_FORMATS.time), // Current time for end
    });
    setTempRange({ start: null, end: null });
    setValidationError(null);
  };

  const renderDaysView = () => {
    const isPrevMonthDisabled =
      minDate && selectedMonth.subtract(1, DATE_UNITS.MONTH).endOf(DATE_UNITS.MONTH).isBefore(minDate, DATE_UNITS.DAY);
    const isNextMonthDisabled =
      maxDate && selectedMonth.add(1, DATE_UNITS.MONTH).startOf(DATE_UNITS.MONTH).isAfter(maxDate, DATE_UNITS.DAY);

    return (
      <>
        <div className="flex justify-between items-center mb-1">
          <button
            type={BUTTON_TYPES.BUTTON}
            disabled={isPrevMonthDisabled}
            onClick={() => !isPrevMonthDisabled && setSelectedMonth(selectedMonth.subtract(1, DATE_UNITS.MONTH))}
            className={`p-0.5 rounded-full ${
              isPrevMonthDisabled ? "text-gray-300 cursor-not-allowed" : "hover:bg-gray-100"
            }`}
            aria-label={t("PREVIOUS_MONTH")}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type={BUTTON_TYPES.BUTTON}
            onClick={() => setView(DATE_VIEWS.MONTHS)}
            className="font-semibold text-gray-700 hover:bg-gray-100 px-2 py-0.5 rounded text-xs"
          >
            {MONTHS[selectedMonth.month()]} {selectedMonth.year()}
          </button>
          <button
            type={BUTTON_TYPES.BUTTON}
            disabled={isNextMonthDisabled}
            onClick={() => !isNextMonthDisabled && setSelectedMonth(selectedMonth.add(1, DATE_UNITS.MONTH))}
            className={`p-0.5 rounded-full ${
              isNextMonthDisabled ? "text-gray-300 cursor-not-allowed" : "hover:bg-gray-100"
            }`}
            aria-label={t("NEXT_MONTH")}
          >
            <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-7 text-xs font-semibold text-gray-500 mb-1">
          {WEEK_DAYS.map((day) => (
            <div key={day} className="text-center">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5 text-xs">
          {days.map((day, idx) => {
            if (!day) {
              return <div key={idx} className="invisible h-5" />;
            }

            const current = dayjs(selectedMonth).date(day);
            const isDisabled = isDateDisabled(current);
            const isSelected =
              tempRange.start &&
              tempRange.end &&
              current.isAfter(tempRange.start, DATE_UNITS.DAY) &&
              current.isBefore(tempRange.end, DATE_UNITS.DAY);
            const isStart = tempRange.start?.isSame(current, DATE_UNITS.DAY);
            const isEnd = tempRange.end?.isSame(current, DATE_UNITS.DAY);

            return (
              <div
                key={idx}
                className={`h-5 flex items-center justify-center rounded text-xs font-medium
                  ${
                    isDisabled
                      ? "text-gray-300 cursor-not-allowed"
                      : isStart || isEnd
                      ? "bg-blue-500 text-white cursor-pointer"
                      : isSelected
                      ? "bg-blue-100 text-blue-600 cursor-pointer"
                      : "hover:bg-gray-100 text-gray-700 cursor-pointer"
                  }`}
                onClick={() => !isDisabled && handleDateClick(day)}
              >
                {day}
              </div>
            );
          })}
        </div>
      </>
    );
  };

  const renderMonthsView = () => {
    const isPrevYearDisabled =
      minDate && selectedMonth.subtract(1, DATE_UNITS.YEAR).endOf(DATE_UNITS.YEAR).isBefore(minDate, DATE_UNITS.DAY);
    const isNextYearDisabled =
      maxDate && selectedMonth.add(1, DATE_UNITS.YEAR).startOf(DATE_UNITS.YEAR).isAfter(maxDate, DATE_UNITS.DAY);

    return (
      <>
        <div className="flex justify-between items-center mb-2">
          <button
            type={BUTTON_TYPES.BUTTON}
            disabled={isPrevYearDisabled}
            onClick={() => !isPrevYearDisabled && setSelectedMonth(selectedMonth.subtract(1, DATE_UNITS.YEAR))}
            className={`p-0.5 rounded-full ${
              isPrevYearDisabled ? "text-gray-300 cursor-not-allowed" : "hover:bg-gray-100"
            }`}
            aria-label={t("PREVIOUS_YEAR")}
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type={BUTTON_TYPES.BUTTON}
            onClick={() => setView(DATE_VIEWS.YEARS)}
            className="font-semibold text-gray-700 hover:bg-gray-100 px-2 py-0.5 rounded text-xs"
          >
            {selectedMonth.year()}
          </button>
          <button
            type={BUTTON_TYPES.BUTTON}
            disabled={isNextYearDisabled}
            onClick={() => !isNextYearDisabled && setSelectedMonth(selectedMonth.add(1, DATE_UNITS.YEAR))}
            className={`p-0.5 rounded-full ${
              isNextYearDisabled ? "text-gray-300 cursor-not-allowed" : "hover:bg-gray-100"
            }`}
            aria-label={t("NEXT_YEAR")}
          >
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {MONTHS.map((month, index) => {
            const monthDate = selectedMonth.month(index);
            const isMonthDisabled =
              (minDate && monthDate.endOf(DATE_UNITS.MONTH).isBefore(minDate, DATE_UNITS.DAY)) ||
              (maxDate && monthDate.startOf(DATE_UNITS.MONTH).isAfter(maxDate, DATE_UNITS.DAY));

            return (
              <button
                type={BUTTON_TYPES.BUTTON}
                key={month}
                disabled={isMonthDisabled}
                onClick={() => !isMonthDisabled && handleMonthSelect(index)}
                className={`p-1.5 text-xs rounded font-medium ${
                  isMonthDisabled
                    ? "text-gray-300 cursor-not-allowed bg-gray-50"
                    : selectedMonth.month() === index
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {month.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </>
    );
  };

  const renderYearsView = () => {
    const isPrevDecadeDisabled =
      minDate && selectedMonth.subtract(10, DATE_UNITS.YEAR).endOf(DATE_UNITS.YEAR).isBefore(minDate, DATE_UNITS.DAY);
    const isNextDecadeDisabled =
      maxDate && selectedMonth.add(10, DATE_UNITS.YEAR).startOf(DATE_UNITS.YEAR).isAfter(maxDate, DATE_UNITS.DAY);

    return (
      <>
        <div className="flex justify-between items-center mb-2">
          <button
            type={BUTTON_TYPES.BUTTON}
            disabled={isPrevDecadeDisabled}
            onClick={() => !isPrevDecadeDisabled && setSelectedMonth(selectedMonth.subtract(10, DATE_UNITS.YEAR))}
            className={`p-0.5 rounded-full ${
              isPrevDecadeDisabled ? "text-gray-300 cursor-not-allowed" : "hover:bg-gray-100"
            }`}
            aria-label={t("PREVIOUS_DECADE")}
          >
            <ChevronLeft size={14} />
          </button>
          <span className="font-semibold text-gray-700 text-xs">
            {years[0]} - {years[years.length - 1]}
          </span>
          <button
            type={BUTTON_TYPES.BUTTON}
            disabled={isNextDecadeDisabled}
            onClick={() => !isNextDecadeDisabled && setSelectedMonth(selectedMonth.add(10, DATE_UNITS.YEAR))}
            className={`p-0.5 rounded-full ${
              isNextDecadeDisabled ? "text-gray-300 cursor-not-allowed" : "hover:bg-gray-100"
            }`}
            aria-label={t("NEXT_DECADE")}
          >
            <ChevronRight size={14} />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-1 max-h-40 overflow-y-auto">
          {years.map((year) => {
            const yearDate = selectedMonth.year(year);
            const isYearDisabled =
              (minDate && yearDate.endOf(DATE_UNITS.YEAR).isBefore(minDate, DATE_UNITS.DAY)) ||
              (maxDate && yearDate.startOf(DATE_UNITS.YEAR).isAfter(maxDate, DATE_UNITS.DAY));

            return (
              <button
                type={BUTTON_TYPES.BUTTON}
                key={year}
                disabled={isYearDisabled}
                onClick={() => !isYearDisabled && handleYearSelect(year)}
                className={`p-1.5 text-xs rounded font-medium ${
                  isYearDisabled
                    ? "text-gray-300 cursor-not-allowed bg-gray-50"
                    : selectedMonth.year() === year
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {year}
              </button>
            );
          })}
        </div>
      </>
    );
  };

  const isDateSelected = dateRange.start && dateRange.end;

  return (
    <div className="relative w-full h-full" ref={calendarRef}>
      <div
        className={`flex items-center justify-between gap-1.5 w-full h-9 px-2.5 border border-gray-300 dark:border-gray-500 rounded-md bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-1 focus:ring-custom-bg focus:border-custom-bg cursor-pointer text-xs`}
        style={{ minWidth: 0 }}
        onClick={() => setShowDropdown((prev) => !prev)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') setShowDropdown((prev) => !prev); }}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <Calendar size={12} className="text-gray-600 dark:text-gray-400" />
          <span className="text-gray-700 dark:text-gray-300 truncate font-medium flex-1 text-left text-xs">
            {displayText || t("SELECT_DATE_TIME")}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {isDateSelected ? (
            <button
              type={BUTTON_TYPES.BUTTON}
              onClick={(e) => {
                e.stopPropagation();
                handleClearAll();
              }}
              className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors flex-shrink-0"
              title={t("CLEAR_DATE_RANGE")}
            >
              <X size={12} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" />
            </button>
          ) : (
            <ChevronDown size={12} className="text-gray-600 dark:text-gray-400" />
          )}
        </div>
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
          {filteredQuickFilters.map((filter) => (
            <button
              type={BUTTON_TYPES.BUTTON}
              key={filter.value}
              onClick={() => handleQuickFilterSelection(filter.value)}
              className="w-full px-2.5 py-1.5 text-xs text-left hover:bg-gray-100 transition-colors font-medium"
              style={{ fontSize: "0.7rem" }}
            >
              {filter.label}
            </button>
          ))}

          <button
            type={BUTTON_TYPES.BUTTON}
            onClick={() => {
              setShowCalendar(true);
              setShowDropdown(false);
              setValidationError(null);
            }}
            className="w-full px-2.5 py-1.5 text-left hover:bg-gray-100 border-t mt-1 font-medium"
            style={{ fontSize: "0.7rem" }}
          >
            📅 {t("SELECT_FROM_CALENDAR")}
          </button>
        </div>
      )}

      {showCalendar && (
        <div className="absolute z-50 mt-2 w-64 bg-white border border-gray-300 rounded-md shadow-lg p-2.5">
          {validationError && (
            <div className="mb-2.5 p-2 bg-red-50 border border-red-200 rounded-md flex items-start gap-1.5">
              <AlertCircle size={12} className="text-red-500 mt-0.5 flex-shrink-0" />
              <span className="text-red-600" style={{ fontSize: "0.7rem" }}>
                {validationError.message}
              </span>
            </div>
          )}

          {view === DATE_VIEWS.DAYS && renderDaysView()}
          {view === DATE_VIEWS.MONTHS && renderMonthsView()}
          {view === DATE_VIEWS.YEARS && renderYearsView()}

          <div className="flex items-center justify-between mt-2.5">
            <div className="flex flex-col text-gray-600">
              <label className="font-semibold mb-0.5" style={{ fontSize: "0.7rem" }}>
                {t("START_TIME")}
              </label>
              <input
                type="time"
                value={timeRange.startTime}
                onChange={(e) => handleTimeChange(TIME_CONSTANTS.START, e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1 w-24"
                style={{ fontSize: "0.7rem" }}
              />
            </div>
            <div className="flex flex-col text-gray-600">
              <label className="font-semibold mb-0.5" style={{ fontSize: "0.7rem" }}>
                {t("END_TIME")}
              </label>
              <input
                type="time"
                value={timeRange.endTime}
                onChange={(e) => handleTimeChange(TIME_CONSTANTS.END, e.target.value)}
                className="border border-gray-300 rounded-md px-2 py-1 w-24"
                style={{ fontSize: "0.7rem" }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-2.5">
            <button
              type={BUTTON_TYPES.BUTTON}
              onClick={() => {
                setShowCalendar(false);
                setView(DATE_VIEWS.DAYS);
                setValidationError(null);
              }}
              className="px-2.5 py-1 rounded-md hover:bg-gray-100 text-gray-600 font-semibold"
              style={{ fontSize: "0.7rem" }}
            >
              {t("CANCEL")}
            </button>
            <button
              type={BUTTON_TYPES.BUTTON}
              onClick={applyDateRange}
              className="px-2.5 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 font-semibold"
              style={{ fontSize: "0.7rem" }}
            >
              {t("APPLY")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DateTimeRangePickerComponent;