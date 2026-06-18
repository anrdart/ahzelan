"use client";
import { Icon } from "@/components/ui/icon";

export default function StatCard({ icon, label, value, delta }: { icon: string; label: string; value: string | number; delta?: string }) {
  return (
    <div className="bg-white border border-border rounded-2xl p-5">
      <div className="w-10.5 h-10.5 rounded-xl bg-royal-50 text-royal-700 flex items-center justify-center" style={{ width: 42, height: 42 }}>
        <Icon name={icon} size={22} />
      </div>
      <div className="text-[32px] font-extrabold font-display mt-4 tracking-tight">{value}</div>
      <div className="flex justify-between items-center mt-0.5">
        <span className="text-sm text-muted-foreground font-semibold">{label}</span>
        {delta && <span className="text-xs text-primary font-semibold">{delta}</span>}
      </div>
    </div>
  );
}
