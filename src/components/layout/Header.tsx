import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface HeaderProps {
  weekNumber: number;
  year: number;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
  onExport: () => void;
}

export const Header = ({ 
  weekNumber, 
  year, 
  onPrevWeek, 
  onNextWeek, 
  onCurrentWeek,
  onExport 
}: HeaderProps) => {
  return (
    <header className="h-[72px] bg-white border-b border-border-custom px-8 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-6">
        <h1 className="text-xl font-extrabold text-[#FF4208] tracking-tight">Workload App</h1>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onCurrentWeek}
          className="h-9 px-4 border-border-custom text-text-muted hover:text-text-main font-bold text-xs rounded-lg transition-all"
        >
          Current Week
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onPrevWeek}
          className="w-9 h-9 p-0 border border-border-custom rounded-lg hover:bg-bg-main"
        >
          <ChevronLeft size={18} className="text-text-muted" />
        </Button>
        <div className="text-lg font-bold text-text-main">
          Week {weekNumber}, {year}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onNextWeek}
          className="w-9 h-9 p-0 border border-border-custom rounded-lg hover:bg-bg-main"
        >
          <ChevronRight size={18} className="text-text-muted" />
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Button 
          size="sm" 
          className="bg-[#FF4208] hover:bg-[#D93807] h-10 px-5 rounded-lg font-bold text-sm shadow-sm"
          onClick={onExport}
        >
          Export Report
        </Button>
      </div>
    </header>
  );
};
