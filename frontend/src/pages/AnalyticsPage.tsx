import { useQuery, useMutation } from '@tanstack/react-query';
import { getSalaryTrends, getTechDemand, generateReport } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { FileBarChart } from 'lucide-react';

export default function AnalyticsPage() {
  const { data: salary } = useQuery({
    queryKey: ['salary-trends'],
    queryFn: async () => (await getSalaryTrends()).data.data,
  });

  const { data: techDemand } = useQuery({
    queryKey: ['tech-demand'],
    queryFn: async () => (await getTechDemand()).data.data,
  });

  const reportMut = useMutation({
    mutationFn: generateReport,
    onSuccess: () => toast.success('Report generated! Check /reports folder.'),
    onError: () => toast.error('Report generation failed'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Analytics</h2>
        <button onClick={() => reportMut.mutate()} disabled={reportMut.isPending}
          className="btn-primary flex items-center gap-2">
          <FileBarChart className="w-4 h-4" /> {reportMut.isPending ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold mb-4">💰 Salary Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salary || []}>
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4">🔧 Technology Demand (Top 10)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={(techDemand || []).slice(0, 10)} layout="vertical">
              <XAxis type="number" />
              <YAxis dataKey="tech" type="category" width={80} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-2">📋 Reports</h3>
        <p className="text-sm text-gray-500">
          Reports are stored locally in the <code className="bg-gray-100 px-1 rounded">/reports</code> directory.
          They include HTML dashboards with job stats, salary trends, and technology demand.
        </p>
      </div>
    </div>
  );
}
