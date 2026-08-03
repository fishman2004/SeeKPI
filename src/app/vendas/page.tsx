'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar/Sidebar';
import Header from '@/components/Header/Header';
import '../dashboard.css';
import './vendas.css';

interface MetricItem {
  meta: number;
  real: number;
  gap: number;
  percent: number;
}

interface RowData {
  nome: string;
  id?: string;
  sellOut: MetricItem;
  positivacao: MetricItem;
  vendedores?: RowData[];
}

interface VendasData {
  resumoGlobal: {
    sellOut: MetricItem;
    positivacao: MetricItem;
  };
  supervisores: RowData[];
  fornecedores: RowData[];
}

export default function VendasPage() {
  const [data, setData] = useState<VendasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMes, setSelectedMes] = useState('');
  const [selectedDia, setSelectedDia] = useState('');
  const [expandedSupervisor, setExpandedSupervisor] = useState<string | null>(null);

  const loadVendasData = useCallback(() => {
    setLoading(true);
    let url = '/api/vendas?';
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
    loadVendasData();
  }, [loadVendasData]);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const renderPercentBadge = (percent: number | null | undefined) => {
    const val = percent || 0;
    const isPositive = val >= 100;
    return (
      <span className={`percent-badge ${isPositive ? 'percent-badge--success' : 'percent-badge--danger'}`}>
        {val.toFixed(1)}%
      </span>
    );
  };

  const renderGapBadge = (gap: number, isMoney = true) => {
    const isPositive = gap >= 0;
    const formatted = isMoney ? formatMoney(gap) : (gap > 0 ? `+${gap}` : `${gap}`);
    return (
      <span className={isPositive ? 'gap-positive' : 'gap-negative'} style={{ fontWeight: 700 }}>
        {formatted}
      </span>
    );
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Header />
        <div className="page-content vendas-page" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Top Bar: Titulo e Filtros */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f8fafc', margin: 0 }}>Acompanhamento de Vendas</h1>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Gestão consolidada de Sell-Out e Positivação por Equipe e Fornecedor</p>
            </div>

            <div className="filter-bar" style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '6px 16px', borderRadius: '9999px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                📅 Período:
              </span>
              <select
                value={selectedMes || '06'}
                onChange={(e) => setSelectedMes(e.target.value)}
                style={{ border: 'none', background: 'transparent', boxShadow: 'none' }}
              >
                <option value="06">Junho (Mês Atual)</option>
                <option value="05">Maio</option>
                <option value="04">Abril</option>
                <option value="03">Março</option>
                <option value="02">Fevereiro</option>
                <option value="01">Janeiro</option>
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
              <span>Carregando acompanhamento de vendas...</span>
            </div>
          ) : !data ? (
            <div className="empty-state">
              <span className="empty-state__icon">📥</span>
              <span className="empty-state__text">Nenhum dado de vendas encontrado no sistema.</span>
            </div>
          ) : (
            <>
              {/* ── 1. Resumo Global ──────────────────────────────── */}
              <div className="vendas-table-card">
                <div className="vendas-table-header">
                  <h3 className="vendas-table-title">🏢 RESUMO GERAL (EMPRESA)</h3>
                </div>
                <div className="vendas-table-wrapper">
                  <table className="vendas-table">
                    <thead>
                      <tr>
                        <th className="th-left" style={{ width: '250px' }}>INDICADOR</th>
                        <th className="td-num">META</th>
                        <th className="td-num">REALIZADO</th>
                        <th className="td-num">GAP</th>
                        <th className="td-center">% ATINGIMENTO</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="td-nome" style={{ color: '#38bdf8', fontWeight: 800 }}>💰 SELL-OUT</td>
                        <td className="td-num">{formatMoney(data.resumoGlobal.sellOut.meta)}</td>
                        <td className="td-num" style={{ fontWeight: 800, color: '#f8fafc' }}>{formatMoney(data.resumoGlobal.sellOut.real)}</td>
                        <td className="td-num">{renderGapBadge(data.resumoGlobal.sellOut.gap, true)}</td>
                        <td className="td-center">{renderPercentBadge(data.resumoGlobal.sellOut.percent)}</td>
                      </tr>
                      <tr>
                        <td className="td-nome" style={{ color: '#a855f7', fontWeight: 800 }}>✅ POSITIVAÇÃO</td>
                        <td className="td-num">{data.resumoGlobal.positivacao.meta.toLocaleString('pt-BR')} clientes</td>
                        <td className="td-num" style={{ fontWeight: 800, color: '#f8fafc' }}>{data.resumoGlobal.positivacao.real.toLocaleString('pt-BR')} clientes</td>
                        <td className="td-num">{renderGapBadge(data.resumoGlobal.positivacao.gap, false)}</td>
                        <td className="td-center">{renderPercentBadge(data.resumoGlobal.positivacao.percent)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── 2. Visão Por Gestão / Supervisores ─────────────── */}
              <div className="vendas-table-card">
                <div className="vendas-table-header">
                  <h3 className="vendas-table-title">👔 GESTÃO (SUPERVISORES & EQUIPES)</h3>
                </div>
                <div className="vendas-table-wrapper">
                  <table className="vendas-table">
                    <thead>
                      <tr>
                        <th className="th-left" style={{ minWidth: '280px' }}>SUPERVISOR / EQUIPE</th>
                        <th className="td-num">SELL-OUT (META)</th>
                        <th className="td-num">SELL-OUT (REAL)</th>
                        <th className="td-center">SELL-OUT (%)</th>
                        <th className="td-num">POS. (META)</th>
                        <th className="td-num">POS. (REAL)</th>
                        <th className="td-center">POS. (%)</th>
                        <th className="td-center">AÇÃO</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.supervisores.map((sup) => {
                        const isExpanded = expandedSupervisor === sup.nome;
                        return (
                          <React.Fragment key={sup.nome}>
                            <tr
                              onClick={() => setExpandedSupervisor(isExpanded ? null : sup.nome)}
                              style={{ cursor: 'pointer', background: isExpanded ? 'rgba(99, 102, 241, 0.08)' : undefined }}
                            >
                              <td className="td-nome">{sup.nome}</td>
                              <td className="td-num">{formatMoney(sup.sellOut.meta)}</td>
                              <td className="td-num" style={{ fontWeight: 700, color: '#f8fafc' }}>{formatMoney(sup.sellOut.real)}</td>
                              <td className="td-center">{renderPercentBadge(sup.sellOut.percent)}</td>
                              <td className="td-num">{sup.positivacao.meta.toLocaleString('pt-BR')}</td>
                              <td className="td-num" style={{ fontWeight: 700, color: '#f8fafc' }}>{sup.positivacao.real.toLocaleString('pt-BR')}</td>
                              <td className="td-center">{renderPercentBadge(sup.positivacao.percent)}</td>
                              <td className="td-center" style={{ color: '#6366f1', fontWeight: 600 }}>
                                {isExpanded ? '▲ Ocultar' : '▼ Ver Equipe'}
                              </td>
                            </tr>

                            {/* Equipe do Supervisor Expandida */}
                            {isExpanded && sup.vendedores && sup.vendedores.length > 0 && (
                              <tr key={`expanded-sup-${sup.nome}`}>
                                <td colSpan={8} style={{ padding: 0, background: 'rgba(15, 23, 42, 0.6)' }}>
                                  <div style={{ padding: '20px' }}>
                                    <h4 style={{ color: '#f8fafc', marginBottom: '16px', fontSize: '1rem', fontWeight: 700 }}>
                                      👤 Vendedores & Desempenho Por Fornecedor: <strong>{sup.nome}</strong>
                                    </h4>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                      {sup.vendedores.map((v: any) => (
                                        <div key={v.id} className="vendor-card-box">
                                          {/* Cabeçalho do Vendedor (Total) */}
                                          <div className="vendor-card-header">
                                            <span style={{ color: '#f8fafc', fontWeight: 700, fontSize: '1rem' }}>{v.nome}</span>
                                            <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem' }}>
                                              <span>SELL-OUT TOTAL: <strong style={{ color: '#10b981' }}>{formatMoney(v.sellOut.real)}</strong> / {formatMoney(v.sellOut.meta)} ({renderPercentBadge(v.sellOut.percent)})</span>
                                              <span>POS. TOTAL: <strong style={{ color: '#a855f7' }}>{v.positivacao.real.toLocaleString('pt-BR')}</strong> / {v.positivacao.meta.toLocaleString('pt-BR')} ({renderPercentBadge(v.positivacao.percent)})</span>
                                            </div>
                                          </div>

                                          {/* Tabela de Fornecedores deste Vendedor */}
                                          {v.porFornecedor && v.porFornecedor.length > 0 ? (
                                            <table className="subtable">
                                              <thead>
                                                <tr>
                                                  <th style={{ textAlign: 'left' }}>FORNECEDOR</th>
                                                  <th style={{ textAlign: 'right' }}>META SELL-OUT</th>
                                                  <th style={{ textAlign: 'right' }}>REAL SELL-OUT</th>
                                                  <th style={{ textAlign: 'center' }}>% SELL-OUT</th>
                                                  <th style={{ textAlign: 'right' }}>META POS.</th>
                                                  <th style={{ textAlign: 'right' }}>REAL POS.</th>
                                                  <th style={{ textAlign: 'center' }}>% POS.</th>
                                                </tr>
                                              </thead>
                                              <tbody>
                                                {v.porFornecedor.map((forn: any) => (
                                                  <tr key={forn.nome}>
                                                    <td style={{ color: '#e2e8f0', fontWeight: 600 }}>{forn.nome}</td>
                                                    <td style={{ textAlign: 'right', color: '#94a3b8' }}>{formatMoney(forn.sellOut.meta)}</td>
                                                    <td style={{ textAlign: 'right', color: '#10b981', fontWeight: 600 }}>{formatMoney(forn.sellOut.real)}</td>
                                                    <td style={{ textAlign: 'center' }}>{renderPercentBadge(forn.sellOut.percent)}</td>
                                                    <td style={{ textAlign: 'right', color: '#94a3b8' }}>{forn.positivacao.meta}</td>
                                                    <td style={{ textAlign: 'right', color: '#a855f7', fontWeight: 600 }}>{forn.positivacao.real}</td>
                                                    <td style={{ textAlign: 'center' }}>{renderPercentBadge(forn.positivacao.percent)}</td>
                                                  </tr>
                                                ))}
                                              </tbody>
                                            </table>
                                          ) : (
                                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>Sem vendas ou metas registradas por fornecedor para este vendedor.</span>
                                          )}
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

              {/* ── 3. Visão Por Fornecedor ────────────────────────── */}
              <div className="vendas-table-card">
                <div className="vendas-table-header">
                  <h3 className="vendas-table-title">🏭 PERFORMANCE POR FORNECEDOR</h3>
                </div>
                <div className="vendas-table-wrapper">
                  <table className="vendas-table">
                    <thead>
                      <tr>
                        <th className="th-left" style={{ minWidth: '220px' }}>FORNECEDOR</th>
                        <th className="td-num">SELL-OUT (META)</th>
                        <th className="td-num">SELL-OUT (REAL)</th>
                        <th className="td-num">SELL-OUT (GAP)</th>
                        <th className="td-center">SELL-OUT (%)</th>
                        <th className="td-num">POS. (META)</th>
                        <th className="td-num">POS. (REAL)</th>
                        <th className="td-center">POS. (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.fornecedores.map((f) => (
                        <tr key={f.nome}>
                          <td className="td-nome">{f.nome}</td>
                          <td className="td-num">{formatMoney(f.sellOut.meta)}</td>
                          <td className="td-num" style={{ fontWeight: 700, color: '#f8fafc' }}>{formatMoney(f.sellOut.real)}</td>
                          <td className="td-num">{renderGapBadge(f.sellOut.gap, true)}</td>
                          <td className="td-center">{renderPercentBadge(f.sellOut.percent)}</td>
                          <td className="td-num">{f.positivacao.meta.toLocaleString('pt-BR')}</td>
                          <td className="td-num" style={{ fontWeight: 700, color: '#f8fafc' }}>{f.positivacao.real.toLocaleString('pt-BR')}</td>
                          <td className="td-center">{renderPercentBadge(f.positivacao.percent)}</td>
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
