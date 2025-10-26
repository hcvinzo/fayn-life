import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
}

export const StatsCard = ({ title, value, icon: Icon, trend }: StatsCardProps) => {
  return (
    <div className="p-6 rounded-lg border bg-card shadow-soft">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold">{value}</span>
        {trend && (
          <span className="text-sm font-medium text-green-600">
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};
