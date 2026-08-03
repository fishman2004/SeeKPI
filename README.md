📊 SeeKPI — Plataforma de Acompanhamento de Vendas & KPIs
Documento de Projeto — Versão 1.0 — Junho 2026

🎯 Visão Geral
Item	Detalhe
Problema	Dados de vendas fragmentados em múltiplas planilhas Excel distribuídas por e-mail, dificultando o acesso rápido à informação por parte da equipe
Solução	Plataforma web responsiva com dashboards visuais, acesso por perfil (admin/gestão/vendedor), alimentada por upload de dados via Excel
Nome	SeeKPI — See Your Key Performance Indicators
Público-alvo	Equipe comercial: administradores, gerentes, supervisores e vendedores
🏗️ Stack Tecnológica
Camada	Tecnologia	Justificativa
Framework	Next.js 15 (React)	Full-stack, alta performance, deploy simples
Linguagem	TypeScript	Segurança de tipos, produtividade no desenvolvimento
Estilização	CSS Vanilla + variáveis CSS	Máxima flexibilidade, design premium
Banco de Dados	SQLite (migração futura para PostgreSQL)	Zero configuração, ideal para MVP
Processamento	SheetJS (xlsx)	Leitura nativa de arquivos .xlsx
Gráficos	Recharts	Visualizações animadas e responsivas
Autenticação	NextAuth.js	Login seguro com sistema de papéis
Mobile	PWA (Progressive Web App)	Instalável no celular, experiência nativa
👥 Estrutura de Acesso

Perfil	Visualização	Ações
Admin	Todos os dados, todas as pastas	Upload Excel, gerenciar usuários, definir metas, configurar sistema
Gerente	Consolidado de todos os supervisores	Dashboards consolidados, comparar equipes
Supervisor	Sua equipe (~40 vendedores)	Dashboard da equipe, comparar vendedores
Vendedor	Apenas seus dados individuais	Visualizar KPIs, simulador de pedidos
📈 KPIs Acompanhados
KPI	Descrição	Tipo
Vendas	Acompanhamento de vendas — meta vs realizado	Quantitativo
Positivações	Atendimentos e clientes visitados	Quantitativo
Reppos	Vendas no e-commerce	Qualitativo
Categorias	Vendas por categoria de produto	Qualitativo
MSL	Must-Stock List — cobertura de produtos por cliente	Qualitativo
PDV Premiado	Ranking das melhores redes e pontos de venda	Premiação
🏢 Estrutura Organizacional
Dimensão	Detalhe
Pastas	5 pastas (A até F) — cada uma com fornecedores específicos
Por pasta	~40 vendedores, 3 supervisores, 1 gerente
Hierarquia de metas	Vendedor → Supervisor (soma da equipe) → Gerente (soma dos supervisores)
Atualização	Diária
Fornecedores do Projeto (Fase Inicial)
ID	Fornecedor
16671	Reckitt Core
16677	Condor Limpeza
16814	Condor Beleza
17460	Condor Higiene
17696	Vestacy
19740	Kimberly Clark
📊 Estrutura de Dados (Base Excel)
A base de dados é alimentada por planilhas Excel com a seguinte estrutura de colunas:

Coluna	Descrição	Exemplo
ID RCA	Código do vendedor (até 3 dígitos)	108
Nome RCA	Nome do vendedor (Pasta-Rota-Nome)	E-ST-08- GABRIEL CAVALCANTE SILVA
Nome Supervisor	Nome do supervisor (Pasta-Rota-Nome)	E-ST (NATAN ABNER BEZERRA MEDEIROS)
Número Pedido	Identificador do pedido	569002459
Posição Pedido	Status: F(Faturado) B(Bloqueado) L(Liberado) M(Montado)	F
Data Pedido	Data no formato DD-MM-YYYY	16-06-2026
ID Cliente	Código do cliente (até 6 dígitos)	125377
Cliente	Razão social do cliente	ATACADÃO ALMIRANTE...
ID Produto	Código do produto (1-6 dígitos)	125636
Nome Produto	Descrição do produto	VEJA PERF CONCENTRADO 100ML...
ID Fornecedor	Código do fornecedor (até 6 dígitos)	16671
Nome Fornecedor	Nome do fornecedor	RECKITT CORE
Qtde Cx	Unidades por caixa	16
Qtde Und	Unidades vendidas	6
Valor	Valor da venda (R$)	R$ 21,24
Qtde Cx Vendida	Caixas vendidas (inteiro ou fracionado)	0,25
📋 Roadmap de Desenvolvimento
🔹 Fase 1 — Fundação
Setup do projeto, design system premium (tema escuro, glassmorphism, animações), layout principal com sidebar responsiva, tela de login e sistema de autenticação com 3 perfis.

🔹 Fase 2 — Motor de Dados
Upload de Excel com drag & drop, processamento automático, banco de dados SQLite, validação de dados, templates de planilha e histórico de uploads.

🔹 Fase 3 — Dashboards de KPIs
Dashboards interativos para cada KPI (Vendas, Positivações, Reppos, Categorias, MSL, PDV Premiado), filtros globais e visão hierárquica por perfil de acesso.

🔹 Fase 4 — Gamificação & Simulador
Simulador de pedidos com impacto visual no atingimento, barras de progresso gamificadas, sistema de badges/conquistas, leaderboard e notificações.

🔹 Fase 5 — Polish & Mobile
PWA completo com suporte offline, modo claro/escuro, exportação de dashboards (PDF/imagem), otimização de performance e deploy em produção.

🎨 Identidade Visual
Elemento	Especificação
Tema	Escuro com acentos vibrantes (vermelho corporativo)
Efeitos	Glassmorphism sutil, micro-animações
Tipografia	Inter (Google Fonts)
Responsividade	Desktop, tablet e mobile
Instalação	PWA — direto do navegador
SeeKPI — Transformando dados em decisões. 🚀
