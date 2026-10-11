import React, { useState, useEffect } from 'react';
import { Clock, Radio, MapPin, User, AlertCircle, Compass, Zap } from 'lucide-react';

/**
 * Tactical Real-Time Class Detector: CurrentSlotCard
 * Interrogates system clock against active cohort schedule slots.
 * Renders active sortie telemetry or recessed standby countdowns.
 */
export default function CurrentSlotCard({ schedule = [] }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = DAYS[currentTime.getDay()];
  const isWeekend = dayName === 'Saturday' || dayName === 'Sunday';

  // Convert HH:mm to minutes from midnight
  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const currentSeconds = currentTime.getSeconds();

  // Filter slots for today
  const todaySlots = schedule
    .filter((s) => s.day === dayName)
    .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));

  // Determine active slot
  const activeSlot = todaySlots.find((s) => {
    const start = parseTimeToMinutes(s.startTime);
    const end = parseTimeToMinutes(s.endTime);
    return currentMinutes >= start && currentMinutes < end;
  });

  // Determine immediate next slot today
  const nextSlot = todaySlots.find((s) => {
    const start = parseTimeToMinutes(s.startTime);
    return start > currentMinutes;
  });

  // Calculate earliest Monday slot for weekend standby
  const mondaySlots = schedule
    .filter((s) => s.day === 'Monday')
    .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime));
  const nextMondaySlot = mondaySlots[0] || null;

  // Calculate elapsed progress for active slot
  let elapsedPercent = 0;
  let remainingMins = 0;
  let tickerString = '□□□□□□□□□□';

  if (activeSlot) {
    const start = parseTimeToMinutes(activeSlot.startTime);
    const end = parseTimeToMinutes(activeSlot.endTime);
    const totalDuration = end - start;
    const elapsedMinutes = Math.max(0, currentMinutes - start);

    remainingMins = Math.max(0, end - currentMinutes);
    elapsedPercent = totalDuration > 0
      ? Math.min(100, Math.max(0, Math.round((elapsedMinutes / totalDuration) * 100)))
      : 0;

    const totalBlocks = 10;
    const filledBlocks = Math.round((elapsedPercent / 100) * totalBlocks);
    tickerString = '■'.repeat(filledBlocks) + '□'.repeat(totalBlocks - filledBlocks);
  }

  const militaryClock = currentTime.toTimeString().split(' ')[0] + ' HRS';

  return (
    <div className={`fui-panel border p-5 relative mb-6 font-mono transition-colors ${
      activeSlot 
        ? 'border-phosphor bg-charcoal-panel' 
        : 'border-stroke-bright bg-charcoal-panel'
    }`}>
      {/* RETICLE CORNERS */}
      <div className="fui-reticle-tl" />
      <div className="fui-reticle-tr" />
      <div className="fui-reticle-bl" />
      <div className="fui-reticle-br" />

      {/* CROSSHAIRS */}
      <div className="absolute top-2 right-2 fui-crosshair">+</div>
      <div className="absolute bottom-2 left-2 fui-crosshair">+</div>

      {/* TOP HEADER RAIL */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stroke-dim pb-3 mb-4">
        <div className="flex items-center gap-2">
          {activeSlot ? (
            <>
              <span className="w-2.5 h-2.5 bg-phosphor inline-block animate-ping" />
              <span className="text-xs font-bold text-phosphor tracking-alert uppercase">
                [ ACTIVE SORTIE // HAPPENING NOW ]
              </span>
            </>
          ) : (
            <>
              <span className="w-2.5 h-2.5 bg-teal inline-block opacity-70" />
              <span className="text-xs font-bold text-teal tracking-alert uppercase">
                [ NO ACTIVE SORTIE // RECESSED ]
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-tactical-muted uppercase">{dayName.toUpperCase()}</span>
          <span className="text-stroke-bright">//</span>
          <span className="text-tactical-bright font-bold flex items-center gap-1.5 tabular-nums">
            <Clock className="w-3.5 h-3.5 text-teal" />
            {militaryClock}
          </span>
        </div>
      </div>

      {/* MAIN TELEMETRY BODY */}
      {activeSlot ? (
        <div>
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <div className="text-[11px] text-teal tracking-label uppercase mb-1">
                ENGAGEMENT CODE: {activeSlot.subjectCode}
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-tactical-bright tracking-wide">
                {activeSlot.subjectName}
              </h2>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-tactical-muted uppercase tracking-label">TIME WINDOW</div>
              <div className="text-sm font-bold text-phosphor tabular-nums">
                {activeSlot.startTime} — {activeSlot.endTime}
              </div>
            </div>
          </div>

          {/* TELEMETRY METRICS GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-black border border-stroke-dim mb-4 text-xs">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-phosphor flex-shrink-0" />
              <div>
                <div className="text-[10px] text-tactical-muted uppercase">VECTOR / ROOM</div>
                <div className="text-tactical-bright font-semibold">{activeSlot.room}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-teal flex-shrink-0" />
              <div>
                <div className="text-[10px] text-tactical-muted uppercase">FACULTY OFFICER</div>
                <div className="text-tactical-bright font-semibold">{activeSlot.faculty || 'FACULTY TBA'}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-phosphor flex-shrink-0" />
              <div>
                <div className="text-[10px] text-tactical-muted uppercase">TIME REMAINING</div>
                <div className="text-phosphor font-bold tabular-nums">ENDS IN {remainingMins} MINS</div>
              </div>
            </div>
          </div>

          {/* BRUTALIST SEGMENTED PROGRESS TICKER */}
          <div className="border border-stroke-dim bg-charcoal-base p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-tactical-muted uppercase">PROGRESSION:</span>
              <span className="text-phosphor font-mono tracking-widest text-sm">{tickerString}</span>
              <span className="text-tactical-bright font-semibold text-[11px] tabular-nums">{elapsedPercent}% ELAPSED</span>
            </div>
            <div className="text-[10px] text-tactical-muted uppercase tabular-nums">
              CHECKPOINT COUNTDOWN: {remainingMins}M {String(60 - currentSeconds).padStart(2, '0')}S
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="p-4 bg-black border border-stroke-dim flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-tactical-muted uppercase tracking-label mb-1">
                {isWeekend 
                  ? 'WEEKEND PROTOCOL // ACADEMIC GRID DORMANT' 
                  : 'TELEMETRY STATUS: RECESS / FREE OPERATIONAL WINDOW'}
              </div>
              <div className="text-sm font-semibold text-tactical-bright">
                {isWeekend
                  ? 'Campus laboratories and classrooms are recessed until Monday deployment.'
                  : 'No active classroom sorties currently deployed in this sector.'}
              </div>
            </div>

            {nextSlot ? (
              <div className="border-l-0 md:border-l border-stroke-dim pl-0 md:pl-4">
                <div className="text-[10px] text-phosphor uppercase tracking-alert flex items-center gap-1.5 mb-1">
                  <Radio className="w-3.5 h-3.5 text-phosphor animate-pulse" />
                  NEXT SCHEDULED SORTIE TODAY
                </div>
                <div className="text-xs font-bold text-tactical-bright">
                  {nextSlot.subjectCode} - {nextSlot.subjectName}
                </div>
                <div className="text-[11px] text-teal mt-0.5 tabular-nums">
                  AT {nextSlot.startTime} HRS ({nextSlot.room}) — T-MINUS {Math.max(0, parseTimeToMinutes(nextSlot.startTime) - currentMinutes)}M
                </div>
              </div>
            ) : isWeekend && nextMondaySlot ? (
              <div className="border-l-0 md:border-l border-stroke-dim pl-0 md:pl-4">
                <div className="text-[10px] text-teal uppercase tracking-alert flex items-center gap-1.5 mb-1">
                  <Compass className="w-3.5 h-3.5 text-teal" />
                  NEXT ACTIVE DEPLOYMENT (MONDAY)
                </div>
                <div className="text-xs font-bold text-tactical-bright">
                  {nextMondaySlot.subjectCode} - {nextMondaySlot.subjectName}
                </div>
                <div className="text-[11px] text-tactical-muted mt-0.5 tabular-nums">
                  AT {nextMondaySlot.startTime} HRS ({nextMondaySlot.room})
                </div>
              </div>
            ) : (
              <div className="text-xs text-tactical-muted uppercase">
                // ALL SORTIES FOR TODAY CONCLUDED
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
