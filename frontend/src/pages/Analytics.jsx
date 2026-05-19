import { memo } from 'react';
import { TrendingUp, TrendingDown, Award, Clock, Target, Zap } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const weeklyData = [
  { id: 'mon', day: 'Mon', hours: 5.2, problems: 8 },
  { id: 'tue', day: 'Tue', hours: 6.1, problems: 12 },
  { id: 'wed', day: 'Wed', hours: 4.8, problems: 6 },
  { id: 'thu', day: 'Thu', hours: 7.3, problems: 15 },
  { id: 'fri', day: 'Fri', hours: 5.9, problems: 10 },
  { id: 'sat', day: 'Sat', hours: 8.2, problems: 18 },
  { id: 'sun', day: 'Sun', hours: 6.5, problems: 14 },
];

const monthlyProgress = [
  { id: 'jan', month: 'Jan', score: 65 },
  { id: 'feb', month: 'Feb', score: 72 },
  { id: 'mar', month: 'Mar', score: 78 },
  { id: 'apr', month: 'Apr', score: 85 },
  { id: 'may', month: 'May', score: 92 },
];

const WeeklyActivityChart = memo(() => (
  <ResponsiveContainer width="100%" height={250}>
    <BarChart
      data={weeklyData}
      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
      id="weekly-activity-bar-chart"
    >
      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
      <XAxis dataKey="day" stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
      <YAxis stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
      <Tooltip
        contentStyle={{
          backgroundColor: 'var(--background-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
        }}
        labelStyle={{ color: 'var(--foreground)' }}
      />
      <Bar dataKey="hours" fill="var(--primary)" radius={[8, 8, 0, 0]} isAnimationActive={false} />
    </BarChart>
  </ResponsiveContainer>
));

const PerformanceTrendChart = memo(() => (
  <ResponsiveContainer width="100%" height={250}>
    <LineChart
      data={monthlyProgress}
      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
      id="monthly-performance-line-chart"
    >
      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
      <XAxis dataKey="month" stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
      <YAxis stroke="var(--muted-foreground)" style={{ fontSize: '12px' }} />
      <Tooltip
        contentStyle={{
          backgroundColor: 'var(--background-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
        }}
        labelStyle={{ color: 'var(--foreground)' }}
      />
      <Line
        type="monotone"
        dataKey="score"
        stroke="var(--secondary)"
        strokeWidth={3}
        dot={{ fill: 'var(--secondary)', r: 6 }}
        isAnimationActive={false}
      />
    </LineChart>
  </ResponsiveContainer>
));

WeeklyActivityChart.displayName = 'WeeklyActivityChart';
PerformanceTrendChart.displayName = 'PerformanceTrendChart';

export function AnalyticsPage() {
  return (
    <div className="max-w-[1600px] mx-auto p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="font-bold text-[var(--foreground)] mb-1">Analytics</h1>
        <p className="text-sm text-[var(--muted-foreground)]">Track your progress and performance metrics</p>
      </div>

      {/* Stats cards... */}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-[var(--background-card)] border border-[var(--border)] rounded-2xl p-6">
          <h3 className="font-semibold text-[var(--foreground)] mb-4">Weekly Activity</h3>
          <WeeklyActivityChart />
        </div>

        <div className="bg-[var(--background-card)] border border-[var(--border)] rounded-2xl p-6">
          <h3 className="font-semibold text-[var(--foreground)] mb-4">Performance Trend</h3>
          <PerformanceTrendChart />
        </div>
      </div>
    </div>
  );
}