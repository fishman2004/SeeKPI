'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar/Sidebar';
import Header from '@/components/Header/Header';
import '../dashboard.css';
import '../vendas/vendas.css';

interface CategoriaItem {
  categoria: string;
  meta: number;
  realizado: number;
  gap: number;
  percent: number;
  isBatida?: boolean;
}

interface ResumoGeralCLC {
  totalCategorias: number;
  batidas: number;
  restantes: number;
  metaGeral: number;
  realGeral: number;
  gapGeral: number;
  percentGeral: number;
  categorias: CategoriaItem[];
}

interface SupervisorMatrizCLC {
  nome: string;
  metaTotal: number;
  realTotal: number;
  gapTotal: number;
  percentTotal: number;
  categorias: CategoriaItem[];
}

interface VendedorMatrizCLC {
  id: string;
  nome: string;
  supervisor: string;
  metaTotal: number;
  realTotal: number;
  gapTotal: number;
  percentTotal: number;
  batidasCount: number;
  totalCategorias: number;
  categorias: CategoriaItem[];
}

interface CategoriasData {
  resumoGeral: ResumoGeralCLC;
  supervisoresMatriz: SupervisorMatrizCLC[];
  vendedoresMatriz: VendedorMatrizCLC[];
}

export default function CategoriasPage() {
  const [data, setData] = useState<CategoriasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMes, setSelectedMes] = useState('');
  const [selectedDia, setSelectedDia] = useState('');
  const [selectedFilterSup, setSelectedFilterSup] = useState('');
  const [selectedFilterVend, setSelectedFilterVend] = useState('');

  const loadCategoriasData = useCallback(() => {
    setLoading(true);
    let url = '/api/categorias?';
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
    loadCategoriasData();
  }, [loadCategoriasData]);

  const renderPercentBadge = (percent: number | null | undefined) => {
    const val = percent || 0;
    const isPositive = val >= 100;
    return (
      <span className={`percent-badge ${isPositive ? 'percent-badge--success' : 'percent-badge--danger'}`}>
        {val.toFixed(1)}%
      </span>
    );
  };

  const renderGapBadge = (gap: number) => {
    const isPositive = gap >= 0;
    const formatted = gap > 0 ? `+${gap}` : `${gap}`;
    return (
      <span className={isPositive ? 'gap-positive' : 'gap-negative'} style={{ fontWeight: 700 }}>
        {formatted}
      </span>
    );
  };

  // Vendedor selecionado no Card de Resumo Individual
  const vendorSelectedObj = data?.vendedoresMatriz.find(v => v.id === selectedFilterVend);
  const supSelectedObj = data?.supervisoresMatriz.find(s => s.nome === selectedFilterSup);

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
                📦 Painel Geral de Categorias CLC
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
                Acompanhamento Consolidado de Metas e Positivação por Categoria
              </p>
            </div>

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
              <span>Carregando painel de categorias CLC...</span>
            </div>
          ) : !data ? (
            <div className="empty-state">
              <span className="empty-state__icon">📦</span>
              <span className="empty-state__text">Nenhuma meta de categoria CLC encontrada no sistema.</span>
            </div>
          ) : (
            <>
              {/* ── 1. Resumo Geral de Categorias (Cards + Tabela) ──── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
                
                {/* Tabela Resumo CLC Categorias */}
                <div className="vendas-table-card" style={{ margin: 0 }}>
                  <div className="vendas-table-header">
                    <h3 className="vendas-table-title">📊 RESUMO GERAL DAS CATEGORIAS</h3>
                  </div>
                  <div className="vendas-table-wrapper">
                    <table className="vendas-table">
                      <thead>
                        <tr>
                          <th className="th-left">CATEGORIA</th>
                          <th className="td-num">META</th>
                          <th className="td-num">REAL</th>
                          <th className="td-num">GAP</th>
                          <th className="td-center">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.resumoGeral.categorias.map((c) => (
                          <tr key={c.categoria} style={{ background: c.isBatida ? 'rgba(16, 185, 129, 0.05)' : undefined }}>
                            <td className="td-nome" style={{ fontWeight: 700, color: c.isBatida ? '#34d399' : '#f8fafc' }}>
                              {c.isBatida ? '🟢 ' : '🟡 '}{c.categoria}
                            </td>
                            <td className="td-num">{c.meta}</td>
                            <td className="td-num" style={{ fontWeight: 700, color: c.isBatida ? '#34d399' : '#f8fafc' }}>{c.realizado}</td>
                            <td className="td-num">{renderGapBadge(c.gap)}</td>
                            <td className="td-center">{renderPercentBadge(c.percent)}</td>
                          </tr>
                        ))}
                        {/* Total Row */}
                        <tr style={{ background: 'rgba(99, 102, 241, 0.1)', fontWeight: 800 }}>
                          <td className="td-nome" style={{ color: '#f8fafc' }}>TOTAL GERAL CLC</td>
                          <td className="td-num">{data.resumoGeral.metaGeral}</td>
                          <td className="td-num" style={{ color: '#38bdf8' }}>{data.resumoGeral.realGeral}</td>
                          <td className="td-num">{renderGapBadge(data.resumoGeral.gapGeral)}</td>
                          <td className="td-center">{renderPercentBadge(data.resumoGeral.percentGeral)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Placa de Status das Categorias */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '24px', backdropFilter: 'blur(16px)', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h4 style={{ color: '#94a3b8', fontSize: '0.9rem', textTransform: 'uppercase', margin: '0 0 12px 0', letterSpacing: '0.5px' }}>
                      SAÚDE DAS CATEGORIAS CLC
                    </h4>
                    
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '20px' }}>
                      <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '16px 20px', borderRadius: '12px', flex: 1, textAlign: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>BATIDAS</span>
                        <span style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399' }}>{data.resumoGeral.batidas}</span>
                      </div>
                      <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '16px 20px', borderRadius: '12px', flex: 1, textAlign: 'center' }}>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, display: 'block', marginBottom: '4px' }}>RESTANTES</span>
                        <span style={{ fontSize: '2rem', fontWeight: 800, color: '#f87171' }}>{data.resumoGeral.restantes}</span>
                      </div>
                    </div>

                    {/* Progress Global */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px', fontWeight: 600 }}>
                        <span style={{ color: '#cbd5e1' }}>Atingimento Global das Categorias</span>
                        <span style={{ color: '#38bdf8' }}>{data.resumoGeral.percentGeral.toFixed(1)}%</span>
                      </div>
                      <div style={{ width: '100%', height: '12px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.min(data.resumoGeral.percentGeral, 100)}%`, background: 'linear-gradient(90deg, #6366f1, #38bdf8)', borderRadius: '6px' }} />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* ── 2. Visão Matriz Por Gestão / Supervisores ───────── */}
              <div className="vendas-table-card">
                <div className="vendas-table-header">
                  <h3 className="vendas-table-title">👔 GESTÃO (MATRIZ POR SUPERVISOR)</h3>
                </div>
                <div className="vendas-table-wrapper">
                  <table className="vendas-table">
                    <thead>
                      <tr>
                        <th className="th-left" style={{ minWidth: '220px' }}>SUPERVISOR</th>
                        {data.resumoGeral.categorias.map(c => (
                          <th key={c.categoria} className="td-center" style={{ minWidth: '130px' }}>{c.categoria}</th>
                        ))}
                        <th className="td-center" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#f8fafc' }}>TOTAL GERAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.supervisoresMatriz.map((sup) => (
                        <tr key={sup.nome}>
                          <td className="td-nome">{sup.nome}</td>
                          {sup.categorias.map(cat => (
                            <td key={cat.categoria} className="td-center">
                              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>
                                {cat.realizado} / <span style={{ color: '#94a3b8', fontWeight: 400 }}>{cat.meta}</span>
                              </div>
                              <div>{renderPercentBadge(cat.percent)}</div>
                            </td>
                          ))}
                          <td className="td-center" style={{ background: 'rgba(99, 102, 241, 0.08)', fontWeight: 800 }}>
                            <div style={{ fontSize: '0.9rem', color: '#38bdf8' }}>{sup.realTotal} / {sup.metaTotal}</div>
                            <div>{renderPercentBadge(sup.percentTotal)}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── 3. Visão Matriz Por Vendedores ──────────────────── */}
              <div className="vendas-table-card">
                <div className="vendas-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <h3 className="vendas-table-title">👤 DESEMPENHO POR VENDEDOR & CATEGORIAS BATIDAS</h3>
                  
                  {/* Seletor para Card Individual */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>Simular Card:</label>
                    <select
                      value={selectedFilterVend}
                      onChange={(e) => setSelectedFilterVend(e.target.value)}
                      style={{ background: 'rgba(15,23,42,0.8)', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', padding: '6px 12px', fontSize: '0.85rem', outline: 'none' }}
                    >
                      <option value="">Selecione um Vendedor...</option>
                      {data.vendedoresMatriz.map(v => (
                        <option key={v.id} value={v.id}>{v.nome}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Card Individual do Vendedor Selecionado (Estilo 3ª Foto da Planilha!) */}
                {vendorSelectedObj && (
                  <div style={{ padding: '20px', background: 'rgba(15, 23, 42, 0.9)', borderBottom: '1px solid rgba(99, 102, 241, 0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Resumo Vendedor Categorias CLC</span>
                        <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.2rem', fontWeight: 800 }}>
                          [{vendorSelectedObj.id}] {vendorSelectedObj.nome} <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 400 }}>(Supervisor: {vendorSelectedObj.supervisor})</span>
                        </h3>
                      </div>
                      <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '8px 16px', borderRadius: '10px' }}>
                        <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 700 }}>
                          🎯 {vendorSelectedObj.batidasCount} de {vendorSelectedObj.totalCategorias} Categorias Batidas!
                        </span>
                      </div>
                    </div>

                    <table className="subtable" style={{ width: '100%', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                          <th style={{ textAlign: 'left', padding: '10px' }}>CATEGORIA</th>
                          <th style={{ textAlign: 'right', padding: '10px' }}>META</th>
                          <th style={{ textAlign: 'right', padding: '10px' }}>REAL</th>
                          <th style={{ textAlign: 'right', padding: '10px' }}>GAP</th>
                          <th style={{ textAlign: 'center', padding: '10px' }}>% ATINGIMENTO</th>
                          <th style={{ textAlign: 'center', padding: '10px' }}>STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendorSelectedObj.categorias.map(c => (
                          <tr key={c.categoria} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <td style={{ padding: '10px', color: '#f8fafc', fontWeight: 700 }}>{c.categoria}</td>
                            <td style={{ padding: '10px', textAlign: 'right', color: '#94a3b8' }}>{c.meta}</td>
                            <td style={{ padding: '10px', textAlign: 'right', color: c.isBatida ? '#34d399' : '#f8fafc', fontWeight: 700 }}>{c.realizado}</td>
                            <td style={{ padding: '10px', textAlign: 'right' }}>{renderGapBadge(c.gap)}</td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>{renderPercentBadge(c.percent)}</td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                              {c.isBatida ? (
                                <span style={{ color: '#34d399', fontWeight: 700, fontSize: '0.8rem' }}>🟢 BATIDA</span>
                              ) : (
                                <span style={{ color: '#f87171', fontWeight: 600, fontSize: '0.8rem' }}>🟡 PENDENTE</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Tabela Matriz com todos os Vendedores */}
                <div className="vendas-table-wrapper">
                  <table className="vendas-table">
                    <thead>
                      <tr>
                        <th className="th-left">VENDEDOR / RCA</th>
                        <th className="td-center">CATEGORIAS BATIDAS</th>
                        {data.resumoGeral.categorias.map(c => (
                          <th key={c.categoria} className="td-center" style={{ minWidth: '120px' }}>{c.categoria}</th>
                        ))}
                        <th className="td-center" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#f8fafc' }}>GERAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.vendedoresMatriz.map((v) => (
                        <tr key={v.id}>
                          <td className="td-nome">
                            <strong style={{ color: '#f8fafc' }}>{v.nome}</strong>
                            <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>RCA {v.id}</span>
                          </td>
                          <td className="td-center">
                            <span style={{ background: v.batidasCount > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)', color: v.batidasCount > 0 ? '#34d399' : '#94a3b8', padding: '4px 10px', borderRadius: '6px', fontWeight: 700, fontSize: '0.85rem' }}>
                              {v.batidasCount} / {v.totalCategorias}
                            </span>
                          </td>
                          {v.categorias.map(cat => (
                            <td key={cat.categoria} className="td-center">
                              <div style={{ fontSize: '0.8rem', color: cat.isBatida ? '#34d399' : '#f8fafc', fontWeight: 600 }}>
                                {cat.realizado} / <span style={{ color: '#64748b' }}>{cat.meta}</span>
                              </div>
                              <div>{renderPercentBadge(cat.percent)}</div>
                            </td>
                          ))}
                          <td className="td-center" style={{ background: 'rgba(99, 102, 241, 0.08)', fontWeight: 800 }}>
                            <div style={{ fontSize: '0.85rem', color: '#38bdf8' }}>{v.realTotal} / {v.metaTotal}</div>
                            <div>{renderPercentBadge(v.percentTotal)}</div>
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
