import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getResumes, uploadResume, generateVariants, exportResumePDF, deleteResume } from '../services/api';
import { Resume } from '../types';
import toast from 'react-hot-toast';
import { Upload, Wand2, Download, Trash2, FileText } from 'lucide-react';

export default function ResumesPage() {
  const [content, setContent] = useState('');
  const [name, setName] = useState('Master Resume');
  const [showUpload, setShowUpload] = useState(false);
  const queryClient = useQueryClient();

  const { data: resumes, isLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: async () => (await getResumes()).data.data,
  });

  const uploadMut = useMutation({
    mutationFn: () => uploadResume(content, name),
    onSuccess: () => { toast.success('Resume uploaded!'); queryClient.invalidateQueries({ queryKey: ['resumes'] }); setShowUpload(false); setContent(''); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Upload failed'),
  });

  const variantsMut = useMutation({
    mutationFn: generateVariants,
    onSuccess: () => { toast.success('Variants generated! (AI processing)'); queryClient.invalidateQueries({ queryKey: ['resumes'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Generation failed - ensure Ollama is running'),
  });

  const deleteMut = useMutation({
    mutationFn: deleteResume,
    onSuccess: () => { toast.success('Deleted'); queryClient.invalidateQueries({ queryKey: ['resumes'] }); },
  });

  const handleExportPDF = async (id: string) => {
    try {
      const res = await exportResumePDF(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'resume.pdf'; a.click();
      toast.success('PDF downloaded');
    } catch { toast.error('Export failed'); }
  };

  const typeColors: Record<string, string> = {
    master: 'bg-gray-100 text-gray-800',
    angular: 'bg-red-100 text-red-700',
    react: 'bg-blue-100 text-blue-700',
    mern: 'bg-green-100 text-green-700',
    fullstack: 'bg-purple-100 text-purple-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Resume Manager</h2>
        <div className="flex gap-2">
          <button onClick={() => variantsMut.mutate()} disabled={variantsMut.isPending}
            className="btn-secondary flex items-center gap-2">
            <Wand2 className="w-4 h-4" /> {variantsMut.isPending ? 'Generating...' : 'Generate Variants'}
          </button>
          <button onClick={() => setShowUpload(!showUpload)} className="btn-primary flex items-center gap-2">
            <Upload className="w-4 h-4" /> Upload Master
          </button>
        </div>
      </div>

      {showUpload && (
        <div className="card space-y-4">
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Resume name" className="input" />
          <textarea value={content} onChange={e => setContent(e.target.value)}
            placeholder="Paste your master resume content here..." className="input h-64 resize-none font-mono text-sm" />
          <button onClick={() => uploadMut.mutate()} disabled={!content || uploadMut.isPending} className="btn-primary">
            {uploadMut.isPending ? 'Uploading...' : 'Upload Resume'}
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="animate-pulse space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="card h-24 bg-gray-100" />)}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resumes?.map((resume: Resume) => (
            <div key={resume._id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <h3 className="font-semibold">{resume.name}</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[resume.type] || 'bg-gray-100'}`}>
                    {resume.type}
                  </span>
                  {resume.atsScore > 0 && <span className="ml-2 text-sm text-green-600">ATS: {resume.atsScore}%</span>}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {resume.keywords?.slice(0, 5).map(k => (
                      <span key={k} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{k}</span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleExportPDF(resume._id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                    <Download className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteMut.mutate(resume._id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {resumes?.length === 0 && (
            <div className="col-span-2 card text-center text-gray-500 py-12">Upload your master resume to get started.</div>
          )}
        </div>
      )}
    </div>
  );
}
