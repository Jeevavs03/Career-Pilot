import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDashboardStats, getAIStatus, runAutoPilot } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Briefcase, Target, MessageSquare, Trophy, Cpu, Rocket } from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

export default function DashboardPage() {
  const queryClient = useQueryClient();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => (await getDashboardStats()).data.data,
  });

  const { data: aiStatus } = useQuery({
    queryKey: ['ai-status'],
    queryFn: async () => (await getAIStatus()).data.data,
  });

  const autoPilotMutation = useMutation({
    mutationFn: () => runAutoPilot(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      const { searched, matched, applied, warnings, skippedSteps } = res.data.data;
      let msg = `✅ Auto-Pilot Complete!\n\nJobs Found: ${searched}\nMatched: ${matched}\nApplied: ${applied}`;
      if (warnings?.length) msg += `\n\n⚠️ Warnings:\n${warnings.join('\n')}`;
      if (skippedSteps?.length) msg += `\n\nSkipped: ${skippedSteps.join(', ')}`;
      alert(msg);
    },
    onError: (err: any) => alert(`❌ Auto-Pilot Failed: ${err.response?.data?.message || err.message}`),
  });

  if (isLoading) return <div className="animate-pulse">Loading dashboard...</div>;

  const techData = [
    { name: 'Angular', value: stats?.angularJobs || 0 },
    { name: 'React', value: stats?.reactJobs || 0 },
    { name: 'MERN', value: stats?.mernJobs || 0 },
    { name: 'Node.js', value: stats?.nodeJobs || 0 },
    { name: 'Full Stack', value: stats?.fullstackJobs || 0 },
  ];

  const statCards = [
    { icon: Briefcase, label: 'Jobs Found', value: stats?.totalJobs || 0, color: 'text-blue-600' },
    { icon: Target, label: 'Applications', value: stats?.totalApplications || 0, color: 'text-purple-600' },
    { icon: MessageSquare, label: 'Interviews', value: stats?.interviews || 0, color: 'text-green-600' },
    { icon: Trophy, label: 'Offers', value: stats?.offers || 0, color: 'text-amber-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Auto-Pilot Button */}
      <div className="card border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg text-blue-800">🚀 Auto-Pilot Mode</h3>
            <p className="text-sm text-gray-600 mt-1">Search LinkedIn + Naukri → Match with your profile → Auto-apply → Email report</p>
            <p className="text-xs text-gray-400 mt-1">Runs automatically at 08:00 & 20:00 IST, or trigger manually below</p>
          </div>
          <button
            onClick={() => autoPilotMutation.mutate()}
            disabled={autoPilotMutation.isPending}
            className="btn-primary flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Rocket className="w-5 h-5" />
            {autoPilotMutation.isPending ? 'Running...' : 'Run Now'}
          </button>
        </div>
      </div>

      {/* AI Status */}
      <div className={`card flex items-center gap-3 ${aiStatus?.available ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <Cpu className={`w-5 h-5 ${aiStatus?.available ? 'text-green-600' : 'text-red-600'}`} />
        <span className="text-sm">
          {aiStatus?.available
            ? `AI Engine Online • Models: ${aiStatus.models?.slice(0, 3).join(', ')}`
            : 'AI Engine Offline - Start Ollama to enable AI features'}
        </span>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`p-3 rounded-lg bg-gray-50 ${color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold mb-4">Technology Demand</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={techData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="font-semibold mb-4">Job Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={techData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {techData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Offer Rate */}
      <div className="card">
        <h3 className="font-semibold mb-2">Performance</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-gray-200 rounded-full h-3">
            <div className="bg-green-500 h-3 rounded-full transition-all" style={{ width: `${stats?.offerRate || 0}%` }} />
          </div>
          <span className="text-sm font-medium">{stats?.offerRate || 0}% Offer Rate</span>
        </div>
      </div>
    </div>
  );
}
