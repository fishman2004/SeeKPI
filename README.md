# 📊 SeeKPI — Plataforma de Acompanhamento de Vendas & KPIs

> **Documento do Projeto**  
> **Versão:** 1.0  
> **Data:** Junho/2026

---

# 🎯 Visão Geral

| Item | Detalhe |
|------|---------|
| **Problema** | Dados de vendas fragmentados em múltiplas planilhas Excel distribuídas por e-mail, dificultando o acesso rápido às informações pela equipe comercial. |
| **Solução** | Plataforma web responsiva com dashboards interativos, controle de acesso por perfil e alimentação dos dados através de upload de planilhas Excel. |
| **Nome** | **SeeKPI — See Your Key Performance Indicators** |
| **Público-alvo** | Administradores, gerentes, supervisores e vendedores. |

---

# 🏗️ Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|---------|------------|---------------|
| **Framework** | Next.js 15 (React) | Full-stack moderno, alta performance e deploy simplificado |
| **Linguagem** | TypeScript | Segurança de tipos e maior produtividade |
| **Estilização** | CSS Vanilla + CSS Variables | Flexibilidade máxima e design premium |
| **Banco de Dados** | SQLite *(migração futura para PostgreSQL)* | Simples para MVP e sem configuração complexa |
| **Processamento Excel** | SheetJS (xlsx) | Leitura nativa de arquivos `.xlsx` |
| **Gráficos** | Recharts | Dashboards responsivos e animados |
| **Autenticação** | NextAuth.js | Login seguro com controle de permissões |
| **Mobile** | Progressive Web App (PWA) | Aplicação instalável e experiência próxima ao nativo |

---

# 👥 Estrutura de Acesso

| Perfil | Visualização | Permissões |
|---------|--------------|------------|
| 👑 **Administrador** | Todos os dados | Upload de planilhas, gerenciamento de usuários, definição de metas e configurações do sistema |
| 📊 **Gerente** | Todos os supervisores | Dashboards consolidados e comparação entre equipes |
| 👥 **Supervisor** | Sua equipe (~40 vendedores) | Dashboard da equipe e comparação entre vendedores |
| 🛒 **Vendedor** | Apenas seus dados | Consulta de KPIs individuais e simulador de pedidos |

---

# 📈 KPIs Monitorados

| KPI | Descrição | Categoria |
|-----|-----------|-----------|
| 💰 Vendas | Meta x Realizado | Quantitativo |
| 🛍️ Positivações | Clientes atendidos e positivados | Quantitativo |
| 🌐 Reppos | Performance no e-commerce | Qualitativo |
| 📦 Categorias | Vendas por categoria de produto | Qualitativo |
| ✅ MSL | Must-Stock List (Cobertura de Mix) | Qualitativo |
| 🏆 PDV Premiado | Ranking das melhores lojas e redes | Premiação |

---

# 🏢 Estrutura Organizacional

| Item | Detalhe |
|------|---------|
| **Pastas** | 5 Pastas (A até F), cada uma representando um grupo de fornecedores |
| **Estrutura** | ~40 vendedores • 3 supervisores • 1 gerente |
| **Hierarquia** | Vendedor → Supervisor → Gerente |
| **Atualização dos Dados** | Diária |

---

# 🏭 Fornecedores (Fase Inicial)

| ID | Fornecedor |
|----|------------|
| 16671 | Reckitt Core |
| 16677 | Condor Limpeza |
| 16814 | Condor Beleza |
| 17460 | Condor Higiene |
| 17696 | Vestacy |
| 19740 | Kimberly Clark |

---

# 📄 Estrutura da Base de Dados (Excel)

A aplicação recebe uma planilha Excel contendo os seguintes campos:

| Coluna | Descrição | Exemplo |
|--------|-----------|----------|
| ID RCA | Código do vendedor | 108 |
| Nome RCA | Nome completo do vendedor | E-ST-08- GABRIEL CAVALCANTE SILVA |
| Nome Supervisor | Supervisor responsável | E-ST (NATAN ABNER BEZERRA MEDEIROS) |
| Número Pedido | Identificador do pedido | 569002459 |
| Posição Pedido | Status do pedido (F, B, L ou M) | F |
| Data Pedido | Data do pedido | 16-06-2026 |
| ID Cliente | Código do cliente | 125377 |
| Cliente | Razão Social | ATACADÃO ALMIRANTE... |
| ID Produto | Código do produto | 125636 |
| Nome Produto | Descrição do produto | VEJA PERF CONCENTRADO 100ML... |
| ID Fornecedor | Código do fornecedor | 16671 |
| Nome Fornecedor | Nome do fornecedor | RECKITT CORE |
| Qtde Cx | Quantidade por caixa | 16 |
| Qtde Und | Quantidade em unidades | 6 |
| Valor | Valor vendido | R$ 21,24 |
| Qtde Cx Vendida | Quantidade de caixas vendidas | 0,25 |

---

# 🚀 Roadmap

## 🔹 Fase 1 — Fundação

- Setup do projeto
- Design System premium
- Tema escuro
- Glassmorphism
- Sidebar responsiva
- Tela de Login
- Sistema de autenticação
- Controle de acesso por perfil

---

## 🔹 Fase 2 — Motor de Dados

- Upload de Excel via Drag & Drop
- Processamento automático
- Persistência em SQLite
- Validação dos dados
- Templates de planilha
- Histórico de uploads

---

## 🔹 Fase 3 — Dashboards

Desenvolvimento dos dashboards para:

- 💰 Vendas
- 🛍️ Positivações
- 🌐 Reppos
- 📦 Categorias
- ✅ MSL
- 🏆 PDV Premiado

Incluindo:

- Filtros globais
- Comparativos
- Visão hierárquica conforme perfil de acesso

---

## 🔹 Fase 4 — Gamificação

- Simulador de Pedidos
- Barras de progresso
- Sistema de Badges
- Leaderboard
- Notificações de desempenho

---

## 🔹 Fase 5 — Polish & Mobile

- Progressive Web App (PWA)
- Suporte Offline
- Tema Claro / Escuro
- Exportação em PDF e Imagem
- Otimização de Performance
- Deploy em Produção

---

# 🎨 Identidade Visual

| Elemento | Especificação |
|----------|---------------|
| **Tema** | Escuro com detalhes em vermelho corporativo |
| **Estilo** | Glassmorphism elegante |
| **Animações** | Microinterações suaves |
| **Experiência** | Interface moderna, limpa e responsiva |

---

# 🎯 Objetivo do Projeto

O **SeeKPI** tem como objetivo centralizar todos os indicadores comerciais em uma única plataforma moderna, permitindo que vendedores, supervisores, gerentes e administradores acompanhem seus resultados em tempo real através de dashboards intuitivos, reduzindo a dependência de planilhas e aumentando a velocidade na tomada de decisão.
Tipografia	Inter (Google Fonts)
Responsividade	Desktop, tablet e mobile
Instalação	PWA — direto do navegador
SeeKPI — Transformando dados em decisões. 🚀
