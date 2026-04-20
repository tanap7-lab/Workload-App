import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, FileSpreadsheet, X } from 'lucide-react';
import { Button } from './ui/Button';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportVisual: () => void;
  onExportData: () => void;
}

export const ExportModal = ({ isOpen, onClose, onExportVisual, onExportData }: ExportModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-[101] overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Export Report</h3>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-50 text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-8 space-y-4">
              <button
                onClick={() => {
                  onExportVisual();
                  onClose();
                }}
                className="w-full flex items-center gap-6 p-6 rounded-2xl border-2 border-slate-50 hover:border-orange-100 hover:bg-orange-50/30 transition-all text-left group"
              >
                <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                  <FileText size={28} />
                </div>
                <div>
                  <div className="font-black text-slate-800">Export Visual</div>
                  <div className="text-sm font-medium text-slate-400">Download PDF with full-color visualizations</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onExportData();
                  onClose();
                }}
                className="w-full flex items-center gap-6 p-6 rounded-2xl border-2 border-slate-50 hover:border-emerald-100 hover:bg-emerald-50/30 transition-all text-left group"
              >
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                  <FileSpreadsheet size={28} />
                </div>
                <div>
                  <div className="font-black text-slate-800">Export Data</div>
                  <div className="text-sm font-medium text-slate-400">Download Excel with raw task details</div>
                </div>
              </button>
            </div>

            <div className="p-6 bg-slate-50 flex justify-end">
              <Button onClick={onClose} variant="ghost" className="font-bold">Cancel</Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
