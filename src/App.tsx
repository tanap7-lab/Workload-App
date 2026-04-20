import React, { useEffect, useState, useRef } from 'react';
import { useTeamStore } from './hooks/useTeamStore';
import { Layout } from './components/layout/Layout';
import { Header } from './components/layout/Header';
import { MemberCard } from './components/dashboard/MemberCard';
import { StackedBarChart } from './components/analytics/StackedBarChart';
import { TrendLineChart } from './components/analytics/TrendLineChart';
import { getWeekNumber, cn } from './utils/helpers';
import { Card } from './components/ui/Card';
import { Button } from './components/ui/Button';
import { PRIORITY_COLORS, PriorityLevel } from './types';
import { ExportModal } from './components/ExportModal';
import * as XLSX from 'xlsx';
import { 
  Users, 
  Battery, 
  AlertTriangle, 
  ArrowRight,
  Calculator,
  Info,
  PlusCircle,
  Trash2,
  UserPlus
} from 'lucide-react';
import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const { 
    members, 
    currentWeek, 
    tasks, 
    loading, 
    fetchInitialData, 
    fetchWeekData,
    updateMember,
    addMember,
    deleteMember,
    carryOver
  } = useTeamStore();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [exporting, setExporting] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlYear = params.get('year');
    const urlWeek = params.get('weekNumber');
    const isPrint = params.get('print') === 'true';

    if (urlYear && urlWeek) {
      fetchInitialData(parseInt(urlYear), parseInt(urlWeek));
    } else {
      const today = new Date();
      const weekNumber = getWeekNumber(today);
      const year = today.getFullYear();
      fetchInitialData(year, weekNumber);
    }

    if (isPrint) {
      setActiveTab('print'); // Special internal tab for printing
    }
  }, []);

  const handlePrevWeek = () => {
    if (!currentWeek) return;
    let newWeek = currentWeek.week_number - 1;
    let newYear = currentWeek.year;
    if (newWeek < 1) {
      newWeek = 52;
      newYear--;
    }
    fetchWeekData(newYear, newWeek);
  };

  const handleNextWeek = () => {
    if (!currentWeek) return;
    let newWeek = currentWeek.week_number + 1;
    let newYear = currentWeek.year;
    if (newWeek > 52) {
      newWeek = 1;
      newYear++;
    }
    fetchWeekData(newYear, newWeek);
  };

  const handleCurrentWeek = () => {
    const today = new Date();
    const weekNumber = getWeekNumber(today);
    const year = today.getFullYear();
    fetchWeekData(year, weekNumber);
  };

  const handleExport = async () => {
    if (!currentWeek) return;
    setExporting(true);
    
    try {
      const url = `${window.location.origin}?year=${currentWeek.year}&weekNumber=${currentWeek.week_number}&print=true`;
      const filename = `Workload_Full_Report_W${currentWeek.week_number}_${currentWeek.year}.pdf`;

      const response = await fetch('/api/pdf/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, filename })
      });

      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup with delay to support Chrome
      setTimeout(() => {
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(downloadUrl);
      }, 60000);
      
      setIsExportModalOpen(false);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleExportData = () => {
    if (!currentWeek) return;

    const data = tasks.map(task => {
      const member = members.find(m => m.id === task.member_id);
      return {
        'Week': currentWeek.week_number,
        'Year': currentWeek.year,
        'Team Member': member?.name || 'Unknown',
        'Role': member?.role || 'N/A',
        'Priority': task.priority,
        'Task Description': task.task_name,
        'Effort (Hours)': task.effort_hours,
        'FTE Impact': ((task.effort_hours || 0) / (member?.weekly_hours || 40)).toFixed(2)
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Effort Report');
    XLSX.writeFile(wb, `Aumovio_Effort_Data_W${currentWeek.week_number}.xlsx`);
  };

  const handleCopyFromLastWeek = async () => {
    if (!currentWeek) return;
    
    let lastWeekNum = currentWeek.week_number - 1;
    let lastYear = currentWeek.year;
    if (lastWeekNum < 1) {
      lastWeekNum = 52;
      lastYear--;
    }
    
    const res = await fetch(`/api/weeks/${lastYear}/${lastWeekNum}`);
    const data = await res.json();
    
    if (data.week) {
      await carryOver(data.week.id, currentWeek.id);
      alert(`Tasks copied from Week ${lastWeekNum}, ${lastYear}`);
    }
  };

  const isCurrentWeek = () => {
    if (!currentWeek) return false;
    const today = new Date();
    return currentWeek.week_number === getWeekNumber(today) && currentWeek.year === today.getFullYear();
  };

  // Analytics Calculations
  const totalEffort = tasks.reduce((sum, t) => sum + t.effort_hours, 0);
  const totalCapacity = members.reduce((sum, m) => sum + (m.weekly_hours || 40), 0);
  const teamFTE = (totalEffort / totalCapacity) * members.length || 0;
  const avgFocus = totalEffort > 0 ? (tasks.filter(t => ['1', '2'].includes(t.priority)).reduce((sum, t) => sum + t.effort_hours, 0) / totalEffort) * 100 : 0;
  const alsHours = tasks.filter(t => t.priority === 'ALS').reduce((sum, t) => sum + t.effort_hours, 0);

  if (!currentWeek) return <div className="h-screen flex items-center justify-center font-bold text-slate-400">Loading Team Effort Tracker...</div>;

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <Header 
        weekNumber={currentWeek.week_number} 
        year={currentWeek.year} 
        onPrevWeek={handlePrevWeek} 
        onNextWeek={handleNextWeek}
        onCurrentWeek={handleCurrentWeek}
        onExport={() => setIsExportModalOpen(true)}
      />

      <ExportModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExportVisual={handleExport}
        onExportData={handleExportData}
      />

      <div id="report-container" className="flex-1 overflow-y-auto p-6 space-y-6" ref={reportRef}>
        {/* Analytics Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bento-card p-6 flex items-center gap-6">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
              <Users className="text-[#FF4208]" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-text-main">{teamFTE.toFixed(1)} FTE</span>
                <span className="bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md">Expected</span>
              </div>
              <p className="text-[11px] text-text-muted font-bold uppercase tracking-wider mt-0.5">Team Capacity</p>
            </div>
          </Card>

          <Card className="bento-card p-6 flex items-center gap-6">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Battery className="text-emerald-600" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-text-main">{avgFocus.toFixed(0)}%</span>
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md">Balanced</span>
              </div>
              <p className="text-[11px] text-text-muted font-bold uppercase tracking-wider mt-0.5">High Focus Hours</p>
            </div>
          </Card>

          <Card className="bento-card p-6 flex items-center gap-6">
            <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center">
              <AlertTriangle className="text-rose-600" size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-text-main">{alsHours}h</span>
                <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.5 rounded-md">Operational</span>
              </div>
              <p className="text-[11px] text-text-muted font-bold uppercase tracking-wider mt-0.5">ALS/Admin Support</p>
            </div>
          </Card>
        </div>

        {/* Dashboard View */}
        <AnimatePresence mode="wait">
          {(activeTab === 'dashboard' || activeTab === 'print') && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                {members.map(member => (
                  <MemberCard 
                    key={member.id} 
                    member={member} 
                    tasks={tasks.filter(t => t.member_id === member.id)}
                    weekId={currentWeek.id}
                  />
                ))}
              </div>

              {/* Effort Distribution Bento Footer */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-border-custom">
                {members.map(member => {
                  const memberTasks = tasks.filter(t => t.member_id === member.id);
                  const total = memberTasks.reduce((s, t) => s + t.effort_hours, 0);
                  const capacity = member.weekly_hours || 40;
                  const fte = Math.round((total / capacity) * 100);
                  
                  return (
                    <div key={member.id} className="flex flex-col gap-3 p-4 bento-card">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">{member.name} • EFFORT</span>
                        <span className="text-[10px] font-bold text-text-main">{total}h ({fte}% FTE)</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full flex overflow-hidden">
                        {['1', '2', '3', '4', 'ALS'].map(prio => {
                          const t = memberTasks.find(x => x.priority === prio);
                          const width = total > 0 ? ((t?.effort_hours || 0) / total) * 100 : 0;
                          return (
                            <div 
                              key={prio}
                              style={{ 
                                width: `${width}%`, 
                                backgroundColor: PRIORITY_COLORS[prio as PriorityLevel] 
                              }}
                              className="h-full transition-all duration-500"
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {isCurrentWeek() && (
                <div className="flex justify-center mt-4">
                  <Button variant="ghost" className="text-xs font-bold text-text-muted hover:text-[#FF4208] gap-2" onClick={handleCopyFromLastWeek}>
                    <ArrowRight size={14} className="rotate-180" />
                    Copy tasks from last week
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'print' && <div className="hidden print:block my-20" style={{ pageBreakAfter: 'always', breakAfter: 'page' }} />}

          {(activeTab === 'analytics' || activeTab === 'print') && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Team Performance Analytics</h2>
                  <p className="text-sm text-slate-400 font-medium">Cross-team capacity and effort distribution</p>
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <Card className="col-span-2 p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                      <Calculator size={18} className="text-[#FF4208]" />
                      Individual Effort Distribution
                    </h3>
                  </div>
                  <StackedBarChart members={members} tasks={tasks} />
                </Card>

                <Card className="p-8 bg-slate-900 text-white">
                  <h3 className="font-bold mb-6 flex items-center gap-2">
                    <Info size={18} className="text-orange-400" />
                    Priority Insights
                  </h3>
                  <div className="space-y-6">
                    {[
                      { label: 'Priority 1 (Critical Path)', hours: 62, share: '41.3%', status: 'HEALTHY', color: 'bg-rose-500' },
                      { label: 'Priority 2 (High Focus)', hours: 46, share: '30.7%', status: 'ON TARGET', color: 'bg-orange-500' },
                      { label: 'Priority 3 (Medium)', hours: 18, share: '12.0%', status: 'DEFERRED', color: 'bg-amber-500' },
                      { label: 'Priority 4 (Low)', hours: 10, share: '6.7%', status: 'MINIMAL', color: 'bg-emerald-500' },
                      { label: 'ALS (Operational)', hours: 14, share: '9.3%', status: 'HIGH RISK', color: 'bg-orange-600', alert: true },
                    ].map((row, i) => (
                      <div key={i} className="flex items-center justify-between group cursor-default">
                        <div className="flex items-center gap-4">
                          <div className={cn("w-1.5 h-8 rounded-full", row.color)} />
                          <div>
                            <div className="text-xs font-bold text-white/90">{row.label}</div>
                            <div className="text-[10px] text-white/40 font-bold uppercase">{row.share} Team Share</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black">{row.hours}h</div>
                          <div className={cn(
                            "text-[8px] font-black px-1.5 py-0.5 rounded-md inline-block mt-0.5",
                            row.alert ? "bg-rose-500/20 text-rose-400" : "bg-white/10 text-white/60"
                          )}>
                            {row.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-12 pt-12 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-black text-white/40 uppercase tracking-widest">Grand Total</div>
                      <div className="text-2xl font-black">150 Hours</div>
                    </div>
                    <div className="w-12 h-12 bg-[#FF4208] rounded-full flex items-center justify-center shadow-lg shadow-orange-900/50">
                      <CheckCircle2 size={24} />
                    </div>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {members.map(member => (
                  <Card key={member.id} className="p-6">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                      {member.name}'s 4-Week Trend
                    </h4>
                    <TrendLineChart memberId={member.id} />
                  </Card>
                ))}
              </div>
            </motion.div>
          )}
          {activeTab === 'settings' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-6xl mx-auto space-y-8"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Team Settings</h2>
                  <p className="text-sm text-slate-400 font-medium">Manage your team members, workspace capacity and preferences.</p>
                </div>
                <Button onClick={addMember} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-lg font-bold text-sm">
                  <UserPlus size={18} />
                  Add Team Member
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {members.map(member => (
                  <Card key={member.id} className="p-6 flex flex-col md:flex-row items-center gap-10 hover:border-orange-100 transition-colors">
                    <div className="relative group shrink-0">
                      <div 
                        className="w-20 h-20 rounded-3xl flex items-center justify-center text-white font-black text-xl shadow-xl overflow-hidden"
                        style={{ backgroundColor: !member.avatar_url ? member.avatar_color : undefined }}
                      >
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          member.name.substring(0, 2).toUpperCase()
                        )}
                      </div>
                      <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl cursor-pointer">
                        <PlusCircle className="text-white" size={20} />
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                updateMember(member.id, { avatar_url: reader.result as string });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>

                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                        <input 
                          type="text" 
                          defaultValue={member.name}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-[#FF4208] transition-all"
                          onBlur={(e) => updateMember(member.id, { name: e.target.value })}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Role / Designation</label>
                        <input 
                          type="text" 
                          defaultValue={member.role}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-[#FF4208] transition-all"
                          onBlur={(e) => updateMember(member.id, { role: e.target.value })}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weekly Capacity (Hours)</label>
                        <div className="flex items-center gap-3">
                          <input 
                            type="number" 
                            defaultValue={member.weekly_hours}
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-700 outline-none focus:border-[#FF4208] transition-all"
                            onBlur={(e) => updateMember(member.id, { weekly_hours: parseFloat(e.target.value) })}
                          />
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => deleteMember(member.id)}
                      className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all shrink-0"
                    >
                      <Trash2 size={18} />
                    </button>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Exporting Overlay */}
        {exporting && (
          <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[200] flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-orange-100 border-t-[#FF4208] rounded-full animate-spin mb-4" />
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Generating PDF...</h2>
            <p className="text-sm font-medium text-slate-500 mt-2">Capturing dashboard visuals</p>
          </div>
        )}

        {/* Floating Tooltip/Status */}
        {loading && (
          <div className="fixed bottom-8 right-8 bg-black text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
            <div className="w-2 h-2 bg-[#FF4208] rounded-full animate-ping" />
            <span className="text-xs font-black uppercase tracking-widest">Syncing with DB...</span>
          </div>
        )}
      </div>
    </Layout>
  );
}

function CheckCircle2({ size = 24 }: { size?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/>
    </svg>
  );
}

