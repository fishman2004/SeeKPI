'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar/Sidebar';
import Header from '@/components/Header/Header';
import '../dashboard.css';
import '../vendas/vendas.css';

interface SegmentoStats {
  lojas: number;
  poss: number;
  real: number;
  percent: number;
}

interface VendedorMSLItem {
  id: string;
  nome: string;
  segmentos: Record<string, SegmentoStats>;
  total: SegmentoStats;
}

interface SupervisorMSLItem {
  nome: string;
  segmentos: Record<string, SegmentoStats>;
  total: SegmentoStats;
  vendedores: VendedorMSLItem[];
}

interface EvolucaoDiariaSup {
  nome: string;
  dias: Record<string, number>;
}

interface ClienteMSLItem {
  id_cliente: string;
  cliente_nome: string;
  segmento: string;
  vendedor: string;
  supervisor: string;
  possibilidades: number;
  realizados: number;
  percent: number;
  isBatido: boolean;
}

interface MSLData {
  tipo: string;
  segmentos: string[];
  matrizSupervisores: SupervisorMSLItem[];
  evolucaoDiariaSupervisores: EvolucaoDiariaSup[];
  listaClientes: ClienteMSLItem[];
}

export default function MSLPage() {
  const [tipoMsl, setTipoMsl] = useState<'RECKITT CORE' | 'VESTACY'>('RECKITT CORE');
  const [activeTab, setActiveTab] = useState<'matriz' | 'edm' | 'clientes'>('matriz');
  const [data, setData] = useState<MSLData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSups, setExpandedSups] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const loadMSLData = useCallback(() => {
    setLoading(true);
    fetch(`/api/msl?tipo=${encodeURIComponent(tipoMsl)}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success && result.data) {
          setData(result.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tipoMsl]);

  useEffect(() => {
    loadMSLData();
  }, [loadMSLData]);

  const toggleExpandSup = (supName: string) => {
    setExpandedSups(prev => ({ ...prev, [supName]: !prev[supName] }));
  };

  const renderPercentBadge = (percent: number) => {
    const isPositive = percent >= 80;
    return (
      <span className={`percent-badge ${isPositive ? 'percent-badge--success' : 'percent-badge--danger'}`}>
        {percent.toFixed(1)}%
      </span>
    );
  };

  const filteredClientes = data?.listaClientes.filter(c => 
    c.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id_cliente.includes(searchTerm) ||
    c.vendedor.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Header />
        <div className="page-content vendas-page" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Header Title + Toggle Marca */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                🎯 Painel de Acompanhamento MSL
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
                Mix Sortimento de Loja • Segmentos de PDV, Evolução Diária (EDM) e Carteira
              </p>
            </div>

            {/* Alternador de Marca: RECKITT CORE vs VESTACY */}
            <div style={{ display: 'flex', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.1)', padding: '4px', borderRadius: '9999px', gap: '4px' }}>
              <button
                onClick={() => setTipoMsl('RECKITT CORE')}
                style={{
                  padding: '8px 20px',
                  borderRadius: '9999px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  transition: 'all 0.2s ease',
                  background: tipoMsl === 'RECKITT CORE' ? 'linear-gradient(135deg, #e11d48, #be123c)' : 'transparent',
                  color: tipoMsl === 'RECKITT CORE' ? '#ffffff' : '#94a3b8',
                  boxShadow: tipoMsl === 'RECKITT CORE' ? '0 0 15px rgba(225, 29, 72, 0.4)' : 'none'
                }}
              >
                🔴 RECKITT CORE
              </button>
              <button
                onClick={() => setTipoMsl('VESTACY')}
                style={{
                  padding: '8px 20px',
                  borderRadius: '9999px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  transition: 'all 0.2s ease',
                  background: tipoMsl === 'VESTACY' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
                  color: tipoMsl === 'VESTACY' ? '#ffffff' : '#94a3b8',
                  boxShadow: tipoMsl === 'VESTACY' ? '0 0 15px rgba(99, 102, 241, 0.4)' : 'none'
                }}
              >
                🟣 VESTACY
              </button>
            </div>
          </div>

          {/* Abas de Navegação Interna */}
          <div className="tab-bar" style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
            <button
              onClick={() => setActiveTab('matriz')}
              className={`tab-bar__item ${activeTab === 'matriz' ? 'tab-bar__item--active' : ''}`}
              style={{ fontSize: '0.9rem', fontWeight: 700, padding: '10px 20px', borderRadius: '8px' }}
            >
              📊 Matriz por Segmento PDV
            </button>
            <button
              onClick={() => setActiveTab('edm')}
              className={`tab-bar__item ${activeTab === 'edm' ? 'tab-bar__item--active' : ''}`}
              style={{ fontSize: '0.9rem', fontWeight: 700, padding: '10px 20px', borderRadius: '8px' }}
            >
              📅 Evolução Diária MSL (EDM)
            </button>
            <button
              onClick={() => setActiveTab('clientes')}
              className={`tab-bar__item ${activeTab === 'clientes' ? 'tab-bar__item--active' : ''}`}
              style={{ fontSize: '0.9rem', fontWeight: 700, padding: '10px 20px', borderRadius: '8px' }}
            >
              👥 Carteira Detalhada de Clientes
            </button>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <span>Carregando dados da curva {tipoMsl}...</span>
            </div>
          ) : !data ? (
            <div className="empty-state">
              <span className="empty-state__icon">🎯</span>
              <span className="empty-state__text">Nenhum dado de MSL encontrado para {tipoMsl}.</span>
            </div>
          ) : (
            <>
              {/* ── ABA 1: MATRIZ POR SEGMENTOS ────────────────────── */}
              {activeTab === 'matriz' && (
                <div className="vendas-table-card">
                  <div className="vendas-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="vendas-table-title">📊 MATRIZ MSL POR SEGMENTO DE PDV ({tipoMsl})</h3>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>*Clique no Supervisor para ver a equipe de Vendedores</span>
                  </div>

                  <div className="vendas-table-wrapper">
                    <table className="vendas-table">
                      <thead>
                        <tr>
                          <th className="th-left" rowSpan={2} style={{ minWidth: '220px' }}>SUPERVISOR / VENDEDOR</th>
                          {data.segmentos.map(seg => (
                            <th key={seg} colSpan={4} className="td-center" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>{seg}</th>
                          ))}
                          <th colSpan={4} className="td-center" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#f8fafc' }}>TOTAL GERAL</th>
                        </tr>
                        <tr>
                          {data.segmentos.map(seg => (
                            <React.Fragment key={`${seg}-sub`}>
                              <th className="td-num" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>LOJAS</th>
                              <th className="td-num" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>POSS</th>
                              <th className="td-num" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>REAL</th>
                              <th className="td-center" style={{ fontSize: '0.75rem', color: '#94a3b8' }}>%%</th>
                            </React.Fragment>
                          ))}
                          <th className="td-num" style={{ fontSize: '0.75rem', color: '#38bdf8' }}>LOJAS</th>
                          <th className="td-num" style={{ fontSize: '0.75rem', color: '#38bdf8' }}>POSS</th>
                          <th className="td-num" style={{ fontSize: '0.75rem', color: '#38bdf8' }}>REAL</th>
                          <th className="td-center" style={{ fontSize: '0.75rem', color: '#38bdf8' }}>%%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.matrizSupervisores.map((sup) => {
                          const isExpanded = expandedSups[sup.nome];
                          return (
                            <React.Fragment key={sup.nome}>
                              {/* Linha do Supervisor */}
                              <tr 
                                onClick={() => toggleExpandSup(sup.nome)}
                                style={{ background: 'rgba(15, 23, 42, 0.95)', cursor: 'pointer', fontWeight: 800 }}
                              >
                                <td className="td-nome" style={{ color: '#38bdf8' }}>
                                  {isExpanded ? '▼ ' : '▶ '}{sup.nome}
                                </td>
                                {data.segmentos.map(seg => {
                                  const s = sup.segmentos[seg];
                                  return (
                                    <React.Fragment key={seg}>
                                      <td className="td-num">{s.lojas}</td>
                                      <td className="td-num">{s.poss}</td>
                                      <td className="td-num" style={{ color: '#34d399', fontWeight: 700 }}>{s.real}</td>
                                      <td className="td-center">{renderPercentBadge(s.percent)}</td>
                                    </React.Fragment>
                                  );
                                })}
                                <td className="td-num" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#38bdf8' }}>{sup.total.lojas}</td>
                                <td className="td-num" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#38bdf8' }}>{sup.total.poss}</td>
                                <td className="td-num" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#34d399', fontWeight: 800 }}>{sup.total.real}</td>
                                <td className="td-center" style={{ background: 'rgba(99, 102, 241, 0.1)' }}>{renderPercentBadge(sup.total.percent)}</td>
                              </tr>

                              {/* Linhas dos Vendedores da Equipe */}
                              {isExpanded && sup.vendedores.map(v => (
                                <tr key={v.id} style={{ background: 'rgba(255,255,255,0.02)' }}>
                                  <td className="td-nome" style={{ paddingLeft: '32px', color: '#cbd5e1', fontWeight: 500 }}>
                                    {v.nome} <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({v.id})</span>
                                  </td>
                                  {data.segmentos.map(seg => {
                                    const s = v.segmentos[seg];
                                    return (
                                      <React.Fragment key={seg}>
                                        <td className="td-num" style={{ color: '#64748b' }}>{s.lojas}</td>
                                        <td className="td-num" style={{ color: '#64748b' }}>{s.poss}</td>
                                        <td className="td-num" style={{ color: '#f8fafc' }}>{s.real}</td>
                                        <td className="td-center">{renderPercentBadge(s.percent)}</td>
                                      </React.Fragment>
                                    );
                                  })}
                                  <td className="td-num">{v.total.lojas}</td>
                                  <td className="td-num">{v.total.poss}</td>
                                  <td className="td-num" style={{ color: '#34d399', fontWeight: 700 }}>{v.total.real}</td>
                                  <td className="td-center">{renderPercentBadge(v.total.percent)}</td>
                                </tr>
                              ))}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── ABA 2: EVOLUÇÃO DIÁRIA (EDM) ───────────────────── */}
              {activeTab === 'edm' && (
                <div className="vendas-table-card">
                  <div className="vendas-table-header">
                    <h3 className="vendas-table-title">📅 EVOLUÇÃO DIÁRIA DO MSL (EDM - DIAS 1 AO 31)</h3>
                  </div>

                  <div className="vendas-table-wrapper">
                    <table className="vendas-table">
                      <thead>
                        <tr>
                          <th className="th-left" style={{ minWidth: '200px' }}>SUPERVISOR</th>
                          {Array.from({ length: 31 }, (_, i) => {
                            const day = String(i + 1).padStart(2, '0');
                            return <th key={day} className="td-center" style={{ minWidth: '60px', fontSize: '0.8rem' }}>{day}</th>;
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {data.evolucaoDiariaSupervisores.map((sup) => (
                          <tr key={sup.nome}>
                            <td className="td-nome">{sup.nome}</td>
                            {Array.from({ length: 31 }, (_, i) => {
                              const day = String(i + 1).padStart(2, '0');
                              const pct = sup.dias[day] || 0;
                              return (
                                <td key={day} className="td-center" style={{ padding: '6px 4px' }}>
                                  <span style={{ 
                                    fontSize: '0.75rem', 
                                    fontWeight: 700,
                                    color: pct >= 80 ? '#34d399' : pct >= 50 ? '#fbbf24' : '#f87171'
                                  }}>
                                    {pct > 0 ? `${pct.toFixed(0)}%` : '-'}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── ABA 3: CARTEIRA DETALHADA DE CLIENTES ──────────── */}
              {activeTab === 'clientes' && (
                <div className="vendas-table-card">
                  <div className="vendas-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <h3 className="vendas-table-title">👥 CARTEIRA DETALHADA DE CLIENTES ({tipoMsl})</h3>
                    
                    <input
                      type="text"
                      placeholder="🔍 Pesquisar cliente ou vendedor..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '6px 16px', color: '#f8fafc', fontSize: '0.85rem', width: '280px', outline: 'none' }}
                    />
                  </div>

                  <div className="vendas-table-wrapper">
                    <table className="vendas-table">
                      <thead>
                        <tr>
                          <th className="th-left">CÓDIGO</th>
                          <th className="th-left">RAZÃO SOCIAL / CLIENTE</th>
                          <th className="td-center">SEGMENTO</th>
                          <th className="th-left">VENDEDOR / SUPERVISOR</th>
                          <th className="td-num">POSSIBILIDADES</th>
                          <th className="td-num">REALIZADO</th>
                          <th className="td-center">% ATINGIMENTO</th>
                          <th className="td-center">STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredClientes.map((c) => {
                          const isExpanded = expandedSups[`cli-${c.id_cliente}`];
                          return (
                            <React.Fragment key={c.id_cliente}>
                              <tr 
                                onClick={() => toggleExpandSup(`cli-${c.id_cliente}`)}
                                style={{ cursor: 'pointer' }}
                              >
                                <td className="td-nome" style={{ color: '#94a3b8', fontFamily: 'monospace' }}>
                                  {isExpanded ? '▼ ' : '▶ '}#{c.id_cliente}
                                </td>
                                <td className="td-nome" style={{ fontWeight: 700, color: '#f8fafc' }}>{c.cliente_nome}</td>
                                <td className="td-center">
                                  <span style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700 }}>
                                    {c.segmento}
                                  </span>
                                </td>
                                <td className="td-nome" style={{ fontSize: '0.85rem' }}>
                                  {c.vendedor}
                                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>Sup: {c.supervisor}</span>
                                </td>
                                <td className="td-num">{c.possibilidades} itens</td>
                                <td className="td-num" style={{ fontWeight: 700, color: c.isBatido ? '#34d399' : '#f8fafc' }}>{c.realizados} itens</td>
                                <td className="td-center">{renderPercentBadge(c.percent)}</td>
                                <td className="td-center">
                                  {c.isBatido ? (
                                    <span style={{ color: '#34d399', fontWeight: 700, fontSize: '0.8rem' }}>🟢 BATIDO</span>
                                  ) : (
                                    <span style={{ color: '#f87171', fontWeight: 600, fontSize: '0.8rem' }}>🟡 PENDENTE</span>
                                  )}
                                </td>
                              </tr>

                              {/* Checklist Expansível dos Produtos Obrigatórios do Cliente */}
                              {isExpanded && (
                                <tr style={{ background: 'rgba(15, 23, 42, 0.95)' }}>
                                  <td colSpan={8} style={{ padding: '16px 24px' }}>
                                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '16px' }}>
                                      <h4 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: '#38bdf8', textTransform: 'uppercase' }}>
                                        📋 Produtos Obrigatórios do Segmento {c.segmento} ({c.realizados} de {c.possibilidades} Validados)
                                      </h4>
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
                                        {c.produtos && c.produtos.map((p: any) => (
                                          <div 
                                            key={p.id_produto}
                                            style={{ 
                                              display: 'flex', 
                                              justify: 'space-between', 
                                              alignItems: 'center',
                                              padding: '10px 14px',
                                              borderRadius: '8px',
                                              gap: '12px',
                                              background: p.isValido ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                                              border: p.isValido ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.25)'
                                            }}
                                          >
                                            <span style={{ fontSize: '0.82rem', color: '#f8fafc', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, paddingRight: '8px' }}>
                                              {p.isValido ? '🟢 ' : '🔴 '}{p.nome_produto}
                                            </span>
                                            <span style={{ 
                                              fontSize: '0.78rem', 
                                              fontWeight: 800, 
                                              color: p.isValido ? '#34d399' : '#f87171',
                                              background: 'rgba(0,0,0,0.4)',
                                              padding: '3px 10px',
                                              borderRadius: '9999px',
                                              whiteSpace: 'nowrap',
                                              letterSpacing: '0.5px'
                                            }}>
                                              {p.qtdVendida} / 3 unds
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </>
          )}

        </div>
      </main>
    </div>
  );
}
