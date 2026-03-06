import React, { useState, useEffect } from 'react';
import { Upload, File, Trash2, Loader2, CheckCircle2, FileText, Database } from 'lucide-react';
import { cn } from '../lib/utils';

export const DocumentManager: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const fetchDocs = async () => {
    const res = await fetch('/api/documents');
    const data = await res.json();
    setDocuments(data);
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await fetch('/api/documents', {
        method: 'POST',
        body: formData
      });
      fetchDocs();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="flex flex-col h-full glass rounded-3xl overflow-hidden">
      <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-brand-secondary/10 text-brand-secondary">
            <Database size={20} />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg">Knowledge Base</h3>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Multimodal Document Index</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
        {/* Upload Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={cn(
            "relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 flex flex-col items-center justify-center gap-4 text-center",
            dragActive ? "border-brand-secondary bg-brand-secondary/5" : "border-white/10 hover:border-white/20 bg-white/5",
            uploading && "opacity-50 pointer-events-none"
          )}
        >
          <input
            type="file"
            className="absolute inset-0 opacity-0 cursor-pointer"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          />
          <div className="p-4 rounded-full bg-brand-secondary/10 text-brand-secondary">
            {uploading ? <Loader2 className="animate-spin" size={32} /> : <Upload size={32} />}
          </div>
          <div>
            <p className="font-medium text-slate-200">
              {uploading ? "Analyzing document..." : "Drop files here or click to upload"}
            </p>
            <p className="text-xs text-slate-500 mt-1">PDF, DOCX, TXT, PNG (Max 10MB)</p>
          </div>
        </div>

        {/* Document List */}
        <div className="space-y-3">
          <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Indexed Documents</h4>
          {documents.length === 0 ? (
            <div className="py-12 text-center text-slate-600 italic text-sm">
              No documents indexed in knowledge base
            </div>
          ) : (
            documents.map((doc) => (
              <div key={doc.id} className="group p-4 glass rounded-xl border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-white/5 text-slate-400">
                    <FileText size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{doc.name}</p>
                    <p className="text-[10px] font-mono text-slate-500">
                      {(doc.size / 1024).toFixed(1)} KB • {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-brand-primary" />
                  <button className="p-2 rounded-lg hover:bg-red-500/10 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
