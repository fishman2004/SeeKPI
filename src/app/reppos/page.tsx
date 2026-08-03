'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar/Sidebar';
import Header from '@/components/Header/Header';
import '../dashboard.css';
import '../vendas/vendas.css';

interface ResumoGeralReppos {
  fatGeral: number;
  fatReppos: number;
  shareFaturamento: number;
  posGeral: number;
  posReppos: number;
  sharePositivacao: number;
  pedGeral: number;
  pedReppos: number;
  ticketMedioGeral: number;
  ticketMedioReppos: number;
}

interface VendedorReppos {
  id: string;
  nome: string;
  totalFat: number;
  repposFat: number;
  shareFat: number;
  totalPos: number;
  repposPos: number;
  sharePos: number;
}

interface SupervisorReppos {
  nome: string;
  totalFat: number;
  repposFat: number;
  shareFat: number;
  totalPos: number;
  repposPos: number;
  sharePos: number;
  vendedores: VendedorReppos[];
}

interface TopClienteReppos {
  id_cliente: string;
  cliente_nome: string;
  rede: string;
  repposFat: number;
  pedidos: number;
}

interface RepposData {
  resumoGeral: ResumoGeralReppos;
  supervisores: SupervisorReppos[];
  topClientes: TopClienteReppos[];
}

export default function RepposPage() {
  const [data, setData] = useState<RepposData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMes, setSelectedMes] = useState('');
  const [selectedDia, setSelectedDia] = useState('');
  const [expandedSupervisor, setExpandedSupervisor] = useState<string | null>(null);

  const loadRepposData = useCallback(() => {
    setLoading(true);
    let url = '/api/reppos?';
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
    loadRepposData();
  }, [loadRepposData]);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

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
                🛒 Reppos E-Commerce B2B
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>
                Acompanhamento e Representatividade Digital de Vendas (Pedidos 380...)
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
              <span>Carregando métricas digitais do Reppos...</span>
            </div>
          ) : !data ? (
            <div className="empty-state">
              <span className="empty-state__icon">🛒</span>
              <span className="empty-state__text">Nenhuma venda via Reppos (Pedidos 380...) registrada neste período.</span>
            </div>
          ) : (
            <>
              {/* ── Cards de Indicadores Reppos ─────────────────────── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                
                {/* Card 1: Share de Faturamento */}
                <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '16px', padding: '20px', backdropFilter: 'blur(16px)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
                    <span>FATURAMENTO REPPOS</span>
                    <span>SHARE DIGITAL</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38bdf8', marginBottom: '4px' }}>
                    {formatMoney(data.resumoGeral.fatReppos)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(data.resumoGeral.shareFaturamento, 100)}%`, background: '#38bdf8', borderRadius: '4px' }} />
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#38bdf8' }}>
                      {data.resumoGeral.shareFaturamento.toFixed(1)}%
                    </span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Do total de {formatMoney(data.resumoGeral.fatGeral)}</span>
                </div>

                {/* Card 2: Penetrabilidade de Carteira */}
                <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '16px', padding: '20px', backdropFilter: 'blur(16px)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
                    <span>POSITIVAÇÃO REPPOS</span>
                    <span>PENETRABILIDADE</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#c084fc', marginBottom: '4px' }}>
                    {data.resumoGeral.posReppos.toLocaleString('pt-BR')} clientes
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(data.resumoGeral.sharePositivacao, 100)}%`, background: '#c084fc', borderRadius: '4px' }} />
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#c084fc' }}>
                      {data.resumoGeral.sharePositivacao.toFixed(1)}%
                    </span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Do total de {data.resumoGeral.posGeral.toLocaleString('pt-BR')} positivados</span>
                </div>

                {/* Card 3: Ticket Médio Reppos */}
                <div style={{ background: 'rgba(15, 23, 42, 0.65)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px', padding: '20px', backdropFilter: 'blur(16px)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
                    <span>TICKET MÉDIO REPPOS</span>
                    <span>VS GERAL</span>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399', marginBottom: '4px' }}>
                    {formatMoney(data.resumoGeral.ticketMedioReppos)}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '12px' }}>
                    Ticket Geral: <strong>{formatMoney(data.resumoGeral.ticketMedioGeral)}</strong>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 700 }}>
                    {data.resumoGeral.ticketMedioGeral > 0 ? `+${(((data.resumoGeral.ticketMedioReppos / data.resumoGeral.ticketMedioGeral) - 1) * 100).toFixed(1)}% maior!` : ''}
                  </span>
                </div>

              </div>

              {/* ── Tabela Por Supervisor & Equipe ──────────────────── */}
              <div className="vendas-table-card">
                <div className="vendas-table-header">
                  <h3 className="vendas-table-title">👔 ADERÊNCIA REPPOS POR EQUIPE (SUPERVISORES)</h3>
                </div>
                <div className="vendas-table-wrapper">
                  <table className="vendas-table">
                    <thead>
                      <tr>
                        <th className="th-left" style={{ minWidth: '280px' }}>SUPERVISOR / EQUIPE</th>
                        <th className="td-num">FATURAMENTO TOTAL</th>
                        <th className="td-num">FATURAMENTO REPPOS</th>
                        <th className="td-center">SHARE REPPOS (%)</th>
                        <th className="td-num">POS. TOTAL</th>
                        <th className="td-num">POS. REPPOS</th>
                        <th className="td-center">PENETRABILIDADE (%)</th>
                        <th className="td-center">DETALHES</th>
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
                              <td className="td-num">{formatMoney(sup.totalFat)}</td>
                              <td className="td-num" style={{ fontWeight: 800, color: '#38bdf8' }}>{formatMoney(sup.repposFat)}</td>
                              <td className="td-center">
                                <span className="percent-badge percent-badge--success">
                                  {sup.shareFat.toFixed(1)}%
                                </span>
                              </td>
                              <td className="td-num">{sup.totalPos.toLocaleString('pt-BR')}</td>
                              <td className="td-num" style={{ fontWeight: 800, color: '#c084fc' }}>{sup.repposPos.toLocaleString('pt-BR')}</td>
                              <td className="td-center">
                                <span className="percent-badge percent-badge--success">
                                  {sup.sharePos.toFixed(1)}%
                                </span>
                              </td>
                              <td className="td-center" style={{ color: '#6366f1', fontWeight: 600 }}>
                                {isExpanded ? '▲ Ocultar' : '▼ Ver Vendedores'}
                              </td>
                            </tr>

                            {/* Vendedores do Supervisor */}
                            {isExpanded && sup.vendedores && sup.vendedores.length > 0 && (
                              <tr key={`exp-reppos-${sup.nome}`}>
                                <td colSpan={8} style={{ padding: '0', background: 'rgba(15, 23, 42, 0.6)' }}>
                                  <div style={{ padding: '20px' }}>
                                    <h4 style={{ color: '#f8fafc', marginBottom: '16px', fontSize: '0.95rem' }}>
                                      👤 Representatividade Digital dos Vendedores: <strong>{sup.nome}</strong>
                                    </h4>

                                    <table className="subtable">
                                      <thead>
                                        <tr>
                                          <th style={{ textAlign: 'left' }}>VENDEDOR / RCA</th>
                                          <th style={{ textAlign: 'right' }}>FAT. TOTAL</th>
                                          <th style={{ textAlign: 'right' }}>FAT. REPPOS</th>
                                          <th style={{ textAlign: 'center' }}>SHARE REPPOS (%)</th>
                                          <th style={{ textAlign: 'right' }}>POS. TOTAL</th>
                                          <th style={{ textAlign: 'right' }}>POS. REPPOS</th>
                                          <th style={{ textAlign: 'center' }}>PENETRABILIDADE (%)</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {sup.vendedores.map((v) => (
                                          <tr key={v.id}>
                                            <td style={{ color: '#f8fafc', fontWeight: 600 }}>{v.nome}</td>
                                            <td style={{ textAlign: 'right', color: '#94a3b8' }}>{formatMoney(v.totalFat)}</td>
                                            <td style={{ textAlign: 'right', color: '#38bdf8', fontWeight: 700 }}>{formatMoney(v.repposFat)}</td>
                                            <td style={{ textAlign: 'center' }}>
                                              <span className="percent-badge percent-badge--success">
                                                {v.shareFat.toFixed(1)}%
                                              </span>
                                            </td>
                                            <td style={{ textAlign: 'right', color: '#94a3b8' }}>{v.totalPos}</td>
                                            <td style={{ textAlign: 'right', color: '#c084fc', fontWeight: 700 }}>{v.repposPos}</td>
                                            <td style={{ textAlign: 'center' }}>
                                              <span className="percent-badge percent-badge--success">
                                                {v.sharePos.toFixed(1)}%
                                              </span>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
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

              {/* ── Top Clientes Compradores Reppos ─────────────────── */}
              <div className="vendas-table-card">
                <div className="vendas-table-header">
                  <h3 className="vendas-table-title">🏆 TOP CLIENTES COMPRADORES NO REPPOS</h3>
                </div>
                <div className="vendas-table-wrapper">
                  <table className="vendas-table">
                    <thead>
                      <tr>
                        <th className="th-left">CÓDIGO</th>
                        <th className="th-left">NOME DO CLIENTE / RAZÃO SOCIAL</th>
                        <th className="td-center">REDE / SEGMENTO</th>
                        <th className="td-num">TOTAL COMPRADO (REPPOS)</th>
                        <th className="td-center">Nº DE PEDIDOS REPPOS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topClientes.map((c, idx) => (
                        <tr key={c.id_cliente}>
                          <td className="td-nome" style={{ color: '#94a3b8', fontSize: '0.85rem' }}>#{c.id_cliente}</td>
                          <td className="td-nome" style={{ fontWeight: 700, color: '#f8fafc' }}>
                            <span style={{ color: idx < 3 ? '#f59e0b' : '#94a3b8', marginRight: '8px' }}>
                              {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}º`}
                            </span>
                            {c.cliente_nome}
                          </td>
                          <td className="td-center">
                            <span style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                              🏢 {c.rede}
                            </span>
                          </td>
                          <td className="td-num" style={{ fontWeight: 800, color: '#34d399' }}>{formatMoney(c.repposFat)}</td>
                          <td className="td-center" style={{ fontWeight: 700, color: '#38bdf8' }}>{c.pedidos} pedidos</td>
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
