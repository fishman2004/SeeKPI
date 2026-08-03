'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar/Sidebar';
import Header from '@/components/Header/Header';
import '../dashboard.css';
import './upload.css';

export default function UploadPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPageMounted, setIsPageMounted] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    setIsPageMounted(true);
  }, []);

  // Protect route
  useEffect(() => {
    if (!authLoading && isPageMounted) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user?.role !== 'admin') {
        router.push('/'); // Redirect non-admins to dashboard
      }
    }
  }, [authLoading, isAuthenticated, user, router, isPageMounted]);

  if (authLoading || !isAuthenticated || user?.role !== 'admin') {
    return null; // Return null while checking auth to prevent flash of content
  }

  const handleClearDB = async () => {
    if (!confirm('Tem certeza que deseja apagar todos os dados do banco?')) return;
    
    setIsClearing(true);
    setSuccessMsg('');
    setErrorMsg('');
    
    try {
      const response = await fetch('/api/upload/clear', { method: 'DELETE' });
      const data = await response.json();
      
      if (response.ok) {
        setSuccessMsg(data.message);
      } else {
        setErrorMsg(data.error || 'Erro ao limpar banco');
      }
    } catch (err) {
      setErrorMsg('Erro de conexão ao limpar banco');
    } finally {
      setIsClearing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setErrorMsg('');
    setSuccessMsg('');
    
    // Check extension
    if (!selectedFile.name.toLowerCase().endsWith('.xlsx') && 
        !selectedFile.name.toLowerCase().endsWith('.xls') && 
        !selectedFile.name.toLowerCase().endsWith('.csv')) {
      setErrorMsg('Por favor, selecione um arquivo Excel (.xlsx) ou CSV (.csv) válido.');
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Falha ao processar a planilha. Tente novamente.');
      }

      setSuccessMsg(data.message || `Planilha "${file.name}" importada com sucesso! ${data.rowsImported || 0} linhas atualizadas.`);
      setFile(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocorreu um erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Header />
        <div className="page-content">
          <div className="upload-wrapper">
            <div className="glass-card upload-card fade-in">
              <h1>Importar Vendas (8081 - Vendas)</h1>
              <p>Arraste e solte a planilha <strong>8081 - Vendas</strong> em formato .csv ou .xlsx para atualizar todo o sistema.</p>

              <div
                className={`dropzone ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input 
                  key={file ? file.name : 'empty'}
                  type="file" 
                  className="file-input" 
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                />
                <svg 
                  className="dropzone-icon" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div>
                  <span className="font-semibold text-white">Clique para selecionar</span> ou arraste o arquivo .xlsx ou .csv
                </div>
              </div>

              {file && (
                <div className="file-info slide-up">
                  <svg className="file-info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  <span className="file-name truncate">{file.name}</span>
                  <button 
                    onClick={() => setFile(null)}
                    className="text-gray-400 hover:text-white transition-colors"
                    title="Remover arquivo"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              )}

              {errorMsg && (
                <div className="upload-alert upload-alert-error slide-up">
                  <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="upload-alert upload-alert-success slide-up glass-card">
                  <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <span>{successMsg}</span>
                </div>
              )}

              <button 
                className="btn-upload gradient-primary"
                onClick={handleUpload}
                disabled={!file || isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="loader-icon spin"></div>
                    Processando...
                  </>
                ) : (
                  'Processar Planilha'
                )}
              </button>

              <button 
                className="clear-button"
                style={{ marginTop: '16px', background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '12px 24px', borderRadius: 'var(--radius-md)', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}
                onClick={handleClearDB}
                disabled={isClearing}
              >
                {isClearing ? 'Limpando...' : 'Limpar Banco de Dados'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
