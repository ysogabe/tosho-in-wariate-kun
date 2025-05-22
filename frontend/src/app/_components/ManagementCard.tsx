import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ManagementCardProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  link: string;
}

const ManagementCard: React.FC<ManagementCardProps> = ({ title, icon, description, link }) => {
  return (
    <Link href={link} className="block h-full">
      <Card className={cn(
        "h-full p-6 border-2 border-dashed border-secondary hover:shadow-lg",
        "transition-all duration-300 hover:translate-y-[-5px]"
      )}>
        <div className="flex items-center mb-4">
          <div className="text-primary text-3xl mr-3 animate-float">
            {icon}
          </div>
          <h3 className="text-xl font-bold text-text">{title}</h3>
        </div>
        <p className="text-text-light">{description}</p>
      </Card>
    </Link>
  );
};

export default ManagementCard;
