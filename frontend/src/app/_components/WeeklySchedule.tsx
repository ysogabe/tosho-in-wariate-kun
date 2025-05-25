import React, { memo } from 'react';

interface Member {
  name: string;
  icon: string;
  className: string;
}

interface Duty {
  location: string;
  members: Member[];
}

interface DaySchedule {
  day: string;
  duties: Duty[];
}

interface WeeklyScheduleProps {
  weeklySchedule: DaySchedule[];
}

const WeeklySchedule = memo(({ weeklySchedule }: WeeklyScheduleProps) => {
  // スケジュールデータが空の場合
  if (!weeklySchedule || weeklySchedule.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4 text-[hsl(340,80%,45%)]">週間スケジュール</h2>
        <div className="text-center py-8">
          <p>スケジュールデータがありません。</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-[hsl(340,80%,45%)]">週間スケジュール</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left font-bold text-[hsl(340,70%,50%)]">図書室</th>
              {weeklySchedule.map((day, index) => (
                <th key={index} className="px-4 py-3 text-center font-bold text-[hsl(340,70%,50%)]">
                  <div>{day.day}曜日</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeklySchedule[0]?.duties?.map((duty, dutyIndex) => (
              <tr key={dutyIndex}>
                <td className="px-4 py-3 font-medium border-t-2 text-[hsl(340,80%,30%)] border-[hsl(350,80%,90%)] border-dashed">{duty.location}</td>
                {weeklySchedule.map((day, dayIndex) => (
                  <td key={dayIndex} className="px-4 py-3 text-center border-t-2 border-[hsl(350,80%,90%)] border-dashed">
                    <div className={`p-3 rounded-xl ${dutyIndex === 0 ? 'bg-[rgba(180,230,230,0.3)]' : 'bg-[rgba(255,200,210,0.3)]'}`}>
                      <div className="space-y-2">
                        {day.duties[dutyIndex]?.members?.map((member, memberIndex) => (
                          <div key={memberIndex} className="flex flex-col items-center bg-white/70 rounded-lg px-2 py-1">
                            <span className="text-xl mb-1" role="img" aria-label="member icon">{member.icon}</span>
                            <span className="text-xs text-[hsl(340,40%,40%)]">{member.className}</span>
                            <span className="text-sm text-[hsl(340,60%,50%)]">{member.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

WeeklySchedule.displayName = 'WeeklySchedule';

export default WeeklySchedule;
