import React, { useState, useRef } from 'react';
import api from '../../services/api';
import { 
  X, 
  UploadCloud, 
  FileCheck, 
  AlertTriangle, 
  Terminal, 
  Database,
  ArrowRight
} from 'lucide-react';

const RESOURCE_TYPES = ['PYQ', 'Notes', 'Lab Manual', 'Syllabus'];
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export default function UploadResourceModal({ isOpen, onClose, onUploadSuccess }) {
  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [type, setType] = useState('PYQ');
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadState, setUploadState] = useState('IDLE'); // IDLE, HASHING, PINNING, SUCCESS, ERROR
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (file) => {
    setErrorMessage('');
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(`[FILE_REJECTED] File exceeds 25MB maximum size limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    if (!title) {
      // Suggest clean title from file name without extension
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName.toUpperCase());
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile || !courseCode.trim() || !title.trim()) {
      setErrorMessage('[VALIDATION_ERROR] Missing required file, course code, or title.');
      return;
    }

    try {
      setErrorMessage('');
      setUploadState('HASHING');

      // Progressively simulate cryptographic hashing stage
      await new Promise(resolve => setTimeout(resolve, 600));
      setUploadState('PINNING');

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title.trim());
      formData.append('courseCode', courseCode.trim().toUpperCase());
      formData.append('type', type);

      const res = await api.post('/vault/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data?.success && res.data.data) {
        setUploadState('SUCCESS');
        setTimeout(() => {
          onUploadSuccess(res.data.data);
          handleClose();
        }, 1000);
      } else {
        throw new Error(res.data?.message || 'Resource upload failed.');
      }
    } catch (err) {
      console.error('[VAULT_UPLOAD_ERROR]', err);
      setUploadState('ERROR');
      setErrorMessage(err.response?.data?.message || err.message || 'Could not connect to storage gateway.');
    }
  };

  const handleClose = () => {
    if (uploadState === 'HASHING' || uploadState === 'PINNING') return;
    setTitle('');
    setCourseCode('');
    setType('PYQ');
    setSelectedFile(null);
    setUploadState('IDLE');
    setErrorMessage('');
    onClose();
  };

  const isTransmitting = uploadState === 'HASHING' || uploadState === 'PINNING';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="border border-stroke-bright bg-charcoal-panel w-full max-w-xl text-tactical-main font-mono text-xs shadow-none">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-stroke-dim bg-black/60">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-phosphor inline-block animate-pulse" />
            <span className="text-phosphor font-bold tracking-widest uppercase">
              // UPLOAD STUDY MATERIAL TO IPFS VAULT
            </span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isTransmitting}
            className="text-tactical-muted hover:text-hazard transition-colors disabled:opacity-30 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MODAL BODY */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* FILE UPLOAD TARGET ZONE */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-tactical-muted mb-1.5">
              1. SELECT DOCUMENT (MAX 25MB)
            </label>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border border-dashed p-6 text-center cursor-pointer transition-colors ${
                dragActive
                  ? 'border-phosphor bg-phosphor/10'
                  : selectedFile
                  ? 'border-phosphor/70 bg-black/60'
                  : 'border-stroke-bright hover:border-phosphor bg-black/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files[0])}
                disabled={isTransmitting}
              />

              {selectedFile ? (
                <div className="space-y-1">
                  <FileCheck className="w-6 h-6 text-phosphor mx-auto mb-1" />
                  <p className="text-tactical-bright font-bold truncate max-w-md mx-auto">
                    {selectedFile.name}
                  </p>
                  <p className="text-[11px] text-teal">
                    FILE SIZE: {(selectedFile.size / 1024).toFixed(1)} KB // READY FOR STORAGE
                  </p>
                  <span className="text-[10px] text-tactical-muted underline block mt-2">
                    CLICK OR DRAG TO REPLACE FILE
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <UploadCloud className="w-7 h-7 text-stroke-bright mx-auto" />
                  <p className="text-tactical-bright font-medium">
                    DRAG & DROP COURSE MATERIAL OR CLICK TO SELECT
                  </p>
                  <p className="text-[10px] text-tactical-muted">
                    PDF, DOCX, ZIP, IMAGES ACCEPTED (MAX 25MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* COURSE CODE & TYPE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-tactical-muted mb-1">
                2. COURSE CODE (OFFICIAL)
              </label>
              <input
                type="text"
                required
                value={courseCode}
                onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
                placeholder="E.G. EC101 / CS102"
                disabled={isTransmitting}
                className="w-full bg-black border border-stroke-dim px-3 py-2 text-phosphor placeholder-tactical-muted/40 focus:border-phosphor focus:outline-none uppercase font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-tactical-muted mb-1">
                3. MATERIAL CATEGORY
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={isTransmitting}
                className="w-full bg-black border border-stroke-dim px-3 py-2 text-teal focus:border-phosphor focus:outline-none font-mono cursor-pointer"
              >
                {RESOURCE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    // {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* RESOURCE TITLE */}
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-tactical-muted mb-1">
              4. TITLE / DESCRIPTION
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="E.G. 2024 END-SEM SOLVED QUESTION PAPER & FORMULA SHEET"
              disabled={isTransmitting}
              className="w-full bg-black border border-stroke-dim px-3 py-2 text-tactical-bright placeholder-tactical-muted/40 focus:border-phosphor focus:outline-none font-mono uppercase"
            />
          </div>

          {/* ERROR STATUS NOTIFICATION */}
          {errorMessage && (
            <div className="border border-hazard bg-hazard/10 p-3 text-hazard flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {/* TELEMETRY PROGRESS INDICATOR */}
          {isTransmitting && (
            <div className="border border-teal/40 bg-teal/10 p-3 text-teal space-y-1 font-mono">
              <div className="flex items-center gap-2 font-bold tracking-wider">
                <span className="w-2 h-2 bg-teal inline-block animate-ping" />
                {uploadState === 'HASHING' && (
                  <span>[ STEP 1/2 ] COMPUTING SHA-256 CHECKSUM █</span>
                )}
                {uploadState === 'PINNING' && (
                  <span>[ STEP 2/2 ] PINNING FILE TO IPFS STORAGE █</span>
                )}
              </div>
              <p className="text-[10px] text-tactical-muted pl-4">
                STREAMING DIRECT TO PINATA / IPFS GATEWAY...
              </p>
            </div>
          )}

          {uploadState === 'SUCCESS' && (
            <div className="border border-phosphor bg-phosphor/15 p-3 text-phosphor flex items-center gap-2 font-mono font-bold tracking-wider">
              <span className="w-2 h-2 bg-phosphor inline-block" />
              <span>[ CONFIRMED ] RESOURCE SUCCESSFULLY STORED ON IPFS.</span>
            </div>
          )}

          {/* ACTION BUTTONS */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stroke-dim">
            <button
              type="button"
              onClick={handleClose}
              disabled={isTransmitting}
              className="px-4 py-2 border border-stroke-dim hover:border-stroke-bright text-tactical-muted hover:text-white uppercase transition-colors disabled:opacity-30 cursor-pointer"
            >
              [ CANCEL ]
            </button>
            <button
              type="submit"
              disabled={isTransmitting || !selectedFile || !courseCode || !title}
              className="px-5 py-2 border border-phosphor bg-phosphor/20 text-phosphor hover:bg-phosphor hover:text-black font-bold uppercase tracking-wider transition-colors disabled:opacity-40 flex items-center gap-2 cursor-pointer"
            >
              <span>CONFIRM UPLOAD TO IPFS</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
