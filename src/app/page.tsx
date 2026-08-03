'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar/Sidebar';
import Header from '@/components/Header/Header';
import KpiCard from '@/components/KpiCard/KpiCard';
import { useAuth } from '@/contexts/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import './dashboard.css';

// Colors for charts
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#3b82f6'];

// Funções auxiliares de formatação
const formatMoney = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('pt-BR').format(value);
};

const calcPercent = (realizado: number, meta: number) => {
  if (!meta || meta === 0) return 0;
  return (realizado / meta) * 100;
};

// Quick stats shown at the bottom of the dashboard
const quickStats = [
  { label: 'Total Vendedores', value: '124', icon: '👥' },
  { label: 'Pedidos Hoje', value: '387', icon: '📝' },
  { label: 'Faturamento do Dia', value: 'R$ 89.420', icon: '📊' },
];

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [kpiData, setKpiData] = useState<any[]>([]);
  const [chartsData, setChartsData] = useState<any>({
    clcByCategory: [],
    salesBySupervisor: [],
    pdvBreakdown: []
  });
  const [quickStats, setQuickStats] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [cardsVisible, setCardsVisible] = useState(false);
  const [isPageMounted, setIsPageMounted] = useState(false);

  // Filtros Globais
  const [selectedMes, setSelectedMes] = useState('');
  const [selectedDia, setSelectedDia] = useState('');

  useEffect(() => {
    setIsPageMounted(true);
  }, []);

  // Protect route
  useEffect(() => {
    if (!isLoading && isPageMounted) {
      if (!isAuthenticated) {
        router.push('/login');
      }
    }
  }, [isLoading, isAuthenticated, router, isPageMounted]);

  // Fetch KPI Data
  useEffect(() => {
    if (isAuthenticated) {
      setLoadingData(true);
      
      const params = new URLSearchParams();
      if (selectedMes) params.append('mes', selectedMes);
      if (selectedDia) params.append('dia', selectedDia);

      fetch(`/api/dashboard?${params.toString()}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            const kpis = data.data.kpis;
            const resDia = kpis.resumoDia || {};

            // Faturamento
            const fatPercent = calcPercent(kpis.faturamento.realizado, kpis.faturamento.meta);
            const fatGap = kpis.faturamento.realizado - kpis.faturamento.meta;
            const fatGapLabel = fatGap >= 0 ? `Superamos ${formatMoney(fatGap)}` : `Faltam ${formatMoney(Math.abs(fatGap))}`;
            
            // Positivação
            const posPercent = calcPercent(kpis.positivacao.realizado, kpis.positivacao.meta);
            const posGap = kpis.positivacao.realizado - kpis.positivacao.meta;
            const posGapLabel = posGap >= 0 ? `Superamos ${formatNumber(posGap)}` : `Faltam ${formatNumber(Math.abs(posGap))}`;

            // Reppos (% de Participação)
            const repposFatPercent = calcPercent(kpis.reppos.realizado, kpis.faturamento.realizado);
            const repposPosPercent = calcPercent(kpis.reppos.positivacao, kpis.positivacao.realizado);

            // PDV Premiado
            const totalDiamond = data.data.charts.pdvBreakdown.filter((x: any) => x.categoria_loja === 'DIAMOND').reduce((a: any,b: any) => a + b.total_lojas, 0);
            const totalGold = data.data.charts.pdvBreakdown.filter((x: any) => x.categoria_loja === 'GOLD').reduce((a: any,b: any) => a + b.total_lojas, 0);
            const pdvPercent = calcPercent(kpis.pdvPremiado.diamond + kpis.pdvPremiado.gold, totalDiamond + totalGold);

            setKpiData([
              {
                id: 'vendas', title: 'Faturamento Global', icon: '💰',
                currentValue: formatMoney(kpis.faturamento.realizado),
                targetValue: `Meta: ${formatMoney(kpis.faturamento.meta)}`,
                percentage: fatPercent, trend: fatPercent >= 100 ? 'up' : 'down',
                gapLabel: fatGapLabel, gapColor: fatGap >= 0 ? 'green' : 'red'
              },
              {
                id: 'positivacoes', title: 'Positivação Global', icon: '✅',
                currentValue: formatNumber(kpis.positivacao.realizado),
                targetValue: `Meta: ${formatNumber(kpis.positivacao.meta)} clientes`,
                percentage: posPercent, trend: posPercent >= 100 ? 'up' : 'down',
                gapLabel: posGapLabel, gapColor: posGap >= 0 ? 'green' : 'red'
              },
              {
                id: 'reppos', title: 'Reppos', icon: '🛒',
                currentValue: formatMoney(kpis.reppos.realizado),
                targetValue: `${repposFatPercent.toFixed(1)}% do Fat | ${repposPosPercent.toFixed(1)}% da Pos`,
                percentage: repposFatPercent, trend: 'up',
                gapLabel: 'Participação Geral', gapColor: 'green'
              },
              {
                id: 'categorias', title: 'CLC Categorias', icon: '📦',
                currentValue: `${kpis.clc.categoriasBatidas}`,
                targetValue: `Categorias Batidas (de ${kpis.clc.totalCategorias})`,
                percentage: calcPercent(kpis.clc.categoriasBatidas, kpis.clc.totalCategorias), trend: 'neutral'
              },
              {
                id: 'pdv-premiado', title: 'PDV Premiado', icon: '🏆',
                currentValue: `${kpis.pdvPremiado.diamond} Diamond | ${kpis.pdvPremiado.gold} Gold`,
                targetValue: `Atingiram (de ${totalDiamond} D | ${totalGold} G)`,
                percentage: pdvPercent, trend: pdvPercent >= 100 ? 'up' : 'down'
              }
            ]);

            setChartsData(data.data.charts);
            
            const dateLabel = (selectedDia && selectedMes) ? `${selectedDia}/${selectedMes}` : (selectedMes ? `Mês ${selectedMes}` : 'Hoje');

            setQuickStats([
              { label: `Vendedores Ativos (${dateLabel})`, value: `${resDia.vendedoresAtivos || 0} (Faltam ${resDia.vendedoresFaltam || 0})`, icon: '👥' },
              { label: `Pedidos (${dateLabel}) / Total`, value: `${resDia.pedidosHoje || 0} / ${resDia.pedidosTotal || 0}`, icon: '📝' },
              { label: `Faturamento do Dia (${dateLabel})`, value: formatMoney(resDia.faturamentoHoje || 0), icon: '📊' },
              { label: `Fornecedor Destaque (${dateLabel})`, value: resDia.fornecedorDestaque || 'N/A', icon: '🌟' },
              { label: `Região Destaque (${dateLabel})`, value: resDia.pracaMaisPositivou || 'N/A', icon: '📍' },
            ]);
          }
          setLoadingData(false);
          // Trigger stagger animations after data load
          setTimeout(() => setCardsVisible(true), 100);
        })
        .catch(err => {
          console.error('Failed to load KPIs', err);
          setLoadingData(false);
        });
    }
  }, [isAuthenticated, selectedMes, selectedDia]);

  // Show nothing while checking auth state
  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Header />
        <div className="page-content">
          
          {/* Global Filters */}
          <div className="filters-container glass-card" style={{ padding: '15px', marginBottom: '20px', borderRadius: '12px', display: 'flex', gap: '15px', alignItems: 'center' }}>
            <span style={{ color: 'white', fontWeight: 'bold' }}>Filtros:</span>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Mês</label>
              <select 
                value={selectedMes} 
                onChange={(e) => setSelectedMes(e.target.value)}
                style={{ background: '#1e1e2d', color: 'white', border: '1px solid #333', padding: '6px 12px', borderRadius: '6px' }}
              >
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Dia</label>
              <select 
                value={selectedDia} 
                onChange={(e) => setSelectedDia(e.target.value)}
                style={{ background: '#1e1e2d', color: 'white', border: '1px solid #333', padding: '6px 12px', borderRadius: '6px' }}
                disabled={!selectedMes}
              >
                <option value="">Todos</option>
                {Array.from({ length: 31 }, (_, i) => {
                  const day = String(i + 1).padStart(2, '0');
                  return <option key={day} value={day}>{day}</option>;
                })}
              </select>
            </div>
            
            {(!selectedMes && selectedDia) && <span style={{ color: 'var(--danger)', fontSize: '12px' }}>Selecione um mês primeiro</span>}
          </div>

          {/* KPI Summary Cards Grid */}
          <section className="kpi-grid">
            {loadingData ? (
              <div style={{ color: 'white', padding: '20px' }}>Carregando dados...</div>
            ) : (
              kpiData.map((kpi, index) => (
                <div
                  key={kpi.id}
                  className={`kpi-card-wrapper ${cardsVisible ? 'visible' : ''}`}
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <KpiCard
                    title={kpi.title}
                    currentValue={kpi.currentValue}
                    targetValue={kpi.targetValue}
                    percentage={kpi.percentage}
                    icon={kpi.icon}
                    trend={kpi.trend}
                    gapLabel={kpi.gapLabel}
                    gapColor={kpi.gapColor}
                  />
                </div>
              ))
            )}
          </section>

          {/* Overview Section - Charts */}
          <section className="overview-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '30px' }}>
            
            {/* Chart 1: Vendas por Canal */}
            <div className="glass-card" style={{ padding: '20px', borderRadius: '16px' }}>
              <h3 style={{ color: 'white', marginBottom: '20px' }}>Faturamento por Canal e Região</h3>
              <div style={{ width: '100%', height: 300 }}>
                {loadingData ? (
                  <div style={{ color: 'white' }}>Carregando...</div>
                ) : (
                  <ResponsiveContainer>
                    <BarChart data={chartsData.salesBySupervisor} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" horizontal={true} vertical={false} />
                      <XAxis type="number" stroke="#ffffff60" tickFormatter={(value) => `R$ ${value / 1000}k`} />
                      <YAxis dataKey="name" type="category" width={140} stroke="#ffffff60" style={{ fontSize: '11px' }} />
                      <RechartsTooltip 
                        formatter={(value: number) => formatMoney(value)}
                        contentStyle={{ backgroundColor: '#1e1e2d', borderColor: '#333', color: 'white' }} 
                      />
                      <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Chart 2: CLC Categories */}
            <div className="glass-card" style={{ padding: '20px', borderRadius: '16px' }}>
              <h3 style={{ color: 'white', marginBottom: '20px' }}>Positivação por Categoria (CLC)</h3>
              <div style={{ width: '100%', height: 300 }}>
                {loadingData ? (
                  <div style={{ color: 'white' }}>Carregando...</div>
                ) : (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={chartsData.clcByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartsData.clcByCategory.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ backgroundColor: '#1e1e2d', borderColor: '#333', color: 'white' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

          </section>

          {/* Quick Stats Row */}
          <section className="quick-stats-row" style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            {quickStats.map((stat) => (
              <div key={stat.label} className="quick-stat-card glass-card" style={{ padding: '15px', borderRadius: '12px', display: 'flex', alignItems: 'center' }}>
                <span className="quick-stat-icon" style={{ fontSize: '1.8rem', marginRight: '15px' }}>{stat.icon}</span>
                <div className="quick-stat-info" style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="quick-stat-value" style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>{stat.value}</span>
                  <span className="quick-stat-label" style={{ fontSize: '0.8rem', opacity: 0.7, color: '#e2e8f0' }}>{stat.label}</span>
                </div>
              </div>
            ))}
          </section>
        </div>
      </main>
    </div>
  );
}
