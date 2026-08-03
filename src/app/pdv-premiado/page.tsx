'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar/Sidebar';
import Header from '@/components/Header/Header';
import '../dashboard.css';
import '../vendas/vendas.css';

interface PdvItem {
  id_cliente: string;
  cliente_nome: string;
  rede: string;
  categoria: string;
  meta: number;
  realizado: number;
  gap: number;
  percent: number;
  isBatido: boolean;
}

interface PdvResumo {
  totalPdvs: number;
  pdvsBatidos: number;
  pdvsRestantes: number;
  goldTotal: number;
  goldBatidos: number;
  diamondTotal: number;
  diamondBatidos: number;
  metaTotal: number;
  realizadoTotal: number;
  gapTotal: number;
  percentGeral: number;
}

interface PdvData {
  resumo: PdvResumo;
  pdvs: PdvItem[];
}

export default function PdvPremiadoPage() {
  const [data, setData] = useState<PdvData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMes, setSelectedMes] = useState('');
  const [selectedDia, setSelectedDia] = useState('');
  const [filterCategory, setFilterCategory] = useState<'TODOS' | 'GOLD' | 'DIAMOND'>('TODOS');
  const [searchTerm, setSearchTerm] = useState('');

  const loadPdvData = useCallback(() => {
    setLoading(true);
    let url = '/api/pdv-premiado?';
    if (selectedMes) url += `mes=${selectedMes}&`;
    if (selectedDia) url += `dia=${selectedDia}&`;

    fetch(url)
      .then((res) => res.json())
      .then((result) => {
        if (result.success && result.data) {
          setData(result.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedMes, selectedDia]);

  useEffect(() => {
    loadPdvData();
  }, [loadPdvData]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const renderPercentBadge = (percent: number) => {
    const isPositive = percent >= 100;
    return (
      <span className={`percent-badge ${isPositive ? 'percent-badge--success' : 'percent-badge--danger'}`}>
        {percent.toFixed(1)}%
      </span>
    );
  };

  const filteredPdvs = data?.pdvs.filter(p => {
    const matchSearch = p.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.id_cliente.includes(searchTerm) ||
                        p.rede.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterCategory === 'GOLD') return matchSearch && p.categoria === 'GOLD';
    if (filterCategory === 'DIAMOND') return matchSearch && p.categoria === 'DIAMOND';
    return matchSearch;
  }) || [];

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Header />
        <div className="page-content vendas-page" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Header Title + Período */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                🏆 Campanhas PDV Premiado (Reckitt Core)
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
                Acompanhamento das Metas Financeiras e Atingimento por Categoria de Loja (Gold & Diamond)
              </p>
            </div>

            {/* Filter Bar Period Pill */}
            <div className="filter-bar" style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '6px 16px', borderRadius: '9999px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                📅 Período:
              </span>
              <select
                value={selectedMes}
                onChange={(e) => setSelectedMes(e.target.value)}
                style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}
              >
                <option value="">Todos os Meses</option>
                <option value="06">Junho</option>
                <option value="05">Maio</option>
                <option value="04">Abril</option>
                <option value="03">Março</option>
              </select>

              <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>

              <select
                value={selectedDia}
                onChange={(e) => setSelectedDia(e.target.value)}
                style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}
              >
                <option value="">Acumulado do Mês</option>
                {Array.from({ length: 31 }, (_, i) => {
                  const day = String(i + 1).padStart(2, '0');
                  return <option key={day} value={day}>Dia {day}</option>;
                })}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <span>Carregando dados do PDV Premiado...</span>
            </div>
          ) : !data ? (
            <div className="empty-state">
              <span className="empty-state__icon">🏆</span>
              <span className="empty-state__text">Nenhuma loja cadastrada no PDV Premiado.</span>
            </div>
          ) : (
            <>
              {/* ── Cards Executivos de Resumo ──────────────────────── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                
                {/* Card Faturamento Reckitt Core */}
                <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '20px', backdropFilter: 'blur(16px)' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>
                    Faturamento Realizado (Reckitt Core)
                  </span>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', margin: '8px 0 4px 0' }}>
                    {formatCurrency(data.resumo.realizadoTotal)}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#94a3b8' }}>Meta: {formatCurrency(data.resumo.metaTotal)}</span>
                    <span style={{ color: '#38bdf8', fontWeight: 700 }}>{data.resumo.percentGeral.toFixed(1)}%</span>
                  </div>
                </div>

                {/* Card Lojas GOLD */}
                <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '16px', padding: '20px', backdropFilter: 'blur(16px)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 700 }}>
                      🥇 Lojas GOLD Batidas
                    </span>
                    <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', padding: '2px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>
                      GOLD
                    </span>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24', margin: '8px 0 4px 0' }}>
                    {data.resumo.goldBatidos} <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 400 }}>de {data.resumo.goldTotal}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                    Atingimento: <strong>{data.resumo.goldTotal > 0 ? ((data.resumo.goldBatidos / data.resumo.goldTotal) * 100).toFixed(1) : '0'}%</strong>
                  </div>
                </div>

                {/* Card Lojas DIAMOND */}
                <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '16px', padding: '20px', backdropFilter: 'blur(16px)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: '#38bdf8', textTransform: 'uppercase', fontWeight: 700 }}>
                      💎 Lojas DIAMOND Batidas
                    </span>
                    <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '2px 10px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800 }}>
                      DIAMOND
                    </span>
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8', margin: '8px 0 4px 0' }}>
                    {data.resumo.diamondBatidos} <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 400 }}>de {data.resumo.diamondTotal}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                    Atingimento: <strong>{data.resumo.diamondTotal > 0 ? ((data.resumo.diamondBatidos / data.resumo.diamondTotal) * 100).toFixed(1) : '0'}%</strong>
                  </div>
                </div>

                {/* Card Total de Lojas Batidas */}
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '16px', padding: '20px', backdropFilter: 'blur(16px)' }}>
                  <span style={{ fontSize: '0.8rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 700 }}>
                    🎯 Total de PDVs Batidos
                  </span>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399', margin: '8px 0 4px 0' }}>
                    {data.resumo.pdvsBatidos} <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 400 }}>de {data.resumo.totalPdvs}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                    {data.resumo.pdvsRestantes} lojas pendentes para a meta!
                  </div>
                </div>

              </div>

              {/* ── Tabela de Lojas Participantes ──────────────────── */}
              <div className="vendas-table-card">
                <div className="vendas-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <h3 className="vendas-table-title">🏆 DESEMPENHO DAS LOJAS PARTICIPANTES</h3>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Botões de Filtro Gold / Diamond */}
                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: '8px', gap: '2px' }}>
                      <button
                        onClick={() => setFilterCategory('TODOS')}
                        style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, color: filterCategory === 'TODOS' ? '#fff' : '#94a3b8', background: filterCategory === 'TODOS' ? 'rgba(255,255,255,0.1)' : 'transparent' }}
                      >
                        TODAS ({data.resumo.totalPdvs})
                      </button>
                      <button
                        onClick={() => setFilterCategory('GOLD')}
                        style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, color: filterCategory === 'GOLD' ? '#fbbf24' : '#94a3b8', background: filterCategory === 'GOLD' ? 'rgba(245, 158, 11, 0.2)' : 'transparent' }}
                      >
                        🥇 GOLD ({data.resumo.goldTotal})
                      </button>
                      <button
                        onClick={() => setFilterCategory('DIAMOND')}
                        style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, color: filterCategory === 'DIAMOND' ? '#38bdf8' : '#94a3b8', background: filterCategory === 'DIAMOND' ? 'rgba(56, 189, 248, 0.2)' : 'transparent' }}
                      >
                        💎 DIAMOND ({data.resumo.diamondTotal})
                      </button>
                    </div>

                    <input
                      type="text"
                      placeholder="🔍 Buscar loja ou rede..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '6px 16px', color: '#f8fafc', fontSize: '0.85rem', width: '220px', outline: 'none' }}
                    />
                  </div>
                </div>

                <div className="vendas-table-wrapper">
                  <table className="vendas-table">
                    <thead>
                      <tr>
                        <th className="th-left">CÓDIGO</th>
                        <th className="th-left">RAZÃO SOCIAL / LOJA</th>
                        <th className="th-left">REDE / GRUPO</th>
                        <th className="td-center">CATEGORIA</th>
                        <th className="td-num">META FINANCEIRA</th>
                        <th className="td-num">REALIZADO (RECKITT CORE)</th>
                        <th className="td-num">GAP</th>
                        <th className="td-center">% ATINGIMENTO</th>
                        <th className="td-center">STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPdvs.map((p) => (
                        <tr key={p.id_cliente} style={{ background: p.isBatido ? 'rgba(16, 185, 129, 0.03)' : undefined }}>
                          <td className="td-nome" style={{ color: '#94a3b8', fontFamily: 'monospace' }}>#{p.id_cliente}</td>
                          <td className="td-nome" style={{ fontWeight: 700, color: '#f8fafc' }}>{p.cliente_nome}</td>
                          <td className="td-nome" style={{ color: '#94a3b8' }}>🏢 {p.rede}</td>
                          <td className="td-center">
                            <span style={{ 
                              padding: '3px 10px', 
                              borderRadius: '9999px', 
                              fontSize: '0.75rem', 
                              fontWeight: 800,
                              background: p.categoria === 'DIAMOND' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                              color: p.categoria === 'DIAMOND' ? '#38bdf8' : '#fbbf24',
                              border: p.categoria === 'DIAMOND' ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
                            }}>
                              {p.categoria === 'DIAMOND' ? '💎 DIAMOND' : '🥇 GOLD'}
                            </span>
                          </td>
                          <td className="td-num">{formatCurrency(p.meta)}</td>
                          <td className="td-num" style={{ fontWeight: 700, color: p.isBatido ? '#34d399' : '#f8fafc' }}>{formatCurrency(p.realizado)}</td>
                          <td className="td-num" style={{ fontWeight: 700, color: p.gap >= 0 ? '#34d399' : '#f87171' }}>
                            {p.gap >= 0 ? `+${formatCurrency(p.gap)}` : formatCurrency(p.gap)}
                          </td>
                          <td className="td-center">{renderPercentBadge(p.percent)}</td>
                          <td className="td-center">
                            {p.isBatido ? (
                              <span style={{ color: '#34d399', fontWeight: 700, fontSize: '0.8rem' }}>🟢 BATIDO</span>
                            ) : (
                              <span style={{ color: '#f87171', fontWeight: 600, fontSize: '0.8rem' }}>🟡 RESTANTE</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </>
          )}

        </div>
      </main>
    </div>
  );
}
