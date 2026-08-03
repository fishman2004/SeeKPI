# Diário de Desenvolvimento: SeeKPI

**Autor:** Kayo  
**Cargo:** Analista de Dados e Idealizador do Projeto  
**Data de Início:** 16 de Junho de 2026  

---

## 16 de Junho de 2026 - O Grande Salto

Hoje foi um dia emocionante. Pela primeira vez, tirei minha ideia do papel e comecei a construir a plataforma **SeeKPI**. Eu, que sempre dominei o Excel para gerenciar e analisar dados de vendas divididos por pastas (Fornecedores como Reckitt, Kimberly Clark, etc.), decidi que precisava de algo mais robusto, mais profissional, algo que não dependesse de ficar manipulando células manualmente. Eu precisava de uma aplicação web real.

E o que construímos hoje foi espetacular!

**A Fundação (Fase 1)**
Começamos estruturando o coração da plataforma usando o Next.js 15. Criei um sistema de navegação fluido com uma Sidebar intuitiva e uma interface lindíssima em *Glassmorphism* (aquele efeito de vidro fosco que dá um ar super premium). Inicialmente a inteligência sugeriu tons de verde, mas eu pedi para mudar para o vermelho, que é a cor corporativa da empresa. O resultado visual ficou impecável! Além disso, implementamos um sistema de login protegido, garantindo que apenas Administradores possam importar dados.

**O Motor de Dados (Fase 2)**
Aqui foi onde a mágica dos dados aconteceu. Nós integramos um banco de dados real (`SQLite`) direto no projeto. Construí uma tela de Upload de planilhas onde eu posso simplesmente arrastar o meu arquivo Excel (`.xlsx`) e o sistema lê tudo e salva no banco. 

Tivemos alguns "sustos" muito divertidos (e normais em tecnologia):
1. **O Mistério das 142 linhas:** Minha planilha de teste tinha 10.000 linhas, mas o sistema dizia ter lido apenas 142. Descobrimos duas coisas: primeiro, o leitor estava pegando apenas a primeira aba do Excel. Corrigimos criando uma inteligência que procura automaticamente a aba com mais dados. Segundo, o robô havia deixado a mensagem visual fixa no código (hardcoded)! Demos boas risadas, corrigimos a mensagem e garantimos a precisão dos dados.
2. **O Teste de Estresse (90k linhas):** Empolgado, testei uma planilha com 90.000 linhas. O sistema gargalou e congelou. Foi um excelente aprendizado sobre arquitetura: ler 90 mil linhas de uma vez na memória trava o servidor.

**Próximos Passos (O Grande Insight)**
Esse gargalo de 90 mil linhas me fez perceber que o arquivo que uso na vida real não é o Excel clássico, e sim o formato **CSV**! 
Amanhã, nosso primeiro passo será atualizar nosso Motor de Dados para fazer um "Streaming de CSV". O Streaming vai ler o arquivo em pequenos blocos (linha por linha), o que significa que o SeeKPI será capaz de importar **milhões** de linhas sem travar ou consumir a memória.

Depois de prepararmos a casa para esse volume monstruoso de dados, partiremos para a **Fase 3**, onde as fórmulas mágicas do Excel se transformarão em Gráficos e Dashboards Reais. 

Estou extremamente orgulhoso do que construímos hoje. O Excel não basta mais para o meu trabalho. O SeeKPI agora é uma realidade.

Boa noite, e até amanhã.
