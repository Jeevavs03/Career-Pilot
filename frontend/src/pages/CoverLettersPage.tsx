import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCoverLetters, exportCoverLetterPDF, deleteCoverLetter } from '../services/api';
import { CoverLetter } from '../types';
import toast from 'react-hot-toast';
import { Download, Trash2, PenTool } from 'lucide-react';

export default function CoverLettersPage() {
  const queryClient = useQueryClient();

  const { data: coverLetters, isLoading } = useQuery({
    queryKey: ['cover-letters'],
    queryFn: async () => (await getCoverLetters()).data.data,
  });

  const deleteMut = useMutation({
    mutationFn: deleteCoverLetter,
    onSuccess: () => { toast.success('Deleted'); queryClient.invalidateQueries({ queryKey: ['cover-letters'] }); },
  });

  const handleExport = async (id: string) => {
    try {
      const res = await exportCoverLetterPDF(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'cover-letter.pdf'; a.click();
    } catch { toast.error('Export failed'); }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Cover Letters</h2>
      <p className="text-gray-500">Cover letters are auto-generated when application packages are created.</p>

      {isLoading ? (
        <div className="animate-pulse space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="card h-32 bg-gray-100" />)}</div>
      ) : (
        <div className="space-y-4">
          {coverLetters?.map((cl: CoverLetter) => (
            <div key={cl._id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-purple-500" />
                  <div>
                    <h3 className="font-semibold">{cl.role}</h3>
                    <p className="text-sm text-gray-500">{cl.company} • {new Date(cl.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleExport(cl._id)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                    <Download className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteMut.mutate(cl._id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-line line-clamp-4">{cl.content}</p>
            </div>
          ))}
          {coverLetters?.length === 0 && (
            <div className="card text-center text-gray-500 py-12">No cover letters yet. They are generated with application packages.</div>
          )}
        </div>
      )}
    </div>
  );
}
