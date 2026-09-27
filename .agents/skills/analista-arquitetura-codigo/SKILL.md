---
name: analista-arquitetura-codigo
version: 2.1
description: >
  Skill consolidada para agentes de IA avaliarem aderência de código-fonte
  aos princípios de alta coesão, baixo acoplamento, MVC, GoF, DI, MVVM,
  Clean/Hexagonal, EDA, CQRS, DDD, Observabilidade e Pragmatismo.
  Inclui artigo técnico completo de referência, pseudo-algoritmo de execução,
  personas de agentes com conferência cruzada, modelo de relatório e tabela
  de risco de segurança.
  Artigo de referência: https://github.com/eduardobbastos/estudos-engenharia-ti/blob/main/README.md
---

# SKILL — Analista de Arquitetura de Código (v2.1)

> **Como usar esta skill:**
> 1. Leia o **Artigo Técnico** (PARTE I) — referência conceitual completa.
> 2. Execute o **Pseudo-algoritmo** (PARTE II) sobre o codebase alvo.
> 3. Assuma as **Personas** (PARTE III) para conferência cruzada.
> 4. Produza o **Relatório** (PARTES IV e V) com evidências citadas.

---

## PARTE I — ARTIGO TÉCNICO DE REFERÊNCIA

---

### ETAPA 1 — Fundamento: Alta Coesão e Baixo Acoplamento (HC/BA)

**Definição central:**
- **Alta coesão (HC):** cada módulo tem uma única responsabilidade, clara e relacionada. Tudo que está dentro dele pertence ali.
- **Baixo acoplamento (BA):** módulos dependem minimamente uns dos outros; quando dependem, fazem isso por contratos abstratos, não por implementações concretas.

**Por que HC/BA é o critério-raiz:**
HC/BA não é mais um padrão na lista — é o objetivo que justifica todos os outros. MVC, GoF, DI, MVVM, Clean/Hex, EDA, CQRS e DDD são mecanismos que, cada um em sua camada, tentam preservar ou restaurar alta coesão e baixo acoplamento quando o sistema cresce.

**Exemplo estrutural:** Módulo `CalcularFrete` contém apenas regras de frete (alta coesão) e recebe dados via interface abstrata, sem conhecer banco ou framework (baixo acoplamento). Qualquer módulo que mistura cálculo de frete com envio de notificação e acesso ao banco viola ambos os critérios simultaneamente.

| Aspecto | Detalhe |
|---|---|
| Contexto | Todo módulo em qualquer sistema, em qualquer linguagem |
| Aplicabilidade | Manutenção, testes, evolução, refatoração segura |
| Impacto de não adotar | Mudanças locais quebram partes distantes; testes exigem o ambiente completo; a equipe tem medo de modificar código antigo |
| Visão SE | HC/BA é o critério de qualidade que guia todas as escolhas arquiteturais; sem ele, nenhum padrão tem base |
| Visão DevOps | Sem baixo acoplamento não é possível escalar, atualizar ou fazer rollback de partes do sistema de forma independente |

---

### ETAPA 2 — Meta-Relação: Como os Padrões se Organizam

Os padrões e arquiteturas deste artigo operam em três camadas complementares. Nenhuma substitui a outra — elas se reforçam.

| Camada | Elementos | Propósito |
|---|---|---|
| **Interna — mecanismos** | MVC, Singleton, Factory, Observer, Strategy, Adapter, DI | Estruturar responsabilidades e dependências dentro de um processo |
| **Externa — arquiteturas** | MVVM, Clean/Hexagonal, EDA, CQRS, DDD Bounded Context | Escalar esses mecanismos para sistemas distribuídos e domínios complexos |
| **Operacional** | Observabilidade, Pragmatismo | Garantir que a arquitetura sobreviva à operação real e não vire over-engineering |

**A meta-relação é circular:** o objetivo arquitetural (coerência, flexibilidade, sustentabilidade) guia a escolha dos mecanismos; os mecanismos reforçam o objetivo; a operação valida se a teoria gerou valor real.

---

### ETAPA 3 — MVC (Model–View–Controller)

- **Sigla:** MVC
- **Definição:** Separa a aplicação em três camadas: Model (dados e regras de negócio), View (apresentação), Controller (coordenação de entrada e fluxo).
- **Contexto:** Aplicações interativas — web, desktop, mobile — onde a interface muda com frequência independentemente das regras.
- **Aplicabilidade:** Quando a lógica de negócio precisa ser independente da interface; quando testes de regras não devem depender de framework ou banco.
- **Exemplo estrutural:** `Pedido` (Model) contém as regras de desconto e validação; `TelaPedido` (View) renderiza os dados; `PedidoController` recebe a requisição HTTP, chama o Model e devolve a resposta para a View. Nenhuma camada conhece os detalhes internos das outras além do contrato de interface.
- **Impacto de não adotar:** A interface fica acoplada à lógica de negócio; qualquer mudança na UI exige alteração nas regras; testes tornam-se impossíveis sem banco e framework completos.
- **Visão SE:** MVC é a base da separação de responsabilidades; sem ele, o código se torna uma massa indiferenciada de apresentação e lógica.
- **Visão DevOps:** Sem MVC com separação real, é impossível fazer deploy independente da View — toda atualização de frontend requer reimplantar o backend.

---

### ETAPA 4 — Singleton (GoF — Criacional)

- **Definição:** Garante uma única instância de uma classe e oferece um ponto de acesso global a ela.
- **Contexto:** Estado compartilhado que deve ser único — configuração global, pool de conexões, log centralizado.
- **Aplicabilidade:** Apenas quando a duplicação de instância quebra a consistência do sistema; em todos os outros casos, prefira DI.
- **Exemplo estrutural:** `Configuracao.getInstancia()` retorna o mesmo objeto em todos os módulos; duplicar a instância causaria divergência de configuração em tempo de execução.
- **Impacto de não adotar:** Múltiplas instâncias de configuração causam comportamento inconsistente; testes ficam não determinísticos porque o estado persiste entre execuções.
- **Visão SE:** Singleton cria acoplamento global disfarçado; usar com cautela e apenas onde DI não resolve o problema.
- **Visão DevOps:** Em ambientes containerizados, a instância global pode ser compartilhada entre processos de forma indesejada; Singleton dificulta testes isolados e deploy independente.

---

### ETAPA 5 — Factory Method (GoF — Criacional)

- **Definição:** Define uma interface para criar objetos; subclasses ou implementações decidem qual classe concreta instanciar.
- **Contexto:** Quando o tipo exato do objeto só é conhecido em tempo de execução — relatórios, notificações, conexões, parsers.
- **Aplicabilidade:** Relatórios (PDF/CSV), notificações (email/SMS), conexões (PostgreSQL/Redis). Não use quando a criação é direta e imutável — ver Pragmatismo.
- **Exemplo estrutural:** `RelatorioFactory.criar(tipo)` retorna `RelatorioPDF` ou `RelatorioCSV`; o Controller solicita um relatório sem conhecer qual implementação será usada.
- **Impacto de não adotar:** Código cliente fica acoplado a classes concretas; trocar a implementação exige modificar todos os pontos de criação espalhados pelo sistema.
- **Visão SE:** Factory isola a lógica de criação e mantém a coesão do cliente — ele não precisa saber como criar, apenas o que pedir.
- **Visão DevOps:** Trocar implementação (CSV local para CSV em nuvem) não exige alterar o cliente — o deploy da mudança é isolado e seguro.

---

### ETAPA 6 — Observer (GoF — Comportamental)

- **Definição:** Dependência um-para-muitos; quando um objeto muda de estado, todos os seus dependentes são notificados e atualizados automaticamente.
- **Contexto:** Eventos de interface, notificações de mudança de estado, sincronização entre camadas no MVC.
- **Aplicabilidade:** MVC reativo, sistemas de eventos internos, qualquer situação onde múltiplos módulos precisam reagir a uma mesma mudança.
- **Exemplo estrutural:** Quando o estoque muda no Model, View e Controller são notificados automaticamente via Observer; o Model não conhece os detalhes dos observadores — apenas que existem e que devem ser notificados.
- **Impacto de não adotar:** Cada mudança de estado exige chamadas manuais para todos os módulos interessados; o código fica acoplado e propenso a falhas de sincronização quando um módulo é esquecido.
- **Visão SE:** Observer reduz o acoplamento entre a fonte de eventos e seus consumidores; é a base do MVC reativo.
- **Visão DevOps:** Sem Observer, mudanças de estado não são rastreáveis de forma uniforme; o tracing distribuído fica incompleto porque eventos não têm um ponto central de emissão.

---

### ETAPA 7 — Strategy (GoF — Comportamental)

- **Definição:** Encapsula uma família de algoritmos em classes separadas e os torna intercambiáveis dentro do mesmo contexto.
- **Contexto:** Cálculos variáveis — desconto, frete, impostos, autenticação — que mudam conforme contexto, cliente ou configuração.
- **Aplicabilidade:** Quando a lógica de cálculo varia mas a estrutura do módulo que a usa permanece a mesma. Não use para variação única e estática — ver Pragmatismo.
- **Exemplo estrutural:** `Pedido` recebe `EstrategiaFrete` via construtor; para frete padrão usa `FretePadrao`; para frete expresso, substitui por `FreteExpresso` sem modificar `Pedido`. O contexto depende apenas da abstração `EstrategiaFrete`, nunca das implementações.
- **Impacto de não adotar:** Cada nova regra de cálculo exige modificar o módulo principal, aumentando acoplamento e risco de regressão em funcionalidades não relacionadas.
- **Visão SE:** Strategy mantém o módulo coeso (responsabilidade única) e permite variação de comportamento sem alteração interna.
- **Visão DevOps:** Trocar uma estratégia (ex: nova regra de frete em promoção) pode ser feito via configuração ou deploy isolado, sem alterar o serviço principal.

---

### ETAPA 8 — Adapter (GoF — Estrutural)

- **Definição:** Traduz a interface de uma classe existente para outra interface esperada pelo cliente, permitindo que trabalhem juntos sem acoplamento direto.
- **Contexto:** Integração com sistemas legados, APIs de terceiros, bibliotecas com contratos incompatíveis com o domínio.
- **Aplicabilidade:** Quando o cliente e o serviço externo têm interfaces incompatíveis. Não use quando as interfaces já são compatíveis — ver Pragmatismo.
- **Exemplo estrutural:** O domínio usa `IPagamento`; `AdapterStripe` implementa `IPagamento` e traduz chamadas para a API REST do Stripe; Controller e Model nunca conhecem o Stripe — apenas o contrato `IPagamento`.
- **Impacto de não adotar:** O cliente fica acoplado aos detalhes do serviço externo; trocar o provedor de pagamento exige reescrever o cliente, não apenas o adapter.
- **Visão SE:** Adapter protege o domínio de detalhes externos e preserva a coesão — o domínio não precisa saber como o Stripe funciona.
- **Visão DevOps:** Trocar provedor externo (Stripe → PayPal) exige apenas deploy do adapter — o serviço cliente não é tocado, sem risco de regressão.

---

### ETAPA 9 — Dependency Injection (DI)

- **Sigla:** DI — Inversão de Controle (IoC)
- **Definição:** Componentes recebem suas dependências de um container ou construtor externo, dependendo apenas de abstrações, nunca de implementações concretas.
- **Contexto:** Todo lugar onde um componente precisa de outro — Controllers, Models, Strategies, Adapters.
- **Aplicabilidade:** Base para frameworks modernos e para testes automatizados. DI é o mecanismo que torna todos os outros padrões eficazes.
- **Exemplo estrutural:** `PedidoController` recebe `IPedidoService` via construtor; o container de DI injeta `PedidoServiceProducao` em produção e `PedidoServiceMock` em testes. O Controller nunca sabe qual implementação recebeu.
- **Impacto de não adotar:** Componentes criam suas dependências diretamente (`new`); testes exigem inicializar o sistema inteiro; trocar implementações exige modificar código-fonte, não configuração.
- **Visão SE:** DI é a base do baixo acoplamento em nível de código; sem ela, todos os outros padrões perdem eficácia porque o acoplamento retorna via criação direta.
- **Visão DevOps:** DI permite configurar implementações por ambiente — mock em testes, real em produção, stub em staging — sem alterar código; deploy seguro e previsível.

---

### ETAPA 10 — MVVM (Model–View–ViewModel)

- **Sigla:** MVVM
- **Definição:** A ViewModel atua como mediador entre Model e View; expõe dados observáveis e ações; a View é declarativa e sem conhecimento direto do Model. O Controller pesado do MVC é substituído por uma ViewModel focada.
- **Contexto:** Aplicações frontend ricas — React, Vue, Angular, WPF — onde a coordenação de entrada cresce além do que um Controller simples pode gerir sem perder coesão.
- **Aplicabilidade:** Quando a interface precisa de reatividade declarativa, estado local complexo e testes isolados da camada de apresentação.
- **Exemplo estrutural:** `ListaDePedidos` (View) renderiza componentes reativos; `PedidoViewModel` expõe `pedidos: Observable[]` e `confirmar(id)`; `Pedido` (Model) armazena regras. A ViewModel usa DI para receber o Model; Observer conecta mudanças do Model à View sem que a View conheça o Model.
- **Relação com MVC/GoF/DI:** Evolui o Controller do MVC para um mediador declarativo e testável; usa DI e Observer como mecanismos internos.
- **Impacto de não adotar:** Interface acoplada diretamente ao Model; testes da View exigem o Model completo; mudanças de UI exigem alterar o Controller.
- **Visão SE:** MVVM escala o MVC para frontends complexos sem perder a separação de responsabilidades; a ViewModel é coesa por definição.
- **Visão DevOps:** Deploy independente do frontend (View + ViewModel) sem reimplantar o backend (Model) — reduz o risco operacional de cada atualização de interface.

---

### ETAPA 11 — Clean Architecture / Hexagonal (Ports & Adapters)

- **Sigla:** Clean Architecture (Robert C. Martin) / HPA — Hexagonal Ports and Adapters (Alistair Cockburn)
- **Definição:** O domínio — entidades e regras de negócio — fica no centro da aplicação, independente de frameworks, bancos ou interfaces. Ports definem os contratos; adapters conectam o domínio ao mundo externo. Todas as dependências apontam para dentro, nunca para fora.
- **Contexto:** Sistemas de longa vida, alta testabilidade, necessidade de trocar banco, framework ou interface sem reescrever regras.
- **Aplicabilidade:** Quando o Model do MVC cresce e precisa ser isolado de detalhes técnicos; quando a troca de infraestrutura é um requisito real ou provável.
- **Exemplo estrutural:** O domínio define `Pedido.calcularTotal()` e o port `IPedidoRepository`; o adapter PostgreSQL implementa `IPedidoRepository`; o adapter HTTP (Controller) recebe requisições e delega ao domínio. O domínio não conhece SQL, HTTP ou framework — apenas suas próprias regras e os contratos dos ports. DI conecta adapters ao domínio.
- **Relação com MVC/GoF/DI:** Amplia o isolamento do Model para uma arquitetura completa; usa Adapter (GoF) como mecanismo de conexão; DI conecta ports e adapters sem acoplamento direto.
- **Impacto de não adotar:** Troca de banco exige reescrever regras de negócio; testes do domínio exigem infraestrutura real; cada deploy de infraestrutura arrasta o domínio junto.
- **Visão SE:** Clean/Hex é a evolução do MVC para sistemas complexos; preserva a alta coesão do domínio de forma estrutural.
- **Visão DevOps:** Ao trocar infraestrutura (PostgreSQL → MongoDB), apenas o adapter muda — o domínio nunca é reimplantado por razões técnicas.

---

### ETAPA 12 — Event-Driven Architecture (EDA)

- **Sigla:** EDA
- **Definição:** Componentes comunicam-se por eventos assíncronos publicados em um broker (Kafka, RabbitMQ, EventBridge); produtores publicam fatos; consumidores reagem de forma independente. Nenhum componente conhece os outros diretamente.
- **Contexto:** Microserviços, fluxos assíncronos, alta escalabilidade, auditoria, sistemas onde a resposta imediata não é obrigatória.
- **Aplicabilidade:** Quando serviços precisam escalar e evoluir de forma independente; quando uma falha não deve propagar para toda a cadeia.
- **Exemplo estrutural:** Serviço `Vendas` publica `PedidoConfirmado` no broker; `Estoque` consome e reserva itens; `Notificacao` envia e-mail; `Financeiro` registra a transação. Nenhum serviço conhece os outros — todos dependem apenas do contrato do evento `PedidoConfirmado`. Cada serviço tem uma única responsabilidade; o baixo acoplamento é preservado em nível de rede.
- **Relação com MVC/GoF/DI:** Evolui o Observer (GoF) de intra-processo para inter-processo; substitui chamadas HTTP síncronas entre serviços por contratos de evento; usa DI para injetar produtores e consumidores.
- **Impacto de não adotar:** Serviços ficam acoplados por chamadas HTTP diretas; falha de um serviço derruba a cadeia inteira; escalabilidade fica bloqueada pela coordenação síncrona.
- **Visão SE:** EDA escala o Observer para sistemas distribuídos, mantendo o baixo acoplamento em nível de arquitetura.
- **Visão DevOps:** EDA exige observabilidade nativa — cada evento deve carregar `trace_id`; sem isso, eventos perdidos ou duplicados tornam-se invisíveis em produção.

---

### ETAPA 13 — CQRS (Command Query Responsibility Segregation)

- **Sigla:** CQRS
- **Definição:** Separa modelos, lógica e armazenamento de escrita (commands) dos de leitura (queries). Cada lado é otimizado, escalado e mantido de forma independente. Não é obrigatório usar bancos separados — pode ser o mesmo banco com esquemas ou permissões diferentes.
- **Contexto:** Sistemas onde a leitura é muito maior que a escrita, ou onde o modelo de consulta diverge significativamente do modelo de transação.
- **Aplicabilidade:** Catálogos, dashboards, históricos, sistemas de alta escala com padrões de acesso assimétricos.
- **Exemplo estrutural:** `ConfirmarPedido` (command) atualiza `pedidos` e publica `PedidoConfirmado`; `HistoricoCliente` (query) lê `clientes_historico`, tabela denormalizada otimizada para busca por período. Nenhuma operação mistura os dois modelos; o command tem responsabilidade de escrever corretamente; a query tem responsabilidade de ler eficientemente.
- **Relação com MVC/GoF/DI:** Divide o Model do MVC em dois modelos coesos especializados; usa Strategy para trocar implementações de persistência; DI injeta o repositório correto conforme a operação.
- **Impacto de não adotar:** Um único modelo serve leitura e escrita; otimizações para consulta degradam a consistência da escrita; a estrutura de dados limita a escalabilidade.
- **Visão SE:** CQRS divide o Model em dois modelos coesos — cada um com uma única responsabilidade bem definida.
- **Visão DevOps:** Permite escalar leitura e escrita de forma independente — escalonamento automático de queries em picos sem afetar a consistência dos comandos.

---

### ETAPA 14 — DDD: Bounded Context

- **Sigla:** DDD (Domain-Driven Design) — conceito-chave: Bounded Context
- **Definição:** Fronteira explícita dentro da qual um modelo de domínio é consistente e coeso. Termos como "Pedido" têm significado único e preciso dentro do contexto; fora dele, o mesmo termo pode ter estrutura e regras completamente diferentes. Contextos se comunicam por eventos (EDA) ou APIs explícitas, nunca por modelos compartilhados.
- **Contexto:** Sistemas complexos com múltiplas equipes; base para desenhar microserviços com fronteiras corretas, evitando tanto nano-serviços (muito pequenos e acoplados) quanto macros (muito grandes e confusos).
- **Aplicabilidade:** Quando o domínio cresce além de uma única equipe; quando conceitos do negócio têm significados diferentes em áreas distintas.
- **Exemplo estrutural:** No contexto `Vendas`, `Pedido` tem `item`, `quantidade` e `total` e segue regras de desconto. No contexto `Logistica`, `Pedido` tem `peso`, `dimensoes` e `destino` e segue regras de roteirização. Cada contexto tem seu próprio Model coeso; não compartilham classes. A comunicação ocorre via `PedidoConfirmado` (evento EDA); Adapter implementa a integração; DI injeta os adaptadores.
- **Relação com MVC/GoF/DI:** Garante alta coesão do Model ao definir fronteiras explícitas; usa Adapter e EDA para integrar contextos sem acoplamento conceitual.
- **Impacto de não adotar:** O domínio cresce sem fronteiras; conceitos de áreas diferentes se misturam no mesmo Model; microserviços são extraídos com fronteiras erradas, criando acoplamento distribuído.
- **Visão SE:** Bounded Context é a evolução da coesão do Model para sistemas grandes — cada contexto é um Model coeso e autônomo.
- **Visão DevOps:** Sem Bounded Context, deploy e rollback de uma área afetam áreas não relacionadas; não é possível evoluir serviços de forma verdadeiramente independente.

---

### ETAPA 15 — Observabilidade Nativa

- **Definição:** Projetar como o sistema se comporta sob falha, não apenas como é construído. Observabilidade não é um anexo — nasce com a arquitetura. Três pilares: logs estruturados, métricas e tracing distribuído.
- **Contexto:** Produção, sistemas distribuídos, EDA, microserviços; qualquer sistema que opera além de uma única máquina ou equipe.
- **Aplicabilidade:** Obrigatória em qualquer sistema com CI/CD automatizado ou com EDA.

**Os três pilares:**

| Pilar | O que registra | Exemplo concreto |
|---|---|---|
| Logs estruturados | Cada evento com contexto completo | `{"request_id":"x","contexto":"Vendas","evento":"PedidoConfirmado","timestamp":"..."}` |
| Métricas | Saúde operacional por componente | Tempo de resposta por adapter, taxa de erro por strategy, latência por contexto DDD |
| Tracing distribuído | Caminho completo de um evento entre serviços | `trace_id` que segue do produtor EDA ao consumidor, sem que os serviços se conheçam |

**Aplicação direta ao artigo:**
- Cada adapter (Clean/Hex) deve expor uma métrica de saúde.
- Cada evento (EDA) deve carregar um `trace_id` propagado pela cadeia inteira.
- Cada estratégia (Strategy) deve registrar o tempo de execução.
- Nenhuma camada (MVC, MVVM, CQRS) deve ocultar o que está acontecendo — a coesão do código não justifica a opacidade da operação.

- **Impacto de não adotar:** Falhas em produção são invisíveis; debugging distribuído é impossível; rollback de versões não pode ser avaliado com segurança; resposta a incidentes é bloqueada.
- **Visão SE:** Observabilidade é parte do contrato arquitetural — sem ela, a arquitetura está incompleta, independente de quantos padrões foram aplicados.
- **Visão DevOps:** Sem observabilidade não há CI/CD seguro; deploy automático sem métricas de saúde é risco operacional inaceitável.

---

### ETAPA 16 — Pragmatismo (Quando Não Usar)

- **Definição:** A maturidade sênior se prova não pelo padrão usado, mas pelo padrão evitado quando não agrega valor. A simplicidade robusta vence a complexidade elegante.

**Regras:**

| Padrão | Quando NÃO usar |
|---|---|
| Factory | Quando a criação é direta e imutável (ex: uma constante de configuração simples) |
| Singleton | Quando o estado pode ser injetado — DI é sempre preferível; Singleton é acoplamento global disfarçado |
| Strategy | Quando a variação é única e estática — um bloco condicional claro é mais coeso que uma árvore de classes |
| Adapter | Quando o sistema externo já fala a mesma interface — uma camada de tradução sem razão aumenta acoplamento, não o reduz |
| EDA / CQRS / DDD | Para sistemas simples com equipe pequena — a complexidade arquitetural deve pagar pelo benefício operacional |

- **Impacto de não adotar o pragmatismo:** Complexidade acidental aumenta o acoplamento; código difícil de navegar e auditar; manutenção aumenta; a equipe tem medo de modificar porque não entende por que o padrão existe.
- **Visão SE:** Pragmatismo preserva a coesão real — a elegância sem propósito destrói a arquitetura ao aumentar a complexidade acidental.
- **Visão DevOps:** Over-engineering aumenta o tempo de deploy, o custo de infraestrutura e o risco de falha; sistemas simples bem construídos operam melhor que sistemas complexos mal justificados.

---

### ETAPA 17 — Relação Cruzada Completa

| Elemento | Sigla | Como preserva coesão | Como reduz acoplamento | Impacto se não adotado | Visão SE | Visão DevOps |
|---|---|---|---|---|---|---|
| HC/BA | HC/BA | Módulo único responsável | Depende apenas de contratos | Mudança quebra sistema; medo de refatorar | Critério-raiz de qualidade | Operação bloqueada sem separação |
| MVC | MVC | Camadas com responsabilidade separada | Controller isola View e Model | Interface acoplada à lógica; testes impossíveis | Base arquitetural interna | Deploy independente de camada |
| Singleton | — | Estado único sem duplicação | Acesso centralizado (risco global) | Estado inconsistente; testes não determinísticos | Usar com cautela; preferir DI | Problemas em container e escala |
| Factory | — | Criação isolada do cliente | Cliente não conhece a classe concreta | Trocar implementação exige modificar a fonte | Isola lógica de criação | Troca segura e isolada por ambiente |
| Observer | — | Notificação focada no evento | Fonte não conhece os observadores | Sincronização manual; falhas de atualização | Reduz acoplamento de eventos | Base para tracing de eventos |
| Strategy | — | Algoritmo coeso e trocável | Contexto depende apenas de abstração | Regra nova exige modificar o módulo principal | Variação sem alteração interna | Deploy isolado de estratégia |
| Adapter | — | Conversão isolada em uma classe | Cliente e serviço externo não se conhecem | Troca de provedor exige reescrever o cliente | Protege domínio de detalhes externos | Troca de infraestrutura segura |
| DI | DI | Componentes recebem apenas o necessário | Nenhum componente cria dependências diretamente | Testes exigem sistema completo; troca requer código | Base de todo baixo acoplamento | Configuração por ambiente sem alterar código |
| MVVM | MVVM | ViewModel coesa; View declarativa | View não conhece o Model | Controller pesado; testes de UI complexos | Escala MVC para frontends reativos | Deploy independente de frontend |
| Clean/Hex | Clean/HPA | Domínio coeso no centro | Domínio independente de framework e banco | Troca de banco exige reescrever regras | Evolução estrutural do MVC | Troca de infraestrutura sem tocar domínio |
| EDA | EDA | Cada serviço com responsabilidade única | Serviços não se conhecem; dependem de contratos de evento | Falha de um derruba todos; escalabilidade bloqueada | Escala Observer para distribuído | Observabilidade nativa essencial |
| CQRS | CQRS | Modelo de comando coeso; modelo de query coeso | Escrita e leitura independentes | Modelo único limita otimização e escalabilidade | Divide Model em dois especializados | Escalonamento independente por operação |
| DDD Context | DDD | Modelo coeso dentro de fronteiras explícitas | Contextos não compartilham modelos diretamente | Domínio cresce sem controle; fronteiras erradas | Coesão do domínio em sistemas grandes | Deploy independente por contexto de negócio |
| Observabilidade | — | Sistema se conhece sob falha | Nenhum componente oculta falha | Falhas invisíveis; rollback sem base de avaliação | Parte do contrato arquitetural | Requisito para CI/CD seguro |
| Pragmatismo | — | Complexidade sempre justificada | Nenhum padrão usado sem propósito claro | Over-engineering aumenta acoplamento acidental | Maturidade arquitetural | Operação simples, custo baixo |

---

### ETAPA 18 — Conclusão

Alta coesão e baixo acoplamento não são princípios abstratos — são critérios operacionais que guiam desde a estrutura interna de um módulo (HC/BA, MVC, GoF, DI) até a arquitetura distribuída (MVVM, Clean/Hex, EDA, CQRS, DDD) e a operação real (Observabilidade, Pragmatismo). Cada padrão opera em sua camada; nenhum substitui o outro — eles se complementam.

A meta-relação é circular e intencional: o objetivo arquitetural (coerência, flexibilidade, sustentabilidade) guia a escolha dos mecanismos; os mecanismos reforçam o objetivo; a operação observável valida se a teoria gerou valor real. Quando a teoria está completa mas a operação falha, o gargalo não está no conhecimento técnico — está nos pontos cegos operacionais que impedem o código de gerar valor.

---

## PARTE II — SKILL: PSEUDO-ALGORITMO DE EXECUÇÃO

O pseudo-algoritmo abaixo é a sequência operacional que transforma o artigo
em avaliação concreta de um codebase. Execute passo a passo, sem pular etapas.
Cite evidências do código em cada resultado registrado.

```
SKILL analista-arquitetura-codigo v2.1
REFERENCIA: https://github.com/eduardobbastos/estudos-engenharia-ti/blob/main/README.md

=========================================================================
ENTRADA: <caminho-do-repositorio> ou <lista-de-arquivos>
SAIDA:   Relatorio (3 paragrafos) + Tabela de risco de segurança
=========================================================================

-------------------------------------------------------------------------
PASSO 1 — INVENTARIO
Agente: Agente-SE
-------------------------------------------------------------------------

  LISTE todos os arquivos do repositorio com path relativo
  IDENTIFIQUE:
    - Linguagem predominante
    - Framework(s) utilizados
    - Banco(s) de dados
    - Container / orquestracao (Docker, Kubernetes, etc.)
  CLASSIFIQUE a organizacao geral como:
    - Monolito | Modular | Microservico | Hibrido
  REGISTRE: contagem de arquivos por camada de responsabilidade
            (apresentacao, dominio, infraestrutura, testes, config)

-------------------------------------------------------------------------
PASSO 2 — COESAO E ACOPLAMENTO
Agente: Agente-SE
Referencia: ETAPAS 1 e 3 do artigo
-------------------------------------------------------------------------

  PARA CADA arquivo do inventario:

    // --- Coesão ---
    CONTE quantas responsabilidades distintas o arquivo tem
    SE responsabilidades > 1:
      MARQUE como baixa coesao
      REGISTRE evidencia (nome da classe / funcao com linha aproximada)
      EXEMPLO: "OrderService.java: calcula frete, envia email, persiste no banco"

    // --- Acoplamento ---
    LISTE todas as dependencias do arquivo (imports, chamadas, new)
    PARA CADA dependencia:
      SE dependencia e para classe concreta (nao interface ou abstracao):
        MARQUE como acoplamento direto
        REGISTRE evidencia e nivel de risco

  CONFRONTE com ETAPA 1 do artigo:
    - Alta coesao presente?       [SIM | NAO | PARCIAL] — evidencia: [...]
    - Baixo acoplamento presente? [SIM | NAO | PARCIAL] — evidencia: [...]

  CALCULE:
    - % de arquivos com alta coesao
    - % de arquivos com baixo acoplamento

-------------------------------------------------------------------------
PASSO 3 — MODELO ARQUITETURAL
Agente: Agente-SE
Referencia: ETAPAS 3, 10, 11, 12, 13, 14 do artigo
-------------------------------------------------------------------------

  IDENTIFIQUE qual(is) modelo(s) arquiteturais estao presentes:
    [ ] MVC       — ha separacao em Model, View, Controller?
    [ ] MVVM      — ha ViewModel mediando entre Model e View?
    [ ] Clean/Hex — ha ports/adapters isolando o dominio do framework?
    [ ] EDA       — ha broker de eventos assincronos entre componentes?
    [ ] CQRS      — ha separacao explicita de Command e Query?
    [ ] DDD       — ha Bounded Contexts com fronteiras definidas?

  PARA CADA modelo identificado:
    VERIFIQUE aderencia conforme a ETAPA correspondente do artigo
    REGISTRE aderencia percentual: [0 a 100]%
    REGISTRE violacoes com evidencia no codigo

  PARA CADA modelo ausente que deveria estar presente:
    REGISTRE o gap e o impacto conforme a tabela da ETAPA 17

-------------------------------------------------------------------------
PASSO 4 — PADROES GOF, DI E PRAGMATISMO
Agentes: Agente-SE + Agente-Prag
Referencia: ETAPAS 4 a 9 (padroes) e ETAPA 16 (pragmatismo)
-------------------------------------------------------------------------

  VERIFIQUE cada padrao da lista:
    [ ] Singleton  — ha instancia global unica?
                     E necessaria ou DI resolveria?
    [ ] Factory    — criacao esta isolada?
                     Ou o cliente cria objetos diretamente (new)?
    [ ] Observer   — mudancas de estado notificam dependentes desacoplados?
    [ ] Strategy   — algoritmos variaveis encapsulados e trocaveis?
    [ ] Adapter    — integracoes externas passam por adaptador?
    [ ] DI         — dependencias injetadas via construtor ou container?

  PARA CADA padrao identificado:
    VERIFIQUE se agrega valor real ao contexto (ETAPA 16 — Pragmatismo)
    SE padrao presente SEM necessidade justificada:
      MARQUE como over-engineering
      REGISTRE evidencia
      APLIQUE reducao de 5% no percentual de aderencia por ocorrencia

  CLASSIFIQUE risco por padrao ausente ou mal-aplicado:
    - DI ausente em ponto critico      -> risco: ALTO
    - Singleton sem controle           -> risco: MEDIO
    - Factory para objeto unico        -> risco: BAIXO (over-engineering)
    - Strategy para caso unico         -> risco: BAIXO (over-engineering)
    - Adapter entre interfaces iguais  -> risco: BAIXO (over-engineering)

-------------------------------------------------------------------------
PASSO 5 — DEVOPS E OBSERVABILIDADE
Agente: Agente-DevOps
Referencia: ETAPA 15 do artigo
-------------------------------------------------------------------------

  VERIFIQUE CI/CD:
    [ ] Ha pipeline configurado (GitHub Actions, GitLab CI, Jenkins)?
    [ ] Ha testes automatizados (unitarios, integracao, contrato)?
    [ ] Deploy e independente por camada ou servico?
    [ ] Ha mecanismo de rollback automatizado?

  VERIFIQUE os tres pilares de Observabilidade (ETAPA 15):
    [ ] Logs estruturados com request_id, trace_id, timestamp?
    [ ] Metricas por adapter, strategy, contexto DDD?
    [ ] Tracing distribuido propagado do produtor ao consumidor (EDA)?
    [ ] Nenhuma camada oculta erros ou falhas silenciosas?

  REGRAS AUTOMATICAS:
    SE ausencia de logs estruturados:
      CLASSIFIQUE automaticamente: risco CRITICO
      MOTIVO: falhas de seguranca ficam invisiveis; resposta a incidentes bloqueada

    SE ha EDA sem tracing distribuido (trace_id ausente nos eventos):
      CLASSIFIQUE automaticamente: risco CRITICO
      MOTIVO: eventos perdidos ou duplicados; audit trail incompleto

  CALCULE percentual de aderencia operacional: [0 a 100]%

-------------------------------------------------------------------------
PASSO 6 — CONFERENCIA CRUZADA
Agentes: Todos
-------------------------------------------------------------------------

  Agente-SE       : apresenta resultados dos PASSOS 1 a 4
  Agente-DevOps   : apresenta resultados do PASSO 5
  Agente-Sec      : revisa a tabela de risco
                    — evidencias estao citadas com localizacao no codigo?
                    — gravidades seguem os criterios do artigo?
                    — ha riscos novos nao cobertos pela tabela padrao?
  Agente-Prag     : revisa PASSO 4
                    — cada padrao tem justificativa real de uso?
                    — algum padrao esta presente so por convencao?
                    — o custo de manutencao do padrao supera o beneficio?

  SE ha divergencia entre agentes:
    Agente-Prag decide com base no artigo (ETAPAS 1 a 18)
    REGISTRE: a divergencia, a perspectiva de cada agente e a decisao tomada

-------------------------------------------------------------------------
PASSO 7 — RELATORIO FINAL
Agentes: Todos — Agente-Prag consolida
-------------------------------------------------------------------------

  PRODUZA: texto corrido (3 paragrafos conforme PARTE IV)
  PRODUZA: tabela de risco preenchida (conforme PARTE V)
  REGISTRE percentuais de aderencia por camada:
    - Apresentacao  (MVC / MVVM):                     [Y]%
    - Dominio       (Clean/Hex, DDD, CQRS):           [Z]%
    - Infraestrutura/Operacao (EDA, Obs, CI/CD):      [W]%

-------------------------------------------------------------------------
PASSO 8 — CONTINUIDADE
-------------------------------------------------------------------------

  TRIGGER: a cada commit, pull request ou deploy significativo
    REEXECUTE PASSOS 1 a 7
    COMPARE percentuais com a avaliacao anterior
    ATUALIZE tabela de risco

    SE regressao detectada (qualquer percentual caiu > 10%):
      BLOQUEIE merge automaticamente
      EXIJA resolucao das evidencias registradas antes de prosseguir
```

---

## PARTE III — PERSONAS DOS AGENTES

| Persona | Nome | Função principal | O que confere especificamente |
|---|---|---|---|
| Analista SE | **Agente-SE** | Avalia coesão, acoplamento, arquitetura, patterns | Se o código segue MVC, Clean, EDA, CQRS, DDD conforme ETAPAS 3–14 |
| Analista DevOps | **Agente-DevOps** | Avalia observabilidade, CI/CD, deploy, risco operacional | Se há logs, métricas, tracing, automação e rollback (ETAPA 15) |
| Auditor de Segurança | **Agente-Sec** | Avalia risco e impacto de segurança | Se a tabela de risco tem evidências, gravidades corretas e cobre todos os gaps |
| Revisor Pragmático | **Agente-Prag** | Confere over-engineering; decide divergências | Se cada padrão tem justificativa real (ETAPA 16); consolida o relatório final |

**Regra fundamental:** Nunca aceite a conclusão de um único agente sem conferência cruzada — cada perspectiva (SE, DevOps, Segurança, Pragmatismo) enxerga dimensões diferentes do mesmo problema.

---

## PARTE IV — MODELO DE RELATÓRIO

> Substitua os campos entre colchetes com dados reais do sistema analisado.
> O relatório deve ser objetivo, citar evidências e referenciar as ETAPAs do artigo.

**Parágrafo 1 — Arquitetura e Coesão/Acoplamento:**
O sistema analisado opera sob a tecnologia predominante **[linguagem/framework]** e organiza-se como **[monolito / modular / microserviço / híbrido]**; a aderência ao modelo arquitetural previsto no artigo é de **[Y]%** na camada de apresentação, **[Z]%** no domínio e **[W]%** na infraestrutura. Os princípios de alta coesão e baixo acoplamento estão **[plenamente / parcialmente / ausentes]**: **[evidência de coesão alta — ex: módulo X tem responsabilidade única]** demonstra coesão preservada, enquanto **[evidência de acoplamento direto — ex: Controller Y instancia diretamente o banco]** revela acoplamento residual entre **[camada A]** e **[camada B]**, violando o contrato de separação estabelecido pelo MVC e pela Clean Architecture (ETAPAS 3 e 11).

**Parágrafo 2 — Padrões e Organização Técnica:**
No que se refere às tecnologias e sua organização, a predominância de **[framework]** impõe uma estrutura **[descreva]** que se opõe ao modelo proposto no artigo no nível **[especifique]**: enquanto o artigo propõe **[padrão/arquitetura — ex: ports/adapters]**, o código adota **[prática alternativa — ex: acesso direto ao banco no Controller]**, resultando em **[impacto concreto]**. Os padrões GoF e DI estão presentes em **[percentual]%** dos módulos analisados: Singleton aplicado de forma **[correta / excessiva]**; Factory isolando criação em **[módulos]**; Strategy permitindo troca de algoritmos em **[contextos]**; Adapter protegendo integrações em **[pontos]**; DI conectando componentes em **[nível]**. A ausência de **[padrão]** em **[camada]** aumenta o risco de regressão e limita a escalabilidade independente (ETAPAS 4–9).

**Parágrafo 3 — Segurança e Continuidade:**
Do ponto de vista da segurança da informação, o nível de risco consolidado é **[baixo / médio / alto / crítico]** devido a **[fatores principais: acoplamento excessivo que impede rollback independente / falta de observabilidade que oculta falhas / over-engineering que aumenta superfície de ataque / ausência de Bounded Context que expõe domínios sensíveis]**. A continuidade no processo de desenvolvimento exige que **[ações prioritárias: introduzir DI nos pontos de acoplamento direto / implementar logs estruturados e tracing / extrair bounded contexts / substituir Singleton por DI / automatizar testes por adapter]** sejam priorizadas no backlog para que a arquitetura sustente tanto a evolução funcional quanto a operação segura em produção (ETAPAS 9, 14, 15).

---

## PARTE V — TABELA DE RISCO DE SEGURANÇA

> Use como referência e complemente com evidências reais do sistema analisado.

| Elemento Analisado | Evidência Típica | Gravidade | Impacto de Segurança | Ação Recomendada |
|---|---|---|---|---|
| Acoplamento direto entre camadas | Controller chama SQL diretamente; Model importa framework | **Alto** | Falha em uma camada expõe dados sensíveis; rollback impossível de isolar | Introduzir Adapter + DI entre Controller e banco |
| Coesão baixa (múltiplas responsabilidades) | Classe `Pedido` calcula frete, envia notificação e persiste no banco | **Médio** | Superfície de ataque ampliada; mudança em uma função afeta outras | Extrair responsabilidades em módulos coesos e independentes |
| Ausência de Observabilidade | Nenhum log estruturado, métrica ou trace_id nos eventos | **Crítico** | Falhas de segurança invisíveis; resposta a incidentes bloqueada | Implementar logs estruturados, métricas e tracing em todos os eventos |
| Singleton global sem controle | Estado compartilhado não injetado; testes não determinísticos | **Médio** | Estado corrompido pode ser explorado por múltiplos processos | Substituir Singleton por DI configurável por ambiente |
| Over-engineering (padrão sem propósito) | Factory para constantes; Strategy para cálculo que nunca varia | **Baixo-Médio** | Complexidade aumenta a superfície de erro; código difícil de auditar | Simplificar; remover padrão onde não há benefício real |
| Falta de Bounded Context | Modelo `Pedido` mistura regras de Vendas e Logística | **Alto** | Exposição cruzada de dados; acesso não autorizado a domínio alheio | Definir fronteiras explícitas; comunicar por eventos entre contextos |
| EDA sem tracing distribuído | Eventos publicados sem `trace_id` ou sem confirmação | **Crítico** | Eventos perdidos ou duplicados; audit trail incompleto; fraude indetectável | Adicionar `trace_id` a todos os eventos; implementar confirmação de entrega |
| CQRS sem separação de acesso | Command e Query usam mesmo repositório com permissões idênticas | **Médio** | Escrita acidental via query; falta de controle diferenciado | Separar repositórios; definir permissões por tipo de operação |
| DI ausente em pontos críticos | Controller instancia dependências diretamente (`new ServiceConcreto()`) | **Alto** | Troca de implementação exige alterar código-fonte; deploy arriscado | Injetar todas as dependências via construtor ou container |
| Pragmatismo ignorado | Adapter entre interfaces idênticas; Factory para objeto único imutável | **Baixo** | Custo de manutenção aumenta sem benefício arquitetural | Auditar cada padrão; remover onde não agrega coesão ou reduz acoplamento |

---

## PARTE VI — PITFALLS E REGRAS IMPERATIVAS

Regras que **nunca** devem ser violadas durante a execução desta skill:

1. **Confronte evidências com o artigo antes de classificar risco** — conclusões sem citação da ETAPA correspondente são especulação e geram falsos positivos. Diga "conforme ETAPA X".

2. **Nunca aceite conclusão de um único agente** — a conferência cruzada existe porque SE, DevOps, Segurança e Pragmatismo enxergam dimensões diferentes do mesmo problema. Sem conferência, o viés de uma perspectiva domina.

3. **Ausência de observabilidade = risco Crítico, automático** — sem logs estruturados e tracing, rollback e resposta a incidentes são impossíveis de executar com segurança. Não há negociação neste ponto.

4. **Padrão presente sem justificativa = over-engineering registrado** — se um padrão existe mas não serve a uma responsabilidade coesa do módulo, registre, documente a evidência e reduza o percentual de aderência. Complexidade acidental é um risco arquitetural.

5. **A avaliação não é pontual — é contínua** — o pseudo-algoritmo deve ser reexecutado a cada commit, pull request ou deploy significativo. A tabela de risco deve ser mantida viva, não arquivada após o primeiro uso.

---

## PARTE VII — META-RELAÇÃO E CONTINUIDADE

A skill não substitui o artigo — ela o opera. Cada parte tem um papel específico e insubstituível:

| Parte | Papel |
|---|---|
| PARTE I — Artigo | A referência arquitetural; o contrato de qualidade |
| PARTE II — Pseudo-algoritmo | O procedimento de avaliação; o que fazer e em que ordem |
| PARTE III — Personas | Os executores; quem faz o quê e como divergências são resolvidas |
| PARTE IV — Modelo de relatório | O formato de saída; como comunicar os resultados |
| PARTE V — Tabela de risco | O mapa de impactos; o que ameaça a operação segura |
| PARTE VI — Pitfalls | As regras que evitam que a avaliação se torne superficial |

**Quando o artigo é a referência arquitetural, o código é a prova; o agente de IA é o analista que conecta os dois — garantindo que a teoria não permaneça no papel e que a operação não aconteça sem base conceitual.**

---

*Skill consolidada — v2.1 — Eduardo Bastos*
*Artigo de referência: https://github.com/eduardobbastos/estudos-engenharia-ti/blob/main/README.md*
