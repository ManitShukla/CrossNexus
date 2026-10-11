import React, { useState, useEffect } from 'react';
import { Clock, MapPin, User, CheckCircle2, Radio, Calendar } from 'lucide-react';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function DayView({ schedule = [] }) {
  // Live temporal state updating every second to guarantee boundary detection without refresh
  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentDayIndex = currentDate.getDay();
  const currentDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDayIndex];
  
  // Default to today if weekday, else Monday
  const initialDay = WEEKDAYS.includes(currentDayName) ? currentDayName : 'Monday';
  const [selectedDay, setSelectedDay] = useState(initialDay);

  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();

  // Filter and sort slots for selected day
  const daySlots = schedule
    .filter((s) => s.day === selectedDay)
    .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));

  const isSelectedDayToday = selectedDay === currentDayName;

  return (
    <div className="space-y-4 font-mono">
      {/* DAY SELECTOR TABS */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stroke-dim pb-3">
        <div className="flex flex-wrap gap-1">
          {WEEKDAYS.map((d) => {
            const isToday = d === currentDayName;
            const isSelected = d === selectedDay;
            return (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`px-3 py-1.5 text-xs uppercase tracking-label border transition-colors flex items-center gap-1.5 ${
                  isSelected
                    ? 'border-phosphor bg-phosphor/10 text-phosphor font-bold'
                    : 'border-stroke-dim text-tactical-muted hover:border-stroke-bright hover:text-tactical-bright'
                }`}
              >
                <span>{d.slice(0, 3).toUpperCase()}</span>
                {isToday && (
                  <span className="w-1.5 h-1.5 bg-phosphor inline-block animate-pulse" title="Current Day" />
                )}
              </button>
            );
          })}
        </div>

        <div className="text-[11px] text-tactical-muted uppercase flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-teal" />
          <span>DAY SORTIES: {daySlots.length} ENGAGEMENTS</span>
        </div>
      </div>

      {/* TIMELINE STREAM */}
      {daySlots.length === 0 ? (
        <div className="fui-panel border border-stroke-dim p-8 text-center bg-charcoal-panel">
          <div className="text-xs text-tactical-muted uppercase tracking-label">
            // NO SORTIES SCHEDULED FOR {selectedDay.toUpperCase()} // ALL CLEAR
          </div>
          <div className="text-[11px] text-tactical-muted mt-2">
            No institutional laboratory or classroom requirements mapped for this date.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {daySlots.map((slot, idx) => {
            const startMin = parseTimeToMinutes(slot.startTime);
            const endMin = parseTimeToMinutes(slot.endTime);

            const isPast = isSelectedDayToday && currentMinutes >= endMin;
            const isActive = isSelectedDayToday && currentMinutes >= startMin && currentMinutes < endMin;
            const isFuture = isSelectedDayToday && currentMinutes < startMin;

            const cardBorder = isActive
              ? 'border-phosphor bg-charcoal-panel'
              : isPast
              ? 'border-stroke-dim bg-charcoal-base opacity-75'
              : 'border-stroke-mid bg-charcoal-panel';

            return (
              <div
                key={slot._id || idx}
                className={`fui-panel border p-4 transition-all relative ${cardBorder}`}
              >
                <div className="fui-reticle-tl" />
                <div className="fui-reticle-tr" />
                <div className="fui-reticle-bl" />
                <div className="fui-reticle-br" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2 pb-2 border-b border-stroke-dim">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-teal px-1.5 py-0.5 border border-teal/40 bg-teal/5">
                      {slot.subjectCode}
                    </span>
                    <h3 className="text-sm font-bold text-tactical-bright uppercase tracking-wide">
                      {slot.subjectName}
                    </h3>
                  </div>

                  {/* STATUS BADGE */}
                  <div>
                    {isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold tracking-alert text-phosphor border border-phosphor bg-phosphor/10 uppercase tabular-nums">
                        <Radio className="w-3 h-3 text-phosphor animate-pulse" />
                        IN SESSION ({Math.max(0, endMin - currentMinutes)}M LEFT)
                      </span>
                    ) : isPast ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] text-tactical-muted border border-stroke-dim bg-black/40 uppercase">
                        <CheckCircle2 className="w-3 h-3 text-tactical-muted" />
                        COMPLETED
                      </span>
                    ) : isFuture ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] text-teal border border-teal/30 bg-teal/5 uppercase tabular-nums">
                        <Clock className="w-3 h-3 text-teal" />
                        T-MINUS {Math.max(0, startMin - currentMinutes)}M
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] text-tactical-muted border border-stroke-dim uppercase">
                        SCHEDULED
                      </span>
                    )}
                  </div>
                </div>

                {/* DETAILS METRICS */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-tactical-muted">
                    <Clock className="w-3.5 h-3.5 text-tactical-bright" />
                    <span className="text-tactical-bright font-semibold tabular-nums">
                      {slot.startTime} — {slot.endTime} HRS
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-tactical-muted">
                    <MapPin className="w-3.5 h-3.5 text-phosphor" />
                    <span>ROOM:</span>
                    <span className="text-tactical-bright font-medium">{slot.room}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-tactical-muted">
                    <User className="w-3.5 h-3.5 text-teal" />
                    <span>OFFICER:</span>
                    <span className="text-tactical-bright font-medium truncate">
                      {slot.faculty || 'FACULTY TBA'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
