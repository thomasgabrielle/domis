import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Beneficiary } from '@/lib/mockData';

interface AllocationChartProps {
  data: Beneficiary[];
}

export function AllocationChart({ data }: AllocationChartProps) {
  // Add "Unallocated" slice if total < 100
  const totalAllocated = data.reduce((sum, item) => sum + item.allocation, 0);
  const chartData = [
    ...data.map(b => ({ name: `${b.firstName} ${b.lastName}`, value: b.allocation })),
  ];

  if (totalAllocated < 100) {
    chartData.push({ name: 'Unallocated', value: 100 - totalAllocated });
  }

  const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
    'hsl(var(--muted))', // For unallocated
  ];

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--popover))', 
              borderColor: 'hsl(var(--border))',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-md)',
              fontFamily: 'var(--font-sans)'
            }}
            itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
            formatter={(value) => <span className="text-sm font-medium text-muted-foreground ml-1">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
