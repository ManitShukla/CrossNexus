import React, { useState, useEffect } from 'react';
import { MapPin, User, Clock } from 'lucide-react';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_BLOCKS = [
  { label: '09:00 - 10:00', start: '09:00', end: '10:00' },
  { label: '10:00 - 11:00', start: '10:00', end: '11:00' },
  { label: '11:15 - 12:15', start: '11:15', end: '12:15' },
  { label: '13:00 - 14:00', start: '13:00', end: '14:00' },
  { label: '14:00 - 15:00', start: '14:00', end: '15:00' },
  { label: '15:00 - 16:00', start: '15:00', end: '16:00' },
];

export default function WeekView({ schedule = [] }) {
  // Live temporal ticker for autonomous matrix boundary synchronization
  const [currentDate, setCurrentDate] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentDayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDate.getDay()];
  const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();

  const parseTimeToMinutes = (t) => {
    if (!t) return 0;
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  // Find slot that falls within a given day and time block
  const getSlotForCell = (day, block) => {
    const blockStart = parseTimeToMinutes(block.start);
    const blockEnd = parseTimeToMinutes(block.end);

    return schedule.find((s) => {
      if (s.day !== day) return false;
      const slotStart = parseTimeToMinutes(s.startTime);
      const slotEnd = parseTimeToMinutes(s.endTime);
      return slotStart < blockEnd && slotEnd > blockStart;
    });
  };

  return (
    <div className="font-mono overflow-x-auto border border-stroke-bright bg-black selection:bg-phosphor selection:text-black">
      <div className="min-w-[800px]">
        {/* MATRIX HEADER: DAYS */}
        <div className="grid grid-cols-6 border-b border-stroke-bright bg-charcoal-base text-xs">
          <div className="p-3 border-r border-stroke-dim font-bold text-tactical-muted uppercase tracking-label flex items-center justify-between">
            <span>TIME // DAY</span>
            <span>+</span>
          </div>
          {WEEKDAYS.map((day) => {
            const isToday = day === currentDayName;
            return (
              <div
                key={day}
                className={`p-3 text-center uppercase tracking-label font-bold border-r last:border-r-0 border-stroke-dim ${
                  isToday
                    ? 'border-t-2 border-t-phosphor bg-phosphor/10 text-phosphor'
                    : 'text-tactical-bright'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span>{day}</span>
                  {isToday && <span className="w-1.5 h-1.5 bg-phosphor inline-block animate-pulse" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* MATRIX ROWS: TIME BLOCKS */}
        {TIME_BLOCKS.map((block) => (
          <div
            key={block.label}
            className="grid grid-cols-6 border-b last:border-b-0 border-stroke-dim text-xs min-h-[90px]"
          >
            {/* TIME LABEL COLUMN */}
            <div className="p-3 border-r border-stroke-dim bg-charcoal-base flex flex-col justify-center text-[11px] text-tactical-muted tabular-nums">
              <span className="font-semibold text-tactical-bright">{block.start}</span>
              <span className="text-[10px] text-stroke-bright font-mono">TO {block.end}</span>
            </div>

            {/* DAY SLOTS FOR CURRENT TIME BLOCK */}
            {WEEKDAYS.map((day) => {
              const slot = getSlotForCell(day, block);
              const isToday = day === currentDayName;

              let isLive = false;
              if (slot && isToday) {
                const sStart = parseTimeToMinutes(slot.startTime);
                const sEnd = parseTimeToMinutes(slot.endTime);
                isLive = currentMinutes >= sStart && currentMinutes < sEnd;
              }

              return (
                <div
                  key={day}
                  className={`p-2.5 border-r last:border-r-0 border-stroke-dim flex flex-col justify-between transition-colors ${
                    isLive
                      ? 'border border-phosphor bg-phosphor/15'
                      : slot
                      ? 'bg-charcoal-panel hover:bg-charcoal-base'
                      : 'bg-black/80 hover:bg-black'
                  }`}
                >
                  {slot ? (
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className={`text-[10px] font-bold px-1 py-0.2 border ${
                          isLive 
                            ? 'border-phosphor text-phosphor bg-black' 
                            : 'border-teal text-teal bg-black'
                        }`}>
                          {slot.subjectCode}
                        </span>
                        {isLive && (
                          <span className="text-[9px] text-phosphor font-bold animate-pulse">
                            [LIVE]
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] font-semibold text-tactical-bright leading-tight line-clamp-2 uppercase">
                        {slot.subjectName}
                      </div>

                      <div className="mt-2 text-[10px] text-tactical-muted space-y-0.5">
                        <div className="flex items-center gap-1 truncate" title={slot.room}>
                          <MapPin className="w-2.5 h-2.5 text-phosphor flex-shrink-0" />
                          <span className="truncate">{slot.room}</span>
                        </div>
                        {slot.faculty && (
                          <div className="flex items-center gap-1 truncate text-tactical-muted" title={slot.faculty}>
                            <User className="w-2.5 h-2.5 text-teal flex-shrink-0" />
                            <span className="truncate">{slot.faculty}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-[10px] text-stroke-dim select-none">
                      // NIL //
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
