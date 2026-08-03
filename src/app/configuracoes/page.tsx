'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from '@/components/Sidebar/Sidebar';
import Header from '@/components/Header/Header';
import '../dashboard.css';
import '../upload/upload.css';

export default function ConfiguracoesPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [isPageMounted, setIsPageMounted] = useState(false);

  useEffect(() => {
    setIsPageMounted(true);
  }, []);

  useEffect(() => {
    if (!authLoading && isPageMounted) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user?.role !== 'admin') {
        router.push('/');
      }
    }
  }, [authLoading, isAuthenticated, user, router, isPageMounted]);

  if (authLoading || !isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Header />
        <div className="page-content" style={{ padding: '2rem' }}>
          <h1 style={{ color: 'white', marginBottom: '0.5rem' }}>Configurações de Bases</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Faça o upload das planilhas de apoio para o cálculo das metas e categorias.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            
            <BaseUploadCard 
              title="CLC Categorias (Produtos)" 
              desc="Planilha com a relação de produtos e suas respectivas categorias CLC." 
              type="produtos" 
            />

            <BaseUploadCard 
              title="CLC Categorias (Metas)" 
              desc="Planilha com a Meta de Clientes Positivados por Categoria e Vendedor." 
              type="metas_clc" 
            />

            <BaseUploadCard 
              title="Metas (Pasta)" 
              desc="Planilha com ID do Vendedor, Fornecedor e Metas (Financeira e Positivação)." 
              type="metas_gerais" 
            />

            <BaseUploadCard 
              title="Vendedores e Gestão" 
              desc="Base hierárquica oficial com ID do Vendedor, Nome e Supervisor." 
              type="vendedores" 
            />

            <BaseUploadCard 
              title="Carteira Ativa" 
              desc="Planilha com o ID do Vendedor e o Total de Clientes na carteira." 
              type="carteira" 
            />

            <BaseUploadCard 
              title="MSL (Clientes)" 
              desc="Planilha com ID Cliente, Nome, Segmento (TRAD, INDEP, Super P/G, CASH) e ID Vendedor." 
              type="msl_clientes" 
            />

            <BaseUploadCard 
              title="MSL (Produtos)" 
              desc="Planilha com ID Produto, Nome, Segmento e Tipo MSL (Reckitt Core ou Vestacy)." 
              type="msl_produtos" 
            />

            <BaseUploadCard 
              title="PDV Premiado (Clientes e Metas)" 
              desc="Planilha com ID do Cliente, Meta Financeira, Mês, Rede, Quarter e Categoria (Diamond/Gold)." 
              type="pdv_premiado" 
            />

          </div>
        </div>
      </main>
    </div>
  );
}

function BaseUploadCard({ title, type, desc }: { title: string, type: string, desc: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setErrorMsg('');
      setSuccessMsg('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('baseType', type);

    try {
      const res = await fetch('/api/bases', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Falha ao processar.');

      setSuccessMsg(data.message || 'Atualizado com sucesso!');
      setFile(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '1.5rem' }}>
      <h3 style={{ color: 'white', marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '1rem' }}>{desc}</p>
      
      <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileChange} style={{ marginBottom: '1rem', width: '100%', color: 'white' }} />
      
      {errorMsg && <div style={{ color: 'var(--danger)', fontSize: '14px', marginBottom: '1rem' }}>{errorMsg}</div>}
      {successMsg && <div style={{ color: 'var(--success)', fontSize: '14px', marginBottom: '1rem' }}>{successMsg}</div>}

      <button 
        className="btn-upload gradient-primary"
        onClick={handleUpload}
        disabled={!file || isLoading}
        style={{ width: '100%', padding: '10px', borderRadius: '8px', fontWeight: 'bold' }}
      >
        {isLoading ? 'Processando...' : 'Salvar Base'}
      </button>
    </div>
  );
}
