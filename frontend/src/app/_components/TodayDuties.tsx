import React, { memo } from 'react';
import { cn } from '@/lib/utils';

interface Member {
  name: string;
  icon: string;
  className: string;
}

interface Duty {
  location: string;
  members: Member[];
}

interface TodayDutiesProps {
  currentDay: string;
  duties: Duty[] | undefined;
}

const TodayDuties = memo(({ currentDay, duties }: TodayDutiesProps) => {
  if (!duties) {
    return (
      <div>
        <h2 className="text-xl font-bold mb-4 text-[hsl(340,80%,45%)]">今日の当番</h2>
        <p className="text-center py-4 text-[hsl(340,60%,50%)]">今日は図書室の当番はありません</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-[hsl(340,80%,45%)]">今日の当番（{currentDay}曜日）</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {duties.map((duty, index) => (
          <div key={index} className={cn(
            "p-4 rounded-xl", 
            index === 0 ? "bg-[rgba(180,230,230,0.3)]" : "bg-[rgba(255,200,210,0.3)]"
          )}>
            <h3 className="font-bold mb-2 text-[hsl(340,80%,30%)]">{duty.location}</h3>
            <div className="space-y-2">
              {duty.members.map((member, memberIndex) => (
                <div key={memberIndex} className="flex items-center bg-white/70 rounded-lg px-3 py-2">
                  <span className="text-2xl mr-3" role="img" aria-label="member icon">{member.icon}</span>
                  <div className="flex flex-col">
                    <span className="text-xs text-[hsl(340,40%,40%)]">{member.className}</span>
                    <span className="text-md text-[hsl(340,60%,50%)]">{member.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

TodayDuties.displayName = 'TodayDuties';

export default TodayDuties;
