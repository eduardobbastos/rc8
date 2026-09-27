# 10 Princípios Fundamentais de Segurança da Informação (Engenharia de Software & DevOps)

Este documento estabelece os **10 princípios fundamentais mais relevantes na atualidade** que integram Engenharia de Software (SE) e DevOps/DevSecOps na prevenção de injeções de código, erros de processo de desenvolvimento e vulnerabilidades operacionais, correlacionando-os diretamente com o conteúdo consolidado da [SKILL.md](./SKILL.md).

---

## Matriz dos 10 Princípios e Correlação com a SKILL

| # | Princípio de Segurança | Foco Tecnológico & Prevenção | Correlação Direta com a SKILL.md |
|---|---|---|---|
| **1** | **Validação Estrita de Entrada e Codificação de Saída por Padrão** *(Canonical Input Validation & Output Encoding)* | Prevenção contra injeções de código (SQLi, NoSQLi, Command Injection, XSS, LDAP, SSTI, Insecure Deserialization). Obrigatoriedade de Prepared Statements e Value Objects. | **ETAPA 1** (HC/BA), **ETAPA 8** (Adapter), **ETAPA 11** (Clean/Hexagonal Ports & Adapters) e **PARTE V** (Tabela de Risco - Item 1). |
| **2** | **Menor Privilégio e Segregação de Responsabilidades** *(Least Privilege & Separation of Duties)* | Processos, containers, serviços e identidades de banco operam com o mínimo de permissões necessárias. Prevenção contra escalada lateral e execução remota de código. | **ETAPA 13** (CQRS - segregação de comandos e consultas), **ETAPA 14** (DDD Bounded Context) e **PARTE V** (Tabela de Risco - Itens 6 e 8). |
| **3** | **Defesa em Profundidade e Zero Trust Architecture** *(Defense in Depth & Zero Trust)* | "Nunca confiar, sempre verificar". A segurança não depende apenas do perímetro; cada camada, componente e API autentica, autoriza e cifra individualmente. | **ETAPA 2** (Meta-Relação das 3 Camadas), **ETAPA 11** (Clean Architecture com Domínio Blindado) e **ETAPA 12** (EDA). |
| **4** | **Gestão Centralizada de Segredos e Credenciais Efêmeras** *(Zero Hardcoded Secrets & Secret Stores)* | Eliminação de segredos, senhas e chaves criptográficas embutidos no código-fonte, commits git ou artefatos. Rotação dinâmica de credenciais em tempo de execução. | **ETAPA 4** (Singleton mitigado), **ETAPA 9** (Dependency Injection injetando credenciais externas) e **PARTE III** (Persona Agente-Sec). |
| **5** | **Segurança Shift-Left e Automação DevSecOps** *(SSDLC & Automated Security Gates)* | Inclusão de SAST, DAST, linters de segurança e verificações de conformidade no início do ciclo de vida e nos pipelines de CI/CD automatizados. | **PARTE II** (Pseudo-algoritmo - PASSO 8 Continuidade), **PARTE III** (Agente-DevOps e Agente-Sec) e **PARTE VI** (Pitfall 5). |
| **6** | **Segurança da Cadeia de Suprimentos de Software** *(Software Supply Chain & Dependency Governance)* | Prevenção contra bibliotecas maliciosas, ataques de *dependency confusion*, pacotes desatualizados ou vulnerabilidades transitivas (SCA, SBOM, verificação de hashes/assinaturas). | **ETAPA 8** (Adapter isolando dependências de terceiros), **ETAPA 16** (Pragmatismo contra dependências desnecessárias) e **PARTE V** (Item 10). |
| **7** | **Falha Segura e Resiliência Operacional** *(Fail-Secure, Graceful Degradation & Default Deny)* | Em caso de erro, pane ou timeout, o sistema encerra no estado fechado (*deny by default*) sem vazar dados sensíveis, schemas ou stack traces para o usuário final. | **ETAPA 1** (HC/BA tratando falhas sem vazar infraestrutura), **ETAPA 12** (EDA com Dead Letter Queues) e **PARTE VI** (Pitfall 3). |
| **8** | **Observabilidade de Segurança, Tracing e Trilha de Auditoria Imutável** *(Security Observability & Immutable Audit Trail)* | Logs estruturados com contexto seguro (sem PII/segredos), rastreamento ponta a ponta com `trace_id` e auditoria não repudiável de ações críticas para detecção de fraudes. | **ETAPA 15** (Observabilidade Nativa: Logs, Métricas e Tracing), **ETAPA 12** (EDA com tracing distribuído) e **PARTE V** (Tabela de Risco - Itens 3 e 7). |
| **9** | **Governança de Código, Revisão Cruzada e Prevenção de Falhas de Processo** *(Four-Eyes Principle & Guardrails)* | Garantia de que nenhuma alteração atinja produção sem revisão por pares, políticas de proteção de branches e testes de segurança automatizados. | **PARTE III** (Personas com Conferência Cruzada obrigatória) e **PARTE VI** (Pitfall 2: Proibição de aprovação por agente único). |
| **10** | **Modelagem Contínua de Ameaças e Pragmatismo Arquitetural** *(Threat Modeling & Anti Over-Engineering)* | Identificação precoce de vetores de ataque aliada à simplicidade de design; arquiteturas desnecessariamente complexas ampliam a superfície de ataque e ocultam falhas. | **ETAPA 16** (Pragmatismo: quando evitar padrões desnecessários), **PARTE V** (Tabela de Risco - Itens 5 e 10) e **PARTE VI** (Pitfall 4). |

---

## Detalhamento dos 10 Princípios

### 1. Validação Estrita de Entrada e Codificação de Saída por Padrão
- **O que preconiza:** Qualquer dado vindo de fora (usuários, APIs externas, filas, banco) é considerado hostil. Deve ser validado via listas de permissão (*allowlists*), fortemente tipado em *Value Objects* e nunca concatenado diretamente em strings de comandos ou queries.
- **Tipos de Injeção Prevenidos:** SQL Injection, NoSQL Injection, Command Injection (OS), Cross-Site Scripting (XSS), LDAP Injection, Server-Side Template Injection (SSTI) e Desserialização Insegura.
- **Relação com a SKILL.md:**
  - Na [ETAPA 1 (HC/BA)](./SKILL.md#etapa-1--fundamento-alta-coesão-e-baixo-acoplamento-hcba) e na [ETAPA 11 (Clean Architecture)](./SKILL.md#etapa-11--clean-architecture--hexagonal-ports--adapters), a camada de domínio é purificada: quem faz a validação e sanitização é o *Port/Adapter* de entrada (Controller), impedindo que dados sujos atinjam a lógica de negócio.
  - O [Adapter (ETAPA 8)](./SKILL.md#etapa-8--adapter-gof--estrutural) que comunica com persistência obriga o uso de interfaces parametrizadas (Prepared Statements), eliminando o risco registrado no Item 1 da [PARTE V (Tabela de Risco)](./SKILL.md#parte-v--tabela-de-risco-de-segurança).

### 2. Menor Privilégio e Segregação de Responsabilidades
- **O que preconiza:** Serviços, módulos de execução, pipelines e credenciais de banco de dados devem ter apenas as permissões essenciais para sua tarefa imediata. O usuário de conexão com a base de dados não deve possuir privilégios de DDL (`DROP`, `ALTER`) em tempo de execução de aplicação.
- **Erros de Processo Prevenidos:** Serviços rodando como `root`/`admin`, escalada de privilégios após comprometimento de um único endpoint, e execução inadvertida de instruções destrutivas.
- **Relação com a SKILL.md:**
  - Na [ETAPA 13 (CQRS)](./SKILL.md#etapa-13--cqrs-command-query-responsibility-segregation), as rotinas de leitura (Query) e escrita (Command) são segregadas. O lado Query pode operar com credenciais de banco com acesso exclusivo de leitura (`SELECT`), enquanto o lado Command opera com permissões de gravação restritas, evitando modificações indevidas via fluxos de consulta (Item 8 da Tabela de Risco).
  - No [DDD Bounded Context (ETAPA 14)](./SKILL.md#etapa-14--ddd-bounded-context), impede que o módulo de Vendas acesse ou altere tabelas de Logística ou Financeiro diretamente.

### 3. Defesa em Profundidade e Zero Trust Architecture
- **O que preconiza:** Nenhuma camada presume que a camada anterior é segura. A segurança não confia cegamente na rede interna ("perímetro"). Requer autenticação contínua, autorização baseada em tokens (OAuth2/JWT com escopos precisos), mTLS entre microsserviços e validações locais de contrato.
- **Erros de Processo Prevenidos:** Falta de autorização em APIs internas que assumem que "por estarem na VPN/VPC não precisam de validação" (Broken Object Level Authorization - BOLA/BFLA).
- **Relação com a SKILL.md:**
  - A [ETAPA 2 (Meta-Relação)](./SKILL.md#etapa-2--meta-relação-como-os-padrões-se-organizam) define que as camadas interna (GoF/DI), externa (Clean/EDA/DDD) e operacional se protegem e se reforçam mutuamente.
  - Na [Clean Architecture (ETAPA 11)](./SKILL.md#etapa-11--clean-architecture--hexagonal-ports--adapters), as regras de dependência apontam sempre para o centro: mesmo que a interface Web seja burlada, as entidades centrais continuam validando invariantes de segurança.

### 4. Gestão Centralizada de Segredos e Credenciais Efêmeras
- **O que preconiza:** Proibição estrita de *hardcoded secrets*, tokens de API, certificados ou credenciais em código-fonte, repositórios git, variáveis estáticas ou imagens Docker. Utilização de gerenciadores de segredos (*Secret Stores*) com injeção em runtime e rotação automática de credenciais efêmeras.
- **Erros de Processo Prevenidos:** Vazamento de credenciais em repositórios públicos/privados, reaproveitamento de chaves entre ambientes de desenvolvimento e produção, e persistência descontrolada de senhas em branches.
- **Relação com a SKILL.md:**
  - Na [ETAPA 4 (Singleton)](./SKILL.md#etapa-4--singleton-gof--criacional), alerta-se que o uso indiscriminado de instâncias globais para manter estados e configurações sensíveis gera riscos de vazamento em memória e dificulta isolamento entre tenants.
  - A [Injeção de Dependências (ETAPA 9)](./SKILL.md#etapa-9--dependency-injection-di) é o mecanismo técnico pelo qual configurações e credenciais de infraestrutura são fornecidas pelo container de execução de forma desacoplada por ambiente (Dev, Staging, Prod), conforme avaliado pela persona **Agente-Sec** ([PARTE III - Personas](./SKILL.md#parte-iii--personas-dos-agentes)).

### 5. Segurança Shift-Left e Automação DevSecOps
- **O que preconiza:** A segurança é integrada desde a fase de escrita de código até o deploy contínuo (SSDLC). Linters de segurança, scanners SAST (análise estática), DAST (análise dinâmica) e gates de qualidade são executados a cada Pull Request e commit.
- **Erros de Processo Prevenidos:** Auditorias de segurança tardias (às vésperas do go-live), bypass de verificações obrigatórias e regressão de vulnerabilidades corrigidas anteriormente.
- **Relação com a SKILL.md:**
  - O [Pseudo-algoritmo de Execução (PARTE II)](./SKILL.md#parte-ii--skill-pseudo-algoritmo-de-execução), especialmente no **PASSO 8 (Continuidade)**, implementa o gatilho automático por commit/PR que compara métricas de qualidade e bloqueia o merge se houver regressão arquitetural ou de segurança maior que 10%.
  - O papel conjunto de **Agente-DevOps** e **Agente-Sec** ([PARTE III - Personas](./SKILL.md#parte-iii--personas-dos-agentes)) operacionaliza o gate de segurança dentro da esteira de CI/CD.

### 6. Segurança da Cadeia de Suprimentos de Software (Supply Chain Security)
- **O que preconiza:** Auditoria rigorosa de todas as dependências externas e transitivas através de ferramentas de SCA (*Software Composition Analysis*), bloqueio de versões com CVEs conhecidos, verificação de integridade via *lockfiles* (hashes criptográficos) e geração de SBOM (*Software Bill of Materials*).
- **Erros de Processo Prevenidos:** Ataques de *Dependency Confusion*, sequestro de pacotes (*typosquatting*), inclusão de bibliotecas com código malicioso embutido e uso de componentes descontinuados ou desatualizados.
- **Relação com a SKILL.md:**
  - Na [ETAPA 8 (Adapter)](./SKILL.md#etapa-8--adapter-gof--estrutural), o isolamento de SDKs e bibliotecas de terceiros através de adapters permite trocar uma biblioteca vulnerável por outra de forma rápida, sem impactar o código do domínio.
  - A [ETAPA 16 (Pragmatismo)](./SKILL.md#etapa-16--pragmatismo-quando-não-usar) combate o excesso de bibliotecas importadas para tarefas simples, reduzindo diretamente a superfície de ataque e o risco apontado no Item 10 da Tabela de Risco.

### 7. Falha Segura e Resiliência Operacional (Fail-Secure & Default Deny)
- **O que preconiza:** O comportamento do sistema mediante exceções, erros de conexão ou exaustão de recursos deve ser sempre o encerramento seguro (*fail-close* / *deny by default*). Respostas de erro expostas ao cliente nunca devem exibir stack traces, detalhes de queries SQL, nomes de servidores ou tecnologias internas.
- **Erros de Processo Prevenidos:** Vazamento de informações sensíveis via mensagens de erro (*Information Disclosure*), bypass de validações quando serviços de autenticação sofrem timeout, e efeito cascata de indisponibilidade.
- **Relação com a SKILL.md:**
  - Na [ETAPA 1 (HC/BA)](./SKILL.md#etapa-1--fundamento-alta-coesão-e-baixo-acoplamento-hcba) e na [ETAPA 3 (MVC)](./SKILL.md#etapa-3--mvc-modelviewcontroller), as camadas de controle interceptam exceções e traduzem erros para contratos seguros da View, impedindo que detalhes de infraestrutura vazem para o cliente.
  - Na [EDA (ETAPA 12)](./SKILL.md#etapa-12--event-driven-architecture-eda), eventos que falham não travam a fila: são direcionados para *Dead Letter Queues* (DLQ) para análise isolada sem expor ou interromper o fluxo operacional.

### 8. Observabilidade de Segurança, Tracing e Trilha de Auditoria Imutável
- **O que preconiza:** Registro de logs estruturados e correlacionados por identificadores universais (`trace_id`, `request_id`). Garantia de rastreabilidade de todas as ações sensíveis (autenticações, autorizações, movimentações financeiras) em trilhas de auditoria imutáveis, com mascaramento obrigatório de dados pessoais (LGPD/GDPR) e credenciais.
- **Erros de Processo Prevenidos:** Incidentes de segurança silenciosos que passam meses sem detecção, impossibilidade de conduzir análise forense pós-invasão e mascaramento inadequado que vaza senhas nos arquivos de log.
- **Relação com a SKILL.md:**
  - A [ETAPA 15 (Observabilidade Nativa)](./SKILL.md#etapa-15--observabilidade-nativa) estabelece os 3 pilares como parte contratual da arquitetura: log estruturado, métricas operacionais e tracing distribuído.
  - A [PARTE VI (Pitfall 3)](./SKILL.md#parte-vi--pitfalls-e-regras-imperativas) estipula como regra imperativa: *“Ausência de observabilidade = risco Crítico automático”*, pois sem tracing e logs não há como responder a incidentes ou realizar rollback seguro.

### 9. Governança de Código, Revisão Cruzada e Prevenção de Falhas de Processo
- **O que preconiza:** Aplicação do princípio de quatro olhos (*Four-Eyes Principle*): nenhum commit é mesclado diretamente na branch principal sem revisão por pares e aprovação formal. Branches protegidas, assinaturas digitais de commit (GPG/SSH) e trilha de aprovações em Pull Requests.
- **Erros de Processo Prevenidos:** Commits inadvertidos contendo códigos de teste/debug deixados em produção, alterações unilaterais não auditadas e introdução acidental de falhas lógicas graves.
- **Relação com a SKILL.md:**
  - A [PARTE III (Personas)](./SKILL.md#parte-iii--personas-dos-agentes) e a [PARTE VI (Pitfall 2)](./SKILL.md#parte-vi--pitfalls-e-regras-imperativas) determinam expressamente: *“Nunca aceite conclusão de um único agente sem conferência cruzada”*.
  - A interação balanceada entre **Agente-SE** (arquitetura), **Agente-DevOps** (operação), **Agente-Sec** (segurança) e **Agente-Prag** (viabilidade) reflete exatamente o processo de revisão cruzada multidisciplinar que evita pontos cegos.

### 10. Modelagem Contínua de Ameaças e Pragmatismo Arquitetural
- **O que preconiza:** A segurança é planejada desde o design arquitetural via modelagem de ameaças (metodologias como STRIDE, PASTA e OWASP Top 10), avaliando onde estão os ativos críticos e vetores de risco. Isso deve ser equilibrado com simplicidade: soluções com excesso de complexidade e engenharia desnecessária tornam o código ilegível, impossibilitam auditorias eficazes e criam vulnerabilidades acidentais.
- **Erros de Processo Prevenidos:** Segurança tratada como um adendo reativo após o código estar pronto; arquiteturas hiper-complexas que os desenvolvedores contornam (*workarounds*) por dificuldade de manutenção.
- **Relação com a SKILL.md:**
  - A [ETAPA 16 (Pragmatismo)](./SKILL.md#etapa-16--pragmatismo-quando-não-usar) ensina que a maturidade sênior reside em evitar padrões que não agregam valor. *Over-engineering* cria complexidade acidental que eleva a superfície de erro e dificulta a auditoria de segurança (Tabela de Risco, Item 5).
  - A [PARTE VII (Meta-Relação e Continuidade)](./SKILL.md#parte-vii--meta-relação-e-continuidade) resume essa sinergia: o contrato teórico orienta a arquitetura, a auditoria pragmática garante código limpo e a observabilidade valida a segurança contínua em produção.
