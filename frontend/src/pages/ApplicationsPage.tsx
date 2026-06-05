import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApplications, approveApplication, rejectApplication, getApplicationStats } from '../services/api';
import { Application } from '../types';
import toast from 'react-hot-toast';
import { Check, X } from 'lucide-react';

export default function ApplicationsPage() {
  const [filter, setFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['applications', page, filter],
    queryFn: async () => (await getApplications(page, filter || undefined)).data.data,
  });

  const { data: stats } = useQuery({
    queryKey: ['app-stats'],
    queryFn: async () => (await getApplicationStats()).data.data,
  });

  const approveMut = useMutation({
    mutationFn: approveApplication,
    onSuccess: () => { toast.success('Application approved!'); queryClient.invalidateQueries({ queryKey: ['applications'] }); },
  });

  const rejectMut = useMutation({
    mutationFn: rejectApplication,
    onSuccess: () => { toast.success('Application rejected'); queryClient.invalidateQueries({ queryKey: ['applications'] }); },
  });

  const statusColors: Record<string, string> = {
    queued: 'bg-gray-100 text-gray-700',
    ready: 'bg-blue-100 text-blue-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    interview: 'bg-purple-100 text-purple-700',
    offer: 'bg-amber-100 text-amber-700',
  };

  const filters = ['', 'queued', 'ready', 'approved', 'interview', 'offer'];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Applications</h2>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(stats).filter(([k]) => k !== 'total').map(([key, val]) => (
            <div key={key} className="card text-center py-3">
              <p className="text-xl font-bold">{val as number}</p>
              <p className="text-xs text-gray-500 capitalize">{key}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
          <button key={f || 'all'} onClick={() => { setFilter(f); setPage(1); }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}>
            {f || 'All'}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="animate-pulse space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="card h-20 bg-gray-100" />)}</div>
      ) : (
        <div className="space-y-3">
          {data?.applications?.map((app: Application) => (
            <div key={app._id} className="card">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[app.status] || ''}`}>
                      {app.status}
                    </span>
                    <span className="text-sm text-gray-500">Score: {app.matchScore}%</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {app.answers?.length || 0} pre-filled answers • Created {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {app.status === 'ready' && (
                    <>
                      <button onClick={() => approveMut.mutate(app._id)} className="p-2 text-green-600 hover:bg-green-50 rounded">
                        <Check className="w-5 h-5" />
                      </button>
                      <button onClick={() => rejectMut.mutate(app._id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                        <X className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
          {data?.applications?.length === 0 && (
            <div className="card text-center text-gray-500 py-12">No applications yet. Match jobs to create application packages.</div>
          )}
        </div>
      )}
    </div>
  );
}
