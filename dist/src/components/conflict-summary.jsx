"use client";
import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
export default function ConflictSummary({ analysis, isAnalyzing }) {
    if (isAnalyzing) {
        return (<div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 animate-pulse flex flex-col items-center justify-center gap-4">
        <Sparkles className="w-8 h-8 text-primary animate-spin"/>
        <p className="text-sm font-bold text-muted-foreground">AI is scanning schedules...</p>
      </div>);
    }
    if (!analysis) {
        return (<div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col items-center justify-center text-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-500/30 mb-3"/>
        <p className="text-sm font-bold text-muted-foreground">Ready to analyze</p>
        <p className="text-xs text-muted-foreground/50">Add at least 2 contests</p>
      </div>);
    }
    if (!analysis.hasConflicts) {
        return (<div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex gap-4 items-start">
        <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5"/>
        <div>
          <p className="text-sm font-bold text-emerald-500">Perfectly Scheduled</p>
          <p className="text-xs text-emerald-500/70 mt-1">{analysis.summary}</p>
        </div>
      </div>);
    }
    return (<div className="space-y-4">
      <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex gap-4 items-start">
        <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5"/>
        <div>
          <p className="text-sm font-bold text-amber-500">Schedule Alert</p>
          <p className="text-xs text-amber-500/80 mt-1 line-clamp-3">{analysis.summary}</p>
        </div>
      </div>

      <div className="space-y-2">
        {analysis.conflicts.map((conflict, idx) => (<div key={idx} className={cn("p-4 rounded-xl text-xs", conflict.type === 'overlap' ? "bg-red-500/10 border border-red-500/20" : "bg-primary/10 border border-primary/20")}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold uppercase tracking-widest opacity-70">
                {conflict.type.replace('_', ' ')}
              </span>
              <AlertCircle className={cn("w-3 h-3", conflict.type === 'overlap' ? "text-red-500" : "text-primary")}/>
            </div>
            <p className="opacity-80 leading-relaxed">{conflict.description}</p>
          </div>))}
      </div>
    </div>);
}
