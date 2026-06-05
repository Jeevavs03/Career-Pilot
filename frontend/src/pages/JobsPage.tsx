import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getJobs, addJobFromUrl, bulkScrape, deleteJob, runAutoPilot } from '../services/api';
import { Job } from '../types';
import toast from 'react-hot-toast';
import { Plus, Search, Trash2, ExternalLink, Star, Rocket } from 'lucide-react';

export default function JobsPage() {
  const [page, setPage] = useState(1);
  const [url, setUrl] = useState('');
  const [bulkUrls, setBulkUrls] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', page],
    queryFn: async () => (await getJobs(page)).data.data,
  });

  const scrapeMutation = useMutation({
    mutationFn: (jobUrl: string) => addJobFromUrl(jobUrl),
    onSuccess: () => { toast.success('Job scraped!'); queryClient.invalidateQueries({ queryKey: ['jobs'] }); setUrl(''); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Scrape failed'),
  });

  const bulkMutation = useMutation({
    mutationFn: (urls: string[]) => bulkScrape(urls),
    onSuccess: () => { toast.success('Bulk scrape queued!'); setBulkUrls(''); setShowAdd(false); },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteJob,
    onSuccess: () => { toast.success('Job removed'); queryClient.invalidateQueries({ queryKey: ['jobs'] }); },
  });

  const autoPilotMutation = useMutation({
    mutationFn: () => runAutoPilot(),
    onSuccess: (res) => {
      toast.success(`Found ${res.data.data.searched} jobs, applied to ${res.data.data.applied}!`);
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Auto-pilot failed'),
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-amber-600 bg-amber-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Jobs</h2>
        <div className="flex gap-2">
          <button onClick={() => autoPilotMutation.mutate()} disabled={autoPilotMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            <Rocket className="w-4 h-4" /> {autoPilotMutation.isPending ? 'Searching...' : 'Auto-Find Jobs'}
          </button>
          <button onClick={() => setShowAdd(!showAdd)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Manually
          </button>
        </div>
      </div>

      {/* Add Job Panel */}
      {showAdd && (
        <div className="card space-y-4">
          <div className="flex gap-2">
            <input type="url" placeholder="Paste LinkedIn/Naukri job URL..." value={url}
              onChange={e => setUrl(e.target.value)} className="input flex-1" />
            <button onClick={() => scrapeMutation.mutate(url)} disabled={!url || scrapeMutation.isPending}
              className="btn-primary whitespace-nowrap">
              {scrapeMutation.isPending ? 'Scraping...' : 'Scrape'}
            </button>
          </div>
          <textarea placeholder="Paste multiple URLs (one per line) for bulk scraping..." value={bulkUrls}
            onChange={e => setBulkUrls(e.target.value)} className="input h-24 resize-none" />
          {bulkUrls && (
            <button onClick={() => bulkMutation.mutate(bulkUrls.split('\n').filter(u => u.trim()))}
              className="btn-secondary">Bulk Scrape ({bulkUrls.split('\n').filter(u => u.trim()).length} URLs)</button>
          )}
        </div>
      )}

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Search jobs..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)} className="input pl-9" />
        </div>
      </div>

      {/* Jobs List */}
      {isLoading ? (
        <div className="animate-pulse space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="card h-24 bg-gray-100" />)}</div>
      ) : (
        <div className="space-y-3">
          {data?.jobs?.map((job: Job) => (
            <div key={job._id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{job.title}</h3>
                    {job.matchScore > 0 && (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getScoreColor(job.matchScore)}`}>
                        <Star className="w-3 h-3 inline mr-1" />{job.matchScore}%
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600">{job.company} • {job.location}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {job.skills?.slice(0, 6).map(s => (
                      <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">{s}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    {job.salary && <span>💰 {job.salary}</span>}
                    {job.experience && <span>📅 {job.experience}</span>}
                    <span className="capitalize">📍 {job.source}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a href={job.url} target="_blank" rel="noopener noreferrer" className="p-2 text-gray-400 hover:text-blue-600">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button onClick={() => deleteMutation.mutate(job._id)} className="p-2 text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {data?.jobs?.length === 0 && (
            <div className="card text-center py-12">
              <Rocket className="w-12 h-12 mx-auto text-blue-400 mb-3" />
              <p className="text-gray-600 font-medium">No jobs yet</p>
              <p className="text-gray-400 text-sm mt-1">Click "Auto-Find Jobs" to search LinkedIn & Naukri based on your profile</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {data?.pages > 1 && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary">Previous</button>
          <span className="px-4 py-2 text-sm">Page {page} of {data.pages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= data.pages} className="btn-secondary">Next</button>
        </div>
      )}
    </div>
  );
}
