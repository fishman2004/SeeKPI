'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar/Sidebar';
import Header from '@/components/Header/Header';
import { useAuth } from '@/contexts/AuthContext';
import './vendedores.css';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const formatMoney = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatNumber = (value: number) =>
  new Intl.NumberFormat('pt-BR').format(value);

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Fornecedor {
  id_fornecedor: string;
  nome_fornecedor: string;
  pasta: string;
  meta_financeira: number;
  realizado_financeiro: number;
  gap_financeiro: number;
  percent_financeiro: number;
  meta_positivacao: number;
  realizado_positivacao: number;
  gap_positivacao: number;
  percent_positivacao: number;
}

interface VendedorData {
  vendedor: { id: string; nome: string; supervisor: string; pasta: string };
  fornecedores: Fornecedor[];
  totais: {
    meta_financeira: number; realizado_financeiro: number; gap_financeiro: number; percent_financeiro: number;
    meta_positivacao: number; realizado_positivacao: number; gap_positivacao: number; percent_positivacao: number;
  };
  kpis: {
    carteiraAtiva: { totalClientes: number; meta: number; realizado: number; percent: number; gap: number };
    clc: { categorias: any[]; batidas: number; total: number };
    reppos: { financeiro: number; positivacao: number; percentFat: number; percentPos: number };
    mslReckittCore?: { totalClientes: number; metaGlobal: number; realizadoGlobal: number; percentGlobal: number; clientes: any[] };
    mslVestacy?: { totalClientes: number; metaGlobal: number; realizadoGlobal: number; percentGlobal: number; clientes: any[] };
    pedidosTotal: number;
  };
}

/* ------------------------------------------------------------------ */
/*  Tabs                                                               */
/* ------------------------------------------------------------------ */

const TABS = [
  { id: 'resumo', label: 'Resumo', icon: '📊', active: true },
  { id: 'msl', label: 'MSL', icon: '📋', active: true },
  { id: 'clc', label: 'CLC Categorias', icon: '📦', active: true },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function VendedoresPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // State
  const [vendedores, setVendedores] = useState<any[]>([]);
  const [selectedVendedor, setSelectedVendedor] = useState('');
  const [selectedTab, setSelectedTab] = useState('resumo');
  const [data, setData] = useState<VendedorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPageMounted, setIsPageMounted] = useState(false);

  // Filtros
  const [selectedMes, setSelectedMes] = useState('');
  const [selectedDia, setSelectedDia] = useState('');

  // MSL & CLC Expansion States
  const [mslType, setMslType] = useState<'RECKITT CORE' | 'VESTACY'>('RECKITT CORE');
  const [expandedClienteId, setExpandedClienteId] = useState<string | null>(null);
  const [expandedCatName, setExpandedCatName] = useState<string | null>(null);

  useEffect(() => { setIsPageMounted(true); }, []);

  // Auth guard
  useEffect(() => {
    if (!isLoading && isPageMounted && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router, isPageMounted]);

  // Load vendor list
  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/vendedores?action=list')
        .then(res => res.json())
        .then(result => {
          if (result.success && result.data) {
            setVendedores(result.data);
            if (result.data.length > 0 && !selectedVendedor) {
              setSelectedVendedor(result.data[0].id);
            }
          }
        })
        .catch(console.error);
    }
  }, [isAuthenticated]);

  // Load vendor data when selection or filters change
  const loadVendorData = useCallback(() => {
    if (!selectedVendedor) return;
    setLoading(true);

    const params = new URLSearchParams({ id: selectedVendedor });
    if (selectedMes) params.append('mes', selectedMes);
    if (selectedDia) params.append('dia', selectedDia);

    fetch(`/api/vendedores?${params.toString()}`)
      .then(res => res.json())
      .then(result => {
        if (result.success && result.data) {
          setData(result.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [selectedVendedor, selectedMes, selectedDia]);

  useEffect(() => {
    if (isAuthenticated && selectedVendedor) {
      loadVendorData();
    }
  }, [isAuthenticated, selectedVendedor, selectedMes, selectedDia, loadVendorData]);

  if (isLoading || !isAuthenticated) return null;

  /* ── Render helpers ─────────────────────────────────────────── */

  const renderGap = (value: number, isMoney: boolean) => {
    const isPositive = value >= 0;
    const cls = isPositive ? 'gap-positive' : 'gap-negative';
    const prefix = isPositive ? '+' : '';
    const formatted = isMoney ? formatMoney(value) : `${prefix}${formatNumber(value)}`;
    return <span className={cls}>{isMoney ? (isPositive ? `+${formatted.replace('R$', 'R$')}` : formatted) : formatted}</span>;
  };

  const renderPercent = (value: number) => {
    const cls = value >= 100 ? 'percent-badge percent-badge--success' : 'percent-badge percent-badge--danger';
    return <span className={cls}>{formatPercent(value)}</span>;
  };

  /* ── Tab Content: Resumo ────────────────────────────────────── */

  const renderResumo = () => {
    if (!data) return null;

    return (
      <div className="resumo-content">
        {/* Vendor Info Bar */}
        <div className="vendedor-info-bar">
          <div className="vendedor-info-bar__item">
            <span className="vendedor-info-bar__label">Pasta</span>
            <span className="vendedor-info-bar__value">{data.vendedor.pasta}</span>
          </div>
          <div className="vendedor-info-bar__item">
            <span className="vendedor-info-bar__label">ID</span>
            <span className="vendedor-info-bar__value">{data.vendedor.id}</span>
          </div>
          <div className="vendedor-info-bar__item">
            <span className="vendedor-info-bar__label">Vendedor</span>
            <span className="vendedor-info-bar__value">{data.vendedor.nome}</span>
          </div>
          <div className="vendedor-info-bar__item">
            <span className="vendedor-info-bar__label">Supervisor</span>
            <span className="vendedor-info-bar__value">{data.vendedor.supervisor || 'N/A'}</span>
          </div>
          <div className="vendedor-info-bar__item">
            <span className="vendedor-info-bar__label">Pedidos</span>
            <span className="vendedor-info-bar__value">{data.kpis.pedidosTotal}</span>
          </div>
        </div>

        {/* Fornecedores Table */}
        <div className="fornecedor-table-container">
          <table className="fornecedor-table">
            <thead>
              <tr>
                <th rowSpan={2} className="th-left">PASTA</th>
                <th rowSpan={2} className="th-left">ID</th>
                <th rowSpan={2} className="th-left">FORNECEDOR</th>
                <th colSpan={4} className="th-group th-group--financeiro">💰 FINANCEIRO</th>
                <th colSpan={4} className="th-group th-group--positivacao">✅ POSITIVAÇÃO</th>
              </tr>
              <tr>
                <th>META</th>
                <th>VENDIDO</th>
                <th>GAP</th>
                <th>%</th>
                <th>META</th>
                <th>VENDIDO</th>
                <th>GAP</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {data.fornecedores.map((f, i) => (
                <tr key={f.id_fornecedor} style={{ animationDelay: `${i * 40}ms` }}>
                  <td className="td-pasta">{f.pasta}</td>
                  <td className="td-id">{f.id_fornecedor}</td>
                  <td className="td-nome">{f.nome_fornecedor}</td>
                  <td className="td-money">{formatMoney(f.meta_financeira)}</td>
                  <td className="td-money">{formatMoney(f.realizado_financeiro)}</td>
                  <td className="td-gap">{renderGap(f.gap_financeiro, true)}</td>
                  <td className="td-percent">{renderPercent(f.percent_financeiro)}</td>
                  <td className="td-number">{f.meta_positivacao}</td>
                  <td className="td-number">{f.realizado_positivacao}</td>
                  <td className="td-gap">{renderGap(f.gap_positivacao, false)}</td>
                  <td className="td-percent">{renderPercent(f.percent_positivacao)}</td>
                </tr>
              ))}
              {/* Total Row */}
              <tr className="total-row">
                <td colSpan={3} className="td-total-label">TOTAL GERAL</td>
                <td className="td-money">{formatMoney(data.totais.meta_financeira)}</td>
                <td className="td-money">{formatMoney(data.totais.realizado_financeiro)}</td>
                <td className="td-gap">{renderGap(data.totais.gap_financeiro, true)}</td>
                <td className="td-percent">{renderPercent(data.totais.percent_financeiro)}</td>
                <td className="td-number">{data.totais.meta_positivacao}</td>
                <td className="td-number">{data.totais.realizado_positivacao}</td>
                <td className="td-gap">{renderGap(data.totais.gap_positivacao, false)}</td>
                <td className="td-percent">{renderPercent(data.totais.percent_positivacao)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* KPI Cards Section */}
        <div className="kpi-section">
          {/* Carteira Ativa */}
          <div className="kpi-mini-card">
            <div className="kpi-mini-card__header">
              <span className="kpi-mini-card__icon">📋</span>
              <span className="kpi-mini-card__title">Carteira Ativa - 70%</span>
            </div>
            <div className="kpi-mini-card__body">
              <div className="kpi-mini-card__row">
                <span className="kpi-mini-card__label">Meta</span>
                <span className="kpi-mini-card__value">{data.kpis.carteiraAtiva.meta}</span>
              </div>
              <div className="kpi-mini-card__row">
                <span className="kpi-mini-card__label">Realizado</span>
                <span className="kpi-mini-card__value">{data.kpis.carteiraAtiva.realizado}</span>
              </div>
              <div className="kpi-mini-card__row">
                <span className="kpi-mini-card__label">GAP</span>
                {renderGap(data.kpis.carteiraAtiva.gap, false)}
              </div>
              <div className="kpi-mini-card__progress-track">
                <div
                  className="kpi-mini-card__progress-fill"
                  style={{
                    width: `${Math.min(data.kpis.carteiraAtiva.percent, 100)}%`,
                    backgroundColor: data.kpis.carteiraAtiva.percent >= 100 ? '#10b981' : '#ef4444',
                  }}
                />
              </div>
              <div className="kpi-mini-card__footer">
                {renderPercent(data.kpis.carteiraAtiva.percent)}
              </div>
            </div>
          </div>

          {/* CLC Categorias Resumo */}
          <div className="kpi-mini-card">
            <div className="kpi-mini-card__header">
              <span className="kpi-mini-card__icon">📦</span>
              <span className="kpi-mini-card__title">CLC Categorias</span>
            </div>
            <div className="kpi-mini-card__body">
              <div className="kpi-mini-card__highlight">
                <span className="kpi-mini-card__big-number">{data.kpis.clc.batidas}</span>
                <span className="kpi-mini-card__big-label">de {data.kpis.clc.total} batidas</span>
              </div>
              {data.kpis.clc.categorias.slice(0, 4).map((cat: any) => (
                <div key={cat.categoria} className="kpi-mini-card__row kpi-mini-card__row--compact">
                  <span className="kpi-mini-card__label" title={cat.categoria}>
                    {cat.categoria?.length > 18 ? cat.categoria.substring(0, 18) + '…' : cat.categoria}
                  </span>
                  <span>{cat.realizado}/{cat.meta}</span>
                  {renderPercent(cat.percent)}
                </div>
              ))}
              {data.kpis.clc.categorias.length > 4 && (
                <span className="kpi-mini-card__more">+{data.kpis.clc.categorias.length - 4} mais...</span>
              )}
            </div>
          </div>

          {/* MSL Reckitt Core */}
          <div className="kpi-mini-card">
            <div className="kpi-mini-card__header">
              <span className="kpi-mini-card__icon">🎯</span>
              <span className="kpi-mini-card__title">MSL Reckitt Core</span>
            </div>
            <div className="kpi-mini-card__body">
              {data.kpis.mslReckittCore && data.kpis.mslReckittCore.totalClientes > 0 ? (
                <>
                  <div className="kpi-mini-card__row">
                    <span className="kpi-mini-card__label">Clientes Elegíveis</span>
                    <span className="kpi-mini-card__value">{data.kpis.mslReckittCore.totalClientes}</span>
                  </div>
                  <div className="kpi-mini-card__row">
                    <span className="kpi-mini-card__label">Itens Válidos / Total</span>
                    <span>{data.kpis.mslReckittCore.realizadoGlobal}/{data.kpis.mslReckittCore.metaGlobal}</span>
                  </div>
                  <div className="kpi-mini-card__progress-track">
                    <div
                      className="kpi-mini-card__progress-fill"
                      style={{
                        width: `${Math.min(data.kpis.mslReckittCore.percentGlobal, 100)}%`,
                        backgroundColor: data.kpis.mslReckittCore.percentGlobal >= 70 ? '#10b981' : '#ef4444',
                      }}
                    />
                  </div>
                  <div className="kpi-mini-card__footer">
                    {renderPercent(data.kpis.mslReckittCore.percentGlobal)}
                  </div>
                </>
              ) : (
                <div className="kpi-mini-card__coming-soon">
                  <span>📥</span>
                  <span>Aguardando Upload MSL</span>
                </div>
              )}
            </div>
          </div>

          {/* MSL Vestacy */}
          <div className="kpi-mini-card">
            <div className="kpi-mini-card__header">
              <span className="kpi-mini-card__icon">🎯</span>
              <span className="kpi-mini-card__title">MSL Vestacy</span>
            </div>
            <div className="kpi-mini-card__body">
              {data.kpis.mslVestacy && data.kpis.mslVestacy.totalClientes > 0 ? (
                <>
                  <div className="kpi-mini-card__row">
                    <span className="kpi-mini-card__label">Clientes Elegíveis</span>
                    <span className="kpi-mini-card__value">{data.kpis.mslVestacy.totalClientes}</span>
                  </div>
                  <div className="kpi-mini-card__row">
                    <span className="kpi-mini-card__label">Itens Válidos / Total</span>
                    <span>{data.kpis.mslVestacy.realizadoGlobal}/{data.kpis.mslVestacy.metaGlobal}</span>
                  </div>
                  <div className="kpi-mini-card__progress-track">
                    <div
                      className="kpi-mini-card__progress-fill"
                      style={{
                        width: `${Math.min(data.kpis.mslVestacy.percentGlobal, 100)}%`,
                        backgroundColor: data.kpis.mslVestacy.percentGlobal >= 70 ? '#10b981' : '#ef4444',
                      }}
                    />
                  </div>
                  <div className="kpi-mini-card__footer">
                    {renderPercent(data.kpis.mslVestacy.percentGlobal)}
                  </div>
                </>
              ) : (
                <div className="kpi-mini-card__coming-soon">
                  <span>📥</span>
                  <span>Aguardando Upload MSL</span>
                </div>
              )}
            </div>
          </div>

          {/* Reppos */}
          <div className="kpi-mini-card">
            <div className="kpi-mini-card__header">
              <span className="kpi-mini-card__icon">🛒</span>
              <span className="kpi-mini-card__title">Reppos (E-commerce)</span>
            </div>
            <div className="kpi-mini-card__body">
              <div className="kpi-mini-card__row">
                <span className="kpi-mini-card__label">Financeiro</span>
                <span className="kpi-mini-card__value">{formatMoney(data.kpis.reppos.financeiro)}</span>
              </div>
              <div className="kpi-mini-card__row">
                <span className="kpi-mini-card__label">% do Faturamento</span>
                {renderPercent(data.kpis.reppos.percentFat)}
              </div>
              <div className="kpi-mini-card__row">
                <span className="kpi-mini-card__label">Clientes Atendidos</span>
                <span className="kpi-mini-card__value">{data.kpis.reppos.positivacao}</span>
              </div>
              <div className="kpi-mini-card__row">
                <span className="kpi-mini-card__label">% da Positivação</span>
                {renderPercent(data.kpis.reppos.percentPos)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ── Tab Content: MSL ────────────────────────────────────────── */
  const renderMSL = () => {
    if (!data) return null;

    const mslData = mslType === 'RECKITT CORE' ? data.kpis.mslReckittCore : data.kpis.mslVestacy;

    if (!mslData || !mslData.clientes || mslData.clientes.length === 0) {
      return (
        <div className="coming-soon">
          <span className="coming-soon__icon">📥</span>
          <h3>Base de MSL não enviada</h3>
          <p>Envie a planilha de Clientes e Produtos MSL para {mslType} na aba de <strong>Configurações</strong>.</p>
        </div>
      );
    }

    return (
      <div className="msl-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Toggle Reckitt Core vs Vestacy */}
        <div className="msl-toggle-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '16px 24px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setMslType('RECKITT CORE')}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                background: mslType === 'RECKITT CORE' ? '#6366f1' : 'rgba(255,255,255,0.05)',
                color: '#fff',
                transition: 'all 0.2s'
              }}
            >
              🎯 Reckitt Core
            </button>
            <button
              onClick={() => setMslType('VESTACY')}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: 600,
                cursor: 'pointer',
                background: mslType === 'VESTACY' ? '#6366f1' : 'rgba(255,255,255,0.05)',
                color: '#fff',
                transition: 'all 0.2s'
              }}
            >
              🎯 Vestacy
            </button>
          </div>

          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>CLIENTES ELEGÍVEIS: </span>
              <strong style={{ color: '#fff', fontSize: '1.1rem' }}>{mslData.totalClientes}</strong>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>ATINGIMENTO GLOBAL: </span>
              <strong style={{ color: mslData.percentGlobal >= 70 ? '#10b981' : '#ef4444', fontSize: '1.1rem' }}>
                {mslData.realizadoGlobal}/{mslData.metaGlobal} ({mslData.percentGlobal.toFixed(1)}%)
              </strong>
            </div>
          </div>
        </div>

        {/* Tabela de Clientes MSL */}
        <div className="fornecedor-table-container">
          <table className="fornecedor-table">
            <thead>
              <tr>
                <th className="th-left">ID CLIENTE</th>
                <th className="th-left">RAZÃO SOCIAL / CLIENTE</th>
                <th className="th-left">SEGMENTO</th>
                <th>ITENS OBRIGATÓRIOS</th>
                <th>ITENS VÁLIDOS (≥3 UND)</th>
                <th>% ATINGIMENTO</th>
                <th>AÇÃO</th>
              </tr>
            </thead>
            <tbody>
              {mslData.clientes.map((cliente: any) => {
                const isExpanded = expandedClienteId === cliente.id_cliente;
                return (
                  <>
                    <tr
                      key={cliente.id_cliente}
                      onClick={() => setExpandedClienteId(isExpanded ? null : cliente.id_cliente)}
                      style={{ cursor: 'pointer', background: isExpanded ? 'rgba(99, 102, 241, 0.08)' : undefined }}
                    >
                      <td className="td-id">{cliente.id_cliente}</td>
                      <td className="td-nome">{cliente.cliente_nome}</td>
                      <td>
                        <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.08)', fontSize: '0.8rem', fontWeight: 600 }}>
                          {cliente.segmento}
                        </span>
                      </td>
                      <td className="td-number">{cliente.totalItens}</td>
                      <td className="td-number">{cliente.itensValidos}</td>
                      <td className="td-percent">{renderPercent(cliente.percent)}</td>
                      <td style={{ textAlign: 'center', color: '#6366f1', fontWeight: 600 }}>
                        {isExpanded ? '▲ Ocultar' : '▼ Ver Itens'}
                      </td>
                    </tr>

                    {/* Linha Expandida com Checklist de Produtos */}
                    {isExpanded && (
                      <tr key={`expanded-${cliente.id_cliente}`}>
                        <td colSpan={7} style={{ padding: '0', background: 'rgba(15, 23, 42, 0.6)' }}>
                          <div style={{ padding: '20px' }}>
                            <h4 style={{ color: '#f8fafc', marginBottom: '12px', fontSize: '0.95rem' }}>
                              📋 Checklist de Itens MSL ({cliente.segmento}) - Trimestre Móvel
                            </h4>

                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                                  <th style={{ textAlign: 'left', padding: '8px' }}>ID PRODUTO</th>
                                  <th style={{ textAlign: 'left', padding: '8px' }}>PRODUTO</th>
                                  <th style={{ textAlign: 'center', padding: '8px' }}>QTD TRIMESTRE</th>
                                  <th style={{ textAlign: 'center', padding: '8px' }}>STATUS (META ≥ 3)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {cliente.produtos.map((prod: any) => (
                                  <tr key={prod.id_produto} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                    <td style={{ padding: '8px', color: '#94a3b8' }}>{prod.id_produto}</td>
                                    <td style={{ padding: '8px', color: '#f8fafc', fontWeight: 500 }}>{prod.nome_produto}</td>
                                    <td style={{ padding: '8px', textAlign: 'center', fontWeight: 600 }}>{prod.qtdVendida} und</td>
                                    <td style={{ padding: '8px', textAlign: 'center' }}>
                                      {prod.statusValido ? (
                                        <span style={{ color: '#10b981', fontWeight: 600, background: 'rgba(16,185,129,0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                                          🟢 Válido ({prod.qtdVendida} und)
                                        </span>
                                      ) : (
                                        <span style={{ color: '#ef4444', fontWeight: 600, background: 'rgba(239,68,68,0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                                          🔴 Pendente (Faltam {prod.faltam} und)
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ── Tab Content: CLC Categorias ─────────────────────────────── */
  const renderCLC = () => {
    if (!data) return null;

    const clcData = data.kpis.clc;

    if (!clcData || !clcData.categorias || clcData.categorias.length === 0) {
      return (
        <div className="coming-soon">
          <span className="coming-soon__icon">📦</span>
          <h3>Base de Metas CLC não encontrada</h3>
          <p>Envie a planilha de <strong>CLC Categorias (Metas)</strong> na aba de <strong>Configurações</strong>.</p>
        </div>
      );
    }

    return (
      <div className="clc-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Banner Resumo de Atingimento CLC */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '20px 28px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '2.5rem' }}>📦</span>
            <div>
              <h3 style={{ color: '#f8fafc', fontSize: '1.2rem', fontWeight: 700 }}>Desempenho de Categorias CLC</h3>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Acompanhamento de metas e clientes positivados por categoria</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'uppercase' }}>CATEGORIAS BATIDAS</span>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>
                {clcData.batidas} <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 500 }}>de {clcData.total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de Categorias CLC */}
        <div className="fornecedor-table-container">
          <table className="fornecedor-table">
            <thead>
              <tr>
                <th className="th-left">CATEGORIA CLC</th>
                <th>META DE CLIENTES</th>
                <th>REALIZADO (CLIENTES)</th>
                <th>GAP</th>
                <th>PROGRESSO (%)</th>
                <th>STATUS</th>
                <th>AÇÃO</th>
              </tr>
            </thead>
            <tbody>
              {clcData.categorias.map((cat: any) => {
                const isBatida = cat.meta > 0 && cat.realizado >= cat.meta;
                const isExpanded = expandedCatName === cat.categoria;

                return (
                  <>
                    <tr
                      key={cat.categoria}
                      onClick={() => setExpandedCatName(isExpanded ? null : cat.categoria)}
                      style={{ cursor: 'pointer', background: isExpanded ? 'rgba(99, 102, 241, 0.08)' : undefined }}
                    >
                      <td className="td-nome" style={{ fontWeight: 700, color: '#f8fafc' }}>{cat.categoria}</td>
                      <td className="td-number">{cat.meta}</td>
                      <td className="td-number" style={{ fontWeight: 700, color: isBatida ? '#10b981' : '#f8fafc' }}>{cat.realizado}</td>
                      <td className="td-gap">{renderGap(cat.gap, false)}</td>
                      <td style={{ width: '220px', padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${Math.min(cat.percent, 100)}%`,
                                background: isBatida ? '#10b981' : '#6366f1',
                                borderRadius: '4px',
                                transition: 'width 0.5s ease'
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'right' }}>{cat.percent.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {isBatida ? (
                          <span style={{ color: '#10b981', fontWeight: 700, background: 'rgba(16,185,129,0.15)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem' }}>
                            🟢 BATIDA
                          </span>
                        ) : (
                          <span style={{ color: '#f59e0b', fontWeight: 600, background: 'rgba(245,158,11,0.15)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem' }}>
                            🟡 EM ANDAMENTO
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', color: '#6366f1', fontWeight: 600 }}>
                        {isExpanded ? '▲ Ocultar' : '▼ Ver Clientes'}
                      </td>
                    </tr>

                    {/* Linha Expandida com Lista de Clientes Positivados */}
                    {isExpanded && (
                      <tr key={`expanded-cat-${cat.categoria}`}>
                        <td colSpan={7} style={{ padding: '0', background: 'rgba(15, 23, 42, 0.6)' }}>
                          <div style={{ padding: '20px' }}>
                            <h4 style={{ color: '#f8fafc', marginBottom: '12px', fontSize: '0.95rem' }}>
                              👥 Clientes Positivados na Categoria: <strong>{cat.categoria}</strong> ({cat.clientes?.length || 0} clientes)
                            </h4>

                            {cat.clientes && cat.clientes.length > 0 ? (
                              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                <thead>
                                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8' }}>
                                    <th style={{ textAlign: 'left', padding: '8px' }}>ID CLIENTE</th>
                                    <th style={{ textAlign: 'left', padding: '8px' }}>RAZÃO SOCIAL / CLIENTE</th>
                                    <th style={{ textAlign: 'center', padding: '8px' }}>UNIDADES COMPRADAS</th>
                                    <th style={{ textAlign: 'right', padding: '8px' }}>VALOR TOTAL (R$)</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {cat.clientes.map((cli: any) => (
                                    <tr key={cli.id_cliente} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                      <td style={{ padding: '8px', color: '#94a3b8' }}>{cli.id_cliente}</td>
                                      <td style={{ padding: '8px', color: '#f8fafc', fontWeight: 500 }}>{cli.cliente_nome || `Cliente ${cli.id_cliente}`}</td>
                                      <td style={{ padding: '8px', textAlign: 'center', fontWeight: 600 }}>{cli.unidades} und</td>
                                      <td style={{ padding: '8px', textAlign: 'right', color: '#10b981', fontWeight: 600 }}>{formatMoney(cli.valor_total || 0)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>Nenhum cliente positivou esta categoria ainda neste período.</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ── Main Render ────────────────────────────────────────────── */

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Header />
        <div className="page-content vendedores-page">

          {/* Top: Vendor Selector + Filters */}
          <div className="vendedor-selector-row">
            <div className="vendedor-selector">
              <label>👤 Vendedor</label>
              <select
                value={selectedVendedor}
                onChange={(e) => setSelectedVendedor(e.target.value)}
              >
                <option value="">Selecione...</option>
                {vendedores.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.nome || `Vendedor ${v.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-bar">
              <div className="filter-bar__item">
                <label>Mês</label>
                <select value={selectedMes} onChange={(e) => setSelectedMes(e.target.value)}>
                  <option value="">Todos</option>
                  <option value="01">Janeiro</option>
                  <option value="02">Fevereiro</option>
                  <option value="03">Março</option>
                  <option value="04">Abril</option>
                  <option value="05">Maio</option>
                  <option value="06">Junho</option>
                  <option value="07">Julho</option>
                  <option value="08">Agosto</option>
                  <option value="09">Setembro</option>
                  <option value="10">Outubro</option>
                  <option value="11">Novembro</option>
                  <option value="12">Dezembro</option>
                </select>
              </div>
              <div className="filter-bar__item">
                <label>Dia</label>
                <select
                  value={selectedDia}
                  onChange={(e) => setSelectedDia(e.target.value)}
                  disabled={!selectedMes}
                >
                  <option value="">Todos</option>
                  {Array.from({ length: 31 }, (_, i) => {
                    const day = String(i + 1).padStart(2, '0');
                    return <option key={day} value={day}>{day}</option>;
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* Tab Bar */}
          <div className="tab-bar">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={`tab-bar__item ${selectedTab === tab.id ? 'tab-bar__item--active' : ''} ${!tab.active && tab.id !== 'resumo' ? 'tab-bar__item--disabled' : ''}`}
                onClick={() => setSelectedTab(tab.id)}
              >
                <span className="tab-bar__icon">{tab.icon}</span>
                <span className="tab-bar__label">{tab.label}</span>
                {!tab.active && tab.id !== 'resumo' && <span className="tab-bar__badge">Em breve</span>}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner" />
                <span>Carregando dados do vendedor...</span>
              </div>
            ) : !selectedVendedor ? (
              <div className="empty-state">
                <span className="empty-state__icon">👆</span>
                <span className="empty-state__text">Selecione um vendedor para visualizar os dados</span>
              </div>
            ) : selectedTab === 'resumo' ? (
              renderResumo()
            ) : selectedTab === 'msl' ? (
              renderMSL()
            ) : selectedTab === 'clc' ? (
              renderCLC()
            ) : (
              <div className="coming-soon">
                <span className="coming-soon__icon">🚧</span>
                <h3>Em Construção</h3>
                <p>Esta aba será implementada em breve. Fique ligado!</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
