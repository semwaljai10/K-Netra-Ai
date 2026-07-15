'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface DateTimePickerProps {
  value: string; // Expected format: YYYY-MM-DDTHH:MM
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function DateTimePicker({
  value,
  onChange,
  placeholder = 'Select Date & Time',
  required = false,
  disabled = false,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTimeMode, setActiveTimeMode] = useState<'hour' | 'minute'>('hour');
  
  // Local typable state variables for hours/minutes
  const [hourInputVal, setHourInputVal] = useState('');
  const [minuteInputVal, setMinuteInputVal] = useState('');

  // Try to use app theme context, fallback to dark if not available
  let resolvedTheme: 'light' | 'dark' = 'dark';
  try {
    const appCtx = useApp();
    if (appCtx && appCtx.resolvedTheme) {
      resolvedTheme = appCtx.resolvedTheme;
    }
  } catch {
    // Ignore context error in isolation
  }

  const isLight = resolvedTheme === 'light';

  // High-fidelity Theme colors matching side_by_side_analog_clock mockup
  const themeColors = {
    // Input element
    inputBg: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.25)',
    inputBorder: isLight ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.08)',
    inputText: isLight ? '#0f172a' : '#ffffff',
    inputPlaceholder: isLight ? 'rgba(15, 23, 42, 0.4)' : 'rgba(255, 255, 255, 0.3)',
    
    // Unified calendar-clock panel
    panelBg: isLight ? '#ffffff' : '#1e2022',
    panelBorder: isLight ? 'rgba(15, 23, 42, 0.12)' : 'rgba(255, 255, 255, 0.08)',
    panelShadow: isLight 
      ? '0 20px 40px -10px rgba(15, 23, 42, 0.15)' 
      : '0 20px 40px -10px rgba(0, 0, 0, 0.8), 0 0 1px rgba(255, 255, 255, 0.1) inset',
    
    // Text colors
    textPrimary: isLight ? '#0f172a' : '#ffffff',
    textMuted: isLight ? 'rgba(15, 23, 42, 0.5)' : '#8a99ad',
    textDisabled: isLight ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.15)',
    gridLineColor: isLight ? 'rgba(15, 23, 42, 0.06)' : 'rgba(255, 255, 255, 0.05)',
    
    // Neon Cyan glow accent (Style 2 theme)
    activeAccent: isLight ? '#2563eb' : '#00f0ff',
    activeAccentGlow: isLight ? 'rgba(37, 99, 235, 0.2)' : 'rgba(0, 240, 255, 0.3)',
    hoverBg: isLight ? 'rgba(37, 99, 235, 0.04)' : 'rgba(0, 240, 255, 0.05)',
    divider: isLight ? 'rgba(15, 23, 42, 0.08)' : 'rgba(255, 255, 255, 0.08)',
  };

  // Internal Date representation
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    if (value) return new Date(value);
    return new Date();
  });
  
  // Date for calendar month browsing page
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    if (value) return new Date(value);
    return new Date();
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const clockFaceRef = useRef<SVGSVGElement>(null);

  // Sync state when external value changes
  useEffect(() => {
    if (value) {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        setSelectedDate(parsed);
        setCurrentMonth(parsed);
      }
    }
  }, [value]);

  // Sync input text states when selectedDate changes
  useEffect(() => {
    const hrs = selectedDate.getHours();
    const displayHours = hrs % 12 === 0 ? 12 : hrs % 12;
    setHourInputVal(String(displayHours).padStart(2, '0'));
    setMinuteInputVal(String(selectedDate.getMinutes()).padStart(2, '0'));
  }, [selectedDate]);

  // Click outside to close dropdown listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Format Date to YYYY-MM-DDTHH:MM (local time format for native inputs compatibility)
  const formatLocalValue = (date: Date): string => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  // Format Date for user-facing display input field: DD-MM-YYYY HH:MM
  const formatDisplayValue = (valStr: string): string => {
    if (!valStr) return '';
    try {
      const date = new Date(valStr);
      if (isNaN(date.getTime())) return '';
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      const hh = String(date.getHours()).padStart(2, '0');
      const min = String(date.getMinutes()).padStart(2, '0');
      return `${dd}-${mm}-${yyyy}   ${hh}:${min}`;
    } catch {
      return '';
    }
  };

  // Helper calendar calculations
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // Day of week (0 to 6)
  const prevMonthDays = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const selectDay = (day: number) => {
    const updated = new Date(selectedDate);
    updated.setFullYear(year);
    updated.setMonth(month);
    updated.setDate(day);
    setSelectedDate(updated);
    onChange(formatLocalValue(updated));
  };

  // Clock Hand Angle calculations
  const hours = selectedDate.getHours();
  const minutes = selectedDate.getMinutes();

  // Convert hours/minutes to angles (degrees)
  // 12 hours representation: (hours % 12) * 30 + (minutes/60) * 30
  const hourAngle = ((hours % 12) * 30 + (minutes / 60) * 30) - 90;
  const minuteAngle = (minutes * 6) - 90;

  // Handle clicking on the analog clock dial to set hours/minutes
  const handleClockClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!clockFaceRef.current) return;
    const rect = clockFaceRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;

    // Angle in degrees from 0 to 360
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    const updated = new Date(selectedDate);

    if (activeTimeMode === 'hour') {
      // 30 degrees per hour slot
      let hourVal = Math.round(angle / 30);
      if (hourVal === 0 || hourVal === 12) hourVal = 12;
      
      // Keep AM/PM state
      const isPM = hours >= 12;
      if (isPM) {
        updated.setHours(hourVal === 12 ? 12 : hourVal + 12);
      } else {
        updated.setHours(hourVal === 12 ? 0 : hourVal);
      }
      
      // Auto transition to minute mode after setting hour
      setActiveTimeMode('minute');
    } else {
      // 6 degrees per minute slot
      const minuteVal = Math.round(angle / 6) % 60;
      updated.setMinutes(minuteVal);
    }

    setSelectedDate(updated);
    onChange(formatLocalValue(updated));
  };

  // Keyboard typing handlers for Hour Input
  const handleHourInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
    setHourInputVal(val);
    
    // Auto-update if they typed 2 digits
    if (val.length === 2) {
      let num = parseInt(val, 10);
      if (num < 1) num = 1;
      if (num > 12) num = 12;
      
      const updated = new Date(selectedDate);
      const isPM = updated.getHours() >= 12;
      if (isPM) {
        updated.setHours(num === 12 ? 12 : num + 12);
      } else {
        updated.setHours(num === 12 ? 0 : num);
      }
      setSelectedDate(updated);
      onChange(formatLocalValue(updated));
    }
  };

  const handleHourInputBlur = () => {
    if (!hourInputVal) {
      const hrs = selectedDate.getHours();
      const displayHours = hrs % 12 === 0 ? 12 : hrs % 12;
      setHourInputVal(String(displayHours).padStart(2, '0'));
      return;
    }
    let num = parseInt(hourInputVal, 10);
    if (num < 1) num = 1;
    if (num > 12) num = 12;
    
    const updated = new Date(selectedDate);
    const isPM = updated.getHours() >= 12;
    if (isPM) {
      updated.setHours(num === 12 ? 12 : num + 12);
    } else {
      updated.setHours(num === 12 ? 0 : num);
    }
    setSelectedDate(updated);
    onChange(formatLocalValue(updated));
  };

  // Keyboard typing handlers for Minute Input
  const handleMinuteInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 2);
    setMinuteInputVal(val);
    
    // Auto-update if they typed 2 digits
    if (val.length === 2) {
      let num = parseInt(val, 10);
      if (num < 0) num = 0;
      if (num > 59) num = 59;
      
      const updated = new Date(selectedDate);
      updated.setMinutes(num);
      setSelectedDate(updated);
      onChange(formatLocalValue(updated));
    }
  };

  const handleMinuteInputBlur = () => {
    if (!minuteInputVal) {
      setMinuteInputVal(String(selectedDate.getMinutes()).padStart(2, '0'));
      return;
    }
    let num = parseInt(minuteInputVal, 10);
    if (num < 0) num = 0;
    if (num > 59) num = 59;
    
    const updated = new Date(selectedDate);
    updated.setMinutes(num);
    setSelectedDate(updated);
    onChange(formatLocalValue(updated));
  };

  // AM/PM Selection Handler
  const selectAmPm = (mode: 'AM' | 'PM') => {
    const updated = new Date(selectedDate);
    const currHours = updated.getHours();
    if (mode === 'AM' && currHours >= 12) {
      updated.setHours(currHours - 12);
    } else if (mode === 'PM' && currHours < 12) {
      updated.setHours(currHours + 12);
    }
    setSelectedDate(updated);
    onChange(formatLocalValue(updated));
  };

  const setToday = () => {
    const now = new Date();
    setSelectedDate(now);
    setCurrentMonth(now);
    onChange(formatLocalValue(now));
  };

  const clearPicker = () => {
    onChange('');
  };

  const monthsList = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
  ];

  const shortMonths = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

  // Render Days Grid
  const renderCalendarDays = () => {
    const days: React.JSX.Element[] = [];

    // 1. Previous month trailing days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevDay = prevMonthDays - i;
      days.push(
        <div 
          key={`prev-${prevDay}`} 
          style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: themeColors.textDisabled, 
            fontSize: '0.85rem',
            userSelect: 'none',
            borderRight: `1px solid ${themeColors.gridLineColor}`,
            borderBottom: `1px solid ${themeColors.gridLineColor}`,
            aspectRatio: '1',
          }}
        >
          {prevDay}
        </div>
      );
    }

    // 2. Current month active days
    const isCurrentMonthSelected = 
      selectedDate.getFullYear() === year && 
      selectedDate.getMonth() === month;

    for (let d = 1; d <= daysInMonth; d++) {
      const isSelected = isCurrentMonthSelected && selectedDate.getDate() === d;
      const isToday = 
        new Date().getDate() === d && 
        new Date().getMonth() === month && 
        new Date().getFullYear() === year;

      days.push(
        <div
          key={`day-cell-${d}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRight: `1px solid ${themeColors.gridLineColor}`,
            borderBottom: `1px solid ${themeColors.gridLineColor}`,
            aspectRatio: '1',
            position: 'relative',
          }}
        >
          <button
            type="button"
            onClick={() => selectDay(d)}
            style={{
              background: 'transparent',
              border: isSelected 
                ? `2px solid ${themeColors.activeAccent}` 
                : isToday 
                  ? `1px solid ${isLight ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.25)'}` 
                  : 'none',
              borderRadius: '50%',
              color: isSelected 
                ? themeColors.activeAccent 
                : themeColors.textPrimary,
              fontWeight: isSelected ? '700' : isToday ? '600' : '400',
              width: '80%',
              height: '80%',
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              outline: 'none',
              position: 'relative',
              boxShadow: isSelected ? `0 0 10px ${themeColors.activeAccentGlow}` : 'none',
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = themeColors.hoverBg;
                e.currentTarget.style.color = themeColors.activeAccent;
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = themeColors.textPrimary;
              }
            }}
          >
            {d}

            {/* Glowing active selected day bottom accent dot */}
            {isSelected && (
              <span style={{
                position: 'absolute',
                bottom: '1px',
                width: '3px',
                height: '3px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                boxShadow: '0 0 4px #fff'
              }} />
            )}
          </button>
        </div>
      );
    }

    // 3. Next month trailing days
    const totalRendered = firstDayIndex + daysInMonth;
    const nextDaysNeeded = 42 - totalRendered;
    for (let n = 1; n <= nextDaysNeeded; n++) {
      days.push(
        <div 
          key={`next-${n}`} 
          style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: themeColors.textDisabled, 
            fontSize: '0.85rem',
            userSelect: 'none',
            borderRight: `1px solid ${themeColors.gridLineColor}`,
            borderBottom: `1px solid ${themeColors.gridLineColor}`,
            aspectRatio: '1',
          }}
        >
          {n}
        </div>
      );
    }

    return days;
  };

  // Convert hour display format
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayAmPm = hours >= 12 ? 'PM' : 'AM';

  // Format full day name and date below clock: THURSDAY, NOV 16
  const formattedDayStr = `${dayNames[selectedDate.getDay()]}, `;
  const formattedMonthStr = `${shortMonths[selectedDate.getMonth()]} ${selectedDate.getDate()}`;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Target Input Field Display */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          background: themeColors.inputBg,
          border: `1px solid ${themeColors.inputBorder}`,
          borderRadius: '6px',
          padding: '0.55rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.65 : 1,
          justifyContent: 'space-between',
          transition: 'all 0.2s',
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onMouseEnter={(e) => {
          if (!disabled) e.currentTarget.style.borderColor = themeColors.activeAccent;
        }}
        onMouseLeave={(e) => {
          if (!disabled) e.currentTarget.style.borderColor = themeColors.inputBorder;
        }}
      >
        <span style={{ 
          fontSize: '0.85rem', 
          color: value ? themeColors.inputText : themeColors.inputPlaceholder,
          userSelect: 'none'
        }}>
          {value ? formatDisplayValue(value) : placeholder}
        </span>
        <Calendar size={15} style={{ color: themeColors.textMuted, flexShrink: 0 }} />
      </div>

      {required && !value && (
        <input 
          tabIndex={-1} 
          required 
          value="" 
          onChange={() => {}} 
          style={{ opacity: 0, height: 0, width: 0, position: 'absolute', pointerEvents: 'none' }} 
        />
      )}

      {/* Unified Side-by-Side Dual Panel (Calendar & Analog Clock) */}
      {isOpen && (
        <div 
          className="animate-zoom"
          style={{
            position: 'absolute',
            top: 'calc(100% + 5px)',
            left: 0,
            zIndex: 1000,
            width: '540px', // Spacious side-by-side layout
            background: themeColors.panelBg,
            border: `1px solid ${themeColors.panelBorder}`,
            borderRadius: '20px', // High rounded corners matching image
            boxShadow: themeColors.panelShadow,
            display: 'flex',
            overflow: 'hidden',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            userSelect: 'none',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {/* Left Panel: Calendar */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0.5rem 0.5rem 1rem 1rem' }}>
            
            {/* Header: Month / Year */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              padding: '0.9rem 0.5rem 0.9rem 0',
            }}>
              <button
                type="button"
                onClick={handlePrevMonth}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: themeColors.textMuted,
                  cursor: 'pointer',
                  padding: '0.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  outline: 'none'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = themeColors.textPrimary}
                onMouseLeave={(e) => e.currentTarget.style.color = themeColors.textMuted}
              >
                <ChevronLeft size={18} />
              </button>
              
              <span style={{ 
                fontSize: '0.88rem', 
                fontWeight: '700', 
                color: themeColors.activeAccent, // Cyan Month title as shown in mockup
                letterSpacing: '1.2px',
              }}>
                {monthsList[month]} {year}
              </span>

              <button
                type="button"
                onClick={handleNextMonth}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: themeColors.textMuted,
                  cursor: 'pointer',
                  padding: '0.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  outline: 'none'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = themeColors.textPrimary}
                onMouseLeave={(e) => e.currentTarget.style.color = themeColors.textMuted}
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Weekdays Row */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              marginBottom: '4px'
            }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((dName, idx) => (
                <div 
                  key={`day-header-${idx}`} 
                  style={{ 
                    fontSize: '0.75rem', 
                    color: themeColors.textMuted, 
                    textAlign: 'center',
                    fontWeight: '600',
                    padding: '0.5rem 0',
                  }}
                >
                  {dName}
                </div>
              ))}
            </div>

            {/* Grid Line Separator */}
            <div style={{ height: '1px', background: themeColors.gridLineColor, width: '100%', marginBottom: '4px' }} />

            {/* Calendar grid box */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(7, 1fr)', 
              background: 'transparent',
              borderLeft: `1px solid ${themeColors.gridLineColor}`,
              borderTop: `1px solid ${themeColors.gridLineColor}`,
            }}>
              {renderCalendarDays()}
            </div>

          </div>

          {/* Center Divider line */}
          <div style={{ width: '1px', background: themeColors.divider, alignSelf: 'stretch' }} />

          {/* Right Panel: Analog Clock */}
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '1.5rem 1rem',
            position: 'relative'
          }}>
            {/* SVG Analog Clock Face */}
            <svg 
              ref={clockFaceRef}
              width="190" 
              height="190" 
              style={{ cursor: 'pointer', filter: isLight ? 'none' : 'drop-shadow(0 0 8px rgba(0, 240, 255, 0.15))' }}
              onClick={handleClockClick}
            >
              {/* Outer Cyan Ring */}
              <circle 
                cx="95" 
                cy="95" 
                r="82" 
                fill="rgba(0,0,0,0.1)" 
                stroke={themeColors.activeAccent} 
                strokeWidth="2.5" 
              />
              
              {/* Dial Ticks */}
              {Array.from({ length: 60 }).map((_, i) => {
                const angleRad = (i * 6) * Math.PI / 180;
                const isHour = i % 5 === 0;
                const tickLen = isHour ? 8 : 4;
                const startR = 82 - tickLen;
                const endR = 80;

                const x1 = 95 + startR * Math.cos(angleRad);
                const y1 = 95 + startR * Math.sin(angleRad);
                const x2 = 95 + endR * Math.cos(angleRad);
                const y2 = 95 + endR * Math.sin(angleRad);

                return (
                  <line 
                    key={`tick-${i}`}
                    x1={x1} 
                    y1={y1} 
                    x2={x2} 
                    y2={y2} 
                    stroke={isHour ? themeColors.textPrimary : themeColors.textMuted} 
                    strokeWidth={isHour ? '1.5' : '0.8'}
                    opacity={isHour ? 0.75 : 0.4}
                  />
                );
              })}

              {/* Hour Hand */}
              <line 
                x1="95" 
                y1="95" 
                x2={95 + 40 * Math.cos(hourAngle * Math.PI / 180)} 
                y2={95 + 40 * Math.sin(hourAngle * Math.PI / 180)} 
                stroke={themeColors.activeAccent} 
                strokeWidth="5" 
                strokeLinecap="round"
              />

              {/* Minute Hand */}
              <line 
                x1="95" 
                y1="95" 
                x2={95 + 60 * Math.cos(minuteAngle * Math.PI / 180)} 
                y2={95 + 60 * Math.sin(minuteAngle * Math.PI / 180)} 
                stroke={themeColors.activeAccent} 
                strokeWidth="3" 
                strokeLinecap="round"
              />

              {/* Center Pivot Pin */}
              <circle 
                cx="95" 
                cy="95" 
                r="4.5" 
                fill="#ffffff" 
                stroke={themeColors.activeAccent} 
                strokeWidth="1.5"
              />
            </svg>

            {/* Interactive Digital Display Area */}
            <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
              
              {/* Digital Time readout: now featuring styled text input fields */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.15rem' }}>
                <input
                  type="text"
                  value={hourInputVal}
                  onChange={handleHourInputChange}
                  onBlur={handleHourInputBlur}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    padding: 0,
                    fontFamily: 'inherit',
                    fontSize: '1.75rem',
                    fontWeight: '700',
                    color: activeTimeMode === 'hour' ? themeColors.activeAccent : themeColors.textPrimary,
                    width: '45px',
                    textAlign: 'center',
                    caretColor: themeColors.activeAccent,
                    transition: 'color 0.15s ease'
                  }}
                  onClick={() => setActiveTimeMode('hour')}
                />
                
                <span style={{ fontSize: '1.65rem', fontWeight: '700', color: themeColors.textPrimary }}>:</span>
                
                <input
                  type="text"
                  value={minuteInputVal}
                  onChange={handleMinuteInputChange}
                  onBlur={handleMinuteInputBlur}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    padding: 0,
                    fontFamily: 'inherit',
                    fontSize: '1.75rem',
                    fontWeight: '700',
                    color: activeTimeMode === 'minute' ? themeColors.activeAccent : themeColors.textPrimary,
                    width: '45px',
                    textAlign: 'center',
                    caretColor: themeColors.activeAccent,
                    transition: 'color 0.15s ease'
                  }}
                  onClick={() => setActiveTimeMode('minute')}
                />

                {/* AM & PM side-by-side toggles with highlighted active states */}
                <div style={{ display: 'flex', gap: '0.25rem', marginLeft: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => selectAmPm('AM')}
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: displayAmPm === 'AM' ? '800' : '500',
                      color: displayAmPm === 'AM' ? themeColors.activeAccent : themeColors.textMuted,
                      background: 'transparent',
                      border: 'none',
                      padding: '0.2rem 0.3rem',
                      cursor: 'pointer',
                      outline: 'none',
                      textShadow: displayAmPm === 'AM' ? `0 0 10px ${themeColors.activeAccentGlow}` : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => selectAmPm('PM')}
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: displayAmPm === 'PM' ? '800' : '500',
                      color: displayAmPm === 'PM' ? themeColors.activeAccent : themeColors.textMuted,
                      background: 'transparent',
                      border: 'none',
                      padding: '0.2rem 0.3rem',
                      cursor: 'pointer',
                      outline: 'none',
                      textShadow: displayAmPm === 'PM' ? `0 0 10px ${themeColors.activeAccentGlow}` : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    PM
                  </button>
                </div>
              </div>

              {/* Day Date Text line: THURSDAY, NOV 16 */}
              <div style={{ 
                fontSize: '0.78rem', 
                fontWeight: '600', 
                color: themeColors.textMuted, 
                marginTop: '0.25rem',
                letterSpacing: '0.5px'
              }}>
                {formattedDayStr}
                <span style={{ color: themeColors.activeAccent }}>{formattedMonthStr}</span>
              </div>
            </div>

            {/* Quick action buttons & Confirm */}
            <div style={{ 
              display: 'flex', 
              width: '100%', 
              justifyContent: 'space-between', 
              marginTop: '1.25rem', 
              gap: '0.5rem' 
            }}>
              <button
                type="button"
                onClick={clearPicker}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: themeColors.textMuted,
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  fontWeight: '700',
                  outline: 'none',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={(e) => e.currentTarget.style.color = themeColors.textMuted}
              >
                CLEAR
              </button>

              <button
                type="button"
                onClick={setToday}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: themeColors.textMuted,
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                  fontWeight: '700',
                  outline: 'none',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = themeColors.activeAccent}
                onMouseLeave={(e) => e.currentTarget.style.color = themeColors.textMuted}
              >
                NOW
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: `1px solid ${themeColors.panelBorder}`,
                  color: themeColors.activeAccent,
                  borderRadius: '6px',
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = themeColors.activeAccent;
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
                  e.currentTarget.style.color = themeColors.activeAccent;
                }}
              >
                CONFIRM
              </button>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
