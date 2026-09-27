---
name: planning-framework
version: 1.0
description: >
  Framework de planejamento, definição e organização dinâmica de tarefas para
  projetos de software. Adapta-se à natureza de cada projeto (MVP, legado,
  microserviços, produto, etc.) e integra os princípios de arquitetura (SKILL.md),
  segurança (PRINCIPIOS_SEGURANCA.md) e perfis técnicos (FS, SE, DevOps).
  Funciona tanto para times humanos quanto para agentes de IA.
  Referência: https://github.com/eduardobbastos/estudos-engenharia-ti
---

# PLANNING FRAMEWORK — Sistema de Planejamento Dinâmico por Projeto (v1.0)

> **Como usar este framework:**
> 1. Execute a **FASE 0 — Leitura de Natureza** para identificar o tipo de projeto.
> 2. Aplique a **FASE 1 — Planejamento** para estabelecer o mapa estratégico.
> 3. Decomponha com a **FASE 2 — Definição de Tarefas** usando os critérios de coesão da SKILL.md.
> 4. Organize e priorize com a **FASE 3 — Organização Dinâmica** conforme a natureza identificada.
> 5. Use a **FASE 4 — Execução e Revisão Contínua** para fechar o ciclo com qualidade e segurança.

---

## PARTE I — FUNDAMENTO: POR QUE PLANEJAR COM CONSCIÊNCIA DA NATUREZA DO PROJETO

O mesmo erro cometido repetidamente por equipes de software é tratar todos os projetos com o mesmo conjunto fixo de práticas. Um MVP de validação de hipótese **não deve** seguir o mesmo processo de um sistema bancário legado em migração. Um sistema de microserviços distribuído **não deve** ser organizado como um monolito CRUD.

**O critério-raiz:** assim como na [SKILL.md (ETAPA 1 — HC/BA)](./SKILL.md), o objetivo do planejamento não é a lista de tarefas em si — é garantir que as decisões de planejamento, priorização e execução **preservem a coesão estratégica e reduzam o acoplamento operacional** entre etapas, times e entregas.

| Dimensão do Planejamento | Sem consciência de natureza | Com consciência de natureza |
|---|---|---|
| Tarefas | Lista genérica; itens sem critério de conclusão | Tarefas calibradas à complexidade e ao risco real do projeto |
| Priorização | FIFO ou por urgência percebida | Por impacto arquitetural, risco de segurança e valor de negócio |
| Papéis | Todos fazem tudo ou ninguém sabe o que é de quem | Responsabilidades claras por perfil (FS, SE, DevOps) |
| Revisão | Pós-entrega; reativa | Contínua, integrada ao ciclo de desenvolvimento |
| Segurança | Checklist ao final | Shift-left: critério de definição de pronto desde a tarefa |

---

## PARTE II — TAXONOMIA DE NATUREZA DE PROJETO

Antes de planejar, classifique o projeto. A natureza determina o nível de rigor, o conjunto de práticas a aplicar e os critérios de qualidade aceitáveis.

### Tipo 1 — MVP / Prova de Conceito (PoC)
- **Objetivo:** Validar hipótese de negócio com o mínimo de código sustentável.
- **Risco principal:** Over-engineering que retarda o aprendizado; código que não pode ser evoluído após a validação.
- **Práticas SKILL.md aplicáveis:** HC/BA (ETAPA 1), MVC (ETAPA 3), Pragmatismo (ETAPA 16).
- **Práticas SKILL.md a evitar por ora:** EDA, CQRS, DDD, Hexagonal em nível completo.
- **Perfil predominante:** Full Stack (FS) com supervisão de SE para garantir coesão mínima.
- **Segurança mínima obrigatória:** Princípios 1, 4 e 7 do [PRINCIPIOS_SEGURANCA.md](./PRINCIPIOS_SEGURANCA.md).

### Tipo 2 — Produto em Crescimento (Scale-up)
- **Objetivo:** Sistema funcional que precisa escalar funcionalidades, times e tráfego de forma sustentável.
- **Risco principal:** Acoplamento destrutivo que torna o crescimento cada vez mais caro; ausência de fronteiras de domínio.
- **Práticas SKILL.md aplicáveis:** Todas da camada interna + Clean/Hexagonal (ETAPA 11), DDD (ETAPA 14), Observabilidade (ETAPA 15).
- **Perfil predominante:** SE arquiteta domínios e contratos; FS entrega features; DevOps estrutura esteira e observabilidade.
- **Segurança obrigatória:** Todos os 10 princípios do [PRINCIPIOS_SEGURANCA.md](./PRINCIPIOS_SEGURANCA.md).

### Tipo 3 — Sistema Legado em Evolução
- **Objetivo:** Modernizar ou estender um sistema existente sem parar a operação; reduzir dívida técnica de forma incremental.
- **Risco principal:** Regressões em código não testado; acoplamento com partes que não podem ser tocadas; ausência de observabilidade no sistema original.
- **Práticas SKILL.md aplicáveis:** Adapter (ETAPA 8) como isolador de legado, DI (ETAPA 9), Observabilidade retroativa (ETAPA 15), Strangler Fig Pattern.
- **Perfil predominante:** SE lidera a estratégia de migração; DevOps garante rollback seguro e observabilidade.
- **Segurança obrigatória:** Princípios 1, 3, 7, 8 e 9 do [PRINCIPIOS_SEGURANCA.md](./PRINCIPIOS_SEGURANCA.md).

### Tipo 4 — Sistema Distribuído / Microserviços
- **Objetivo:** Escalar equipes e serviços de forma independente; garantir resiliência operacional em produção.
- **Risco principal:** Acoplamento distribuído disfarçado; falta de tracing; fronteiras de serviço incorretas.
- **Práticas SKILL.md aplicáveis:** Todas — especialmente EDA (ETAPA 12), CQRS (ETAPA 13), DDD Bounded Context (ETAPA 14), Observabilidade com trace_id (ETAPA 15).
- **Perfil predominante:** SE define fronteiras de bounded context; DevOps/SRE opera a plataforma; FS entrega dentro de cada serviço.
- **Segurança obrigatória:** Todos os 10 princípios, com ênfase em Princípios 2, 3, 5 e 8.

### Tipo 5 — Produto de Dados / Analytics
- **Objetivo:** Ingestão, transformação, análise e entrega de valor a partir de dados em escala.
- **Risco principal:** Pipelines sem auditoria; dados sensíveis sem mascaramento; ausência de linhagem de dados.
- **Práticas SKILL.md aplicáveis:** EDA (ETAPA 12) para pipelines assíncronos, CQRS (ETAPA 13) para separação de leitura analítica, Observabilidade (ETAPA 15).
- **Perfil predominante:** SE/Engenheiro de Dados para modelagem; DevOps/DataOps para orquestração e operação.
- **Segurança obrigatória:** Princípios 1, 2, 4, 6 e 8 do [PRINCIPIOS_SEGURANCA.md](./PRINCIPIOS_SEGURANCA.md).

---

## PARTE III — FASE 0: LEITURA DE NATUREZA DO PROJETO

Antes de qualquer planejamento, responda às perguntas abaixo. As respostas determinam automaticamente o Tipo (1 a 5) e calibram as fases seguintes.

```
=========================================================================
FASE 0 — LEITURA DE NATUREZA DO PROJETO
=========================================================================

PERGUNTA 1 — Estágio do produto:
  O projeto é novo (greenfield) ou existe código em produção (brownfield)?
  [ ] Greenfield  → indica Tipo 1 ou 2
  [ ] Brownfield  → indica Tipo 3 ou 4

PERGUNTA 2 — Horizonte de vida:
  O projeto precisa durar mais de 12 meses ou é uma validação pontual?
  [ ] Pontual / PoC         → Tipo 1 (MVP)
  [ ] Médio prazo (6-18m)   → Tipo 2 (Scale-up)
  [ ] Longo prazo (18m+)    → Tipo 3 ou 4

PERGUNTA 3 — Escala de equipe:
  Quantas pessoas trabalharão simultaneamente no codebase?
  [ ] 1 a 3 pessoas   → Tipo 1 ou 2 inicial
  [ ] 4 a 10 pessoas  → Tipo 2 ou 3
  [ ] 10+ pessoas     → Tipo 4

PERGUNTA 4 — Criticidade de dados:
  O sistema manipula dados sensíveis (financeiro, saúde, identidade, PII)?
  [ ] Não → segurança padrão (Princípios 1, 4, 7)
  [ ] Sim → segurança reforçada (todos os 10 Princípios)

PERGUNTA 5 — Regime de entrega:
  O deploy acontece de forma contínua (CI/CD) ou em releases pontuais?
  [ ] Releases pontuais → Observabilidade recomendada
  [ ] CI/CD contínuo   → Observabilidade obrigatória (ETAPA 15 + Princípio 5)

RESULTADO: Tipo ____  |  Segurança: [ ] Padrão  [ ] Reforçada
           Perfil primário: [ ] FS  [ ] SE  [ ] DevOps  [ ] Todos
=========================================================================
```

---

## PARTE IV — FASE 1: PLANEJAMENTO ESTRATÉGICO

Com a natureza do projeto identificada, construa o mapa estratégico em três horizontes.

### Horizonte 1 — Fundação (primeiras 2 a 4 semanas)
> **Objetivo:** Estabelecer a base sobre a qual todas as tarefas futuras se apoiam com segurança.

| Item de Planejamento | O que definir | Referência |
|---|---|---|
| **Arquitetura de referência** | Qual o modelo arquitetural base? (MVC simples, Clean/Hex, monolito modular, microserviços) | [SKILL.md ETAPA 2](./SKILL.md) — Meta-Relação das 3 Camadas |
| **Fronteiras de domínio iniciais** | Quais são os bounded contexts ou módulos coesos desde o início? | [SKILL.md ETAPA 14](./SKILL.md) — DDD Bounded Context |
| **Estratégia de DI e contratos** | Quais interfaces (ports) serão o contrato central? Como DI será configurado? | [SKILL.md ETAPA 9](./SKILL.md) — Dependency Injection |
| **Observabilidade mínima** | Quais logs estruturados e trace_id serão obrigatórios desde o primeiro commit? | [SKILL.md ETAPA 15](./SKILL.md) — Observabilidade Nativa |
| **Postura de segurança inicial** | Quais dos 10 princípios são obrigatórios desde o início (conforme natureza do projeto)? | [PRINCIPIOS_SEGURANCA.md](./PRINCIPIOS_SEGURANCA.md) |
| **Papéis e responsabilidades** | Quem é o SE responsável pela arquitetura? Quem é o DevOps da esteira? | Perfis FS / SE / DevOps |

### Horizonte 2 — Evolução (semanas 4 a 12)
> **Objetivo:** Crescer de forma controlada, mantendo coesão e introduzindo complexidade apenas quando justificada.

| Item de Planejamento | Critério de Introdução | Referência |
|---|---|---|
| **EDA / Mensageria** | Somente quando dois ou mais serviços precisam comunicar de forma independente e assíncrona | [SKILL.md ETAPA 12](./SKILL.md) |
| **CQRS** | Somente quando modelos de leitura e escrita começam a divergir ou escalar diferentemente | [SKILL.md ETAPA 13](./SKILL.md) |
| **Decomposição de microserviços** | Somente quando bounded contexts tiverem equipes e ciclos de deploy independentes | [SKILL.md ETAPA 14](./SKILL.md) |
| **Segurança reforçada** | Quando dados sensíveis forem introduzidos ou o volume de usuários crescer | [PRINCIPIOS_SEGURANCA.md](./PRINCIPIOS_SEGURANCA.md) Princípios 2, 3, 5 |

### Horizonte 3 — Maturidade (trimestre 3 em diante)
> **Objetivo:** Sistema operando com qualidade, confiabilidade e segurança validadas em produção.

| Item de Planejamento | O que validar | Referência |
|---|---|---|
| **Cobertura de observabilidade** | Todos os adapters expõem métricas; todos os eventos carregam trace_id | [SKILL.md ETAPA 15](./SKILL.md) |
| **Revisão de pragmatismo** | Auditar padrões adotados; remover os que não geram valor real | [SKILL.md ETAPA 16](./SKILL.md) |
| **Avaliação de risco de segurança** | Executar pseudo-algoritmo da PARTE II do SKILL.md + Tabela de Risco | [SKILL.md PARTE V](./SKILL.md) |
| **Revisão de bounded contexts** | Fronteiras ainda corretas? Algum contexto cresceu demais? | [SKILL.md ETAPA 14](./SKILL.md) |

---

## PARTE V — FASE 2: DEFINIÇÃO DE TAREFAS

Uma tarefa mal definida é a principal causa de retrabalho em projetos de software. Este módulo estabelece o critério de qualidade para a definição de cada tarefa.

### Anatomia de uma Tarefa Coesa

Seguindo o princípio de HC/BA da [SKILL.md (ETAPA 1)](./SKILL.md), cada tarefa deve ter **uma única responsabilidade, resultado verificável e critério explícito de conclusão**.

```
=========================================================================
TEMPLATE DE TAREFA COESA
=========================================================================

ID:          [PROJ-XXX]
Título:      [Verbo de ação + objeto claro]
             Exemplo: "Implementar Adapter de Pagamento Stripe"
Tipo:        [ ] Feature  [ ] Refatoração  [ ] Segurança
             [ ] Infraestrutura  [ ] Débito técnico
Perfil:      [ ] FS  [ ] SE  [ ] DevOps  [ ] Todos

Contexto:    [A qual bounded context / módulo / serviço esta tarefa pertence?]
Dependência: [Quais tarefas devem ser concluídas antes desta?]
Impacto:     [O que quebra ou regride se esta tarefa não for feita?]

Critério de Conclusão (Definition of Done):
  [ ] Implementação completa e revisada (Four-Eyes — Princípio 9 de Segurança)
  [ ] Testes automatizados cobrindo o contrato (unit + integration)
  [ ] Observabilidade: logs estruturados e trace_id presentes
  [ ] Segurança: princípio(s) aplicável(is) verificado(s)
  [ ] Documentação de decisão arquitetural registrada (se aplicável)
  [ ] CI/CD passou sem erros de segurança (SAST/DAST — Princípio 5)

Referência SKILL.md:    [ETAPA(s) aplicável(is)]
Referência Segurança:   [Princípio(s) aplicável(is)]
=========================================================================
```

### Tipos de Tarefas e seu Peso por Perfil

| Tipo de Tarefa | Perfil Principal | Perfil de Revisão | Critério de Qualidade Central |
|---|---|---|---|
| **Feature nova (UI + API + DB)** | Full Stack (FS) | SE (contrato) + DevOps (deploy) | HC/BA preservado; sem acoplamento direto entre camadas |
| **Refatoração arquitetural** | SE | Agente-Prag (pragmatismo) | Não aumenta complexidade sem benefício; cobertura de testes antes e depois |
| **Pipeline / Infraestrutura** | DevOps | SE (contratos de observabilidade) | Observabilidade nativa; rollback documentado; segredos gerenciados |
| **Segurança / Hardening** | SE + DevOps (Agente-Sec) | Todos | Princípio(s) aplicado(s); tabela de risco atualizada |
| **Débito técnico** | SE | Agente-Prag | Justificativa clara; reduz acoplamento ou aumenta coesão; testes preservados |

---

## PARTE VI — FASE 3: ORGANIZAÇÃO DINÂMICA POR NATUREZA DE PROJETO

A organização das tarefas não é um backlog linear. É um sistema dinâmico que se adapta à natureza do projeto identificada na FASE 0.

### Modelo de Organização por Tipo de Projeto

#### Para Tipo 1 — MVP / PoC
```
Organização: Fila plana de features prioritárias
Critério de priorização:
  1. Aprendizado máximo com mínimo de código
  2. Coesão mínima garantida (HC/BA básico)
  3. Segurança: validação de entrada + sem hardcoded secrets

Tamanho máximo de tarefa: 1 dia
Ciclo de revisão: A cada feature entregue
Quem decide a prioridade: Product Owner + FS + SE (Pragmatismo)
Gate de qualidade: Funciona? É seguro o mínimo? Pode ser evoluído?
```

#### Para Tipo 2 — Produto em Crescimento
```
Organização: Backlog por Bounded Context + Sprint semanal
Critério de priorização:
  1. Impacto de negócio no contexto correto
  2. Risco arquitetural (acoplamento indesejado)
  3. Segurança: princípios 1 a 5 verificados por sprint

Tamanho máximo de tarefa: 3 dias (dividir se maior)
Ciclo de revisão: Semanal + ao final de cada sprint
Quem decide a prioridade: SE (arquitetura) + PO (negócio) + DevOps (viabilidade)
Gate de qualidade: SKILL.md pseudo-algoritmo executado por módulo entregue
```

#### Para Tipo 3 — Sistema Legado em Evolução
```
Organização: Mapa de strangler + fila de modernização incremental
Critério de priorização:
  1. Risco de regressão (o que não pode quebrar)
  2. Valor de modernização (o que mais dificulta a evolução)
  3. Observabilidade retroativa (o que está cego em produção)

Tamanho máximo de tarefa: 2 dias (menor = menor risco de regressão)
Ciclo de revisão: A cada passo de modernização (Adapter introduzido = revisão)
Quem decide a prioridade: SE + DevOps (rollback) + Agente-Sec
Gate de qualidade: Adapter testado; rollback documentado; observabilidade ativa
```

#### Para Tipo 4 — Sistema Distribuído / Microserviços
```
Organização: Por Bounded Context; cada contexto tem seu próprio backlog
Critério de priorização:
  1. Impacto de contrato (mudança de API de evento quebra outros contextos?)
  2. Observabilidade (trace_id propagado em todos os eventos?)
  3. Segurança: todos os 10 princípios como gates de revisão

Tamanho máximo de tarefa: 2 dias (contrato de evento = tarefa separada da implementação)
Ciclo de revisão: Contínuo via CI/CD + revisão de bounded context trimestral
Quem decide a prioridade: SE por contexto + DevOps/SRE (SLOs) + Agente-Sec
Gate de qualidade: SKILL.md pseudo-algoritmo completo (PASSOS 1 a 7) por serviço entregue
```

#### Para Tipo 5 — Produto de Dados / Analytics
```
Organização: Por pipeline de dados (ingesta, transformação, entrega como contextos separados)
Critério de priorização:
  1. Qualidade e integridade dos dados na saída
  2. Rastreabilidade de linhagem (audit trail de transformações)
  3. Segurança: mascaramento, controle de acesso por papel

Tamanho máximo de tarefa: 2 dias
Ciclo de revisão: A cada pipeline entregue ou alterado
Quem decide a prioridade: Engenheiro de Dados + DevOps/DataOps + Agente-Sec
Gate de qualidade: Dados corretos? Linhagem rastreável? PII mascarado? Pipeline observável?
```

---

## PARTE VII — FASE 4: EXECUÇÃO E REVISÃO CONTÍNUA

### Ciclo de Qualidade Integrado

O ciclo de revisão não é pontual — é disparado por eventos do próprio processo de desenvolvimento, exatamente como o PASSO 8 do [SKILL.md (PARTE II)](./SKILL.md).

```
=========================================================================
GATILHOS DE REVISÃO AUTOMÁTICA
=========================================================================

AO ABRIR UM PULL REQUEST:
  [ ] A tarefa respeita a anatomia de tarefa coesa (uma responsabilidade)?
  [ ] O perfil executor está correto (FS / SE / DevOps)?
  [ ] Os critérios de conclusão (DoD) estão todos marcados?
  [ ] A referência à ETAPA do SKILL.md está documentada?
  [ ] O princípio de segurança aplicável foi verificado?

AO FAZER MERGE:
  [ ] CI/CD passou sem erros de segurança (SAST/DAST)?
  [ ] Observabilidade mantida ou melhorada?
  [ ] Nenhuma regressão de coesão/acoplamento introduzida?

AO FECHAR UM SPRINT / CICLO:
  [ ] Percentuais de aderência arquitetural mantidos ou melhorados?
  [ ] Tabela de risco de segurança (SKILL.md PARTE V) atualizada?
  [ ] Algum padrão adotado que deve ser revisado pelo Pragmatismo (ETAPA 16)?
  [ ] Bounded contexts continuam corretos para o tamanho atual do sistema?

A CADA TRIMESTRE:
  [ ] A natureza do projeto continua sendo o mesmo Tipo (1 a 5)?
      SE mudou → reclassificar e ajustar práticas e organização.
  [ ] Modelagem de ameaças revisada (Princípio 10 de Segurança)?
  [ ] Observabilidade cobre 100% dos adapters e eventos de EDA?
=========================================================================
```

### Matriz de Responsabilidade por Fase

| Fase | Full Stack (FS) | Engenheiro de Software (SE) | DevOps / SRE |
|---|---|---|---|
| **FASE 0 — Leitura de Natureza** | Informa contexto de produto | **Lidera** classificação de tipo e práticas | Informa regime de entrega e requisitos operacionais |
| **FASE 1 — Planejamento Estratégico** | Participa do Horizonte 1 (fundação de features) | **Lidera** arquitetura, fronteiras e contratos | **Lidera** observabilidade, CI/CD e infraestrutura |
| **FASE 2 — Definição de Tarefas** | Define e executa tarefas de feature | Revisa coesão, acoplamento e padrão arquitetural | Revisa critérios operacionais e de segurança |
| **FASE 3 — Organização Dinâmica** | Executa dentro do modelo definido para o Tipo | Audita e ajusta o modelo de organização | Monitora gatilhos de CI/CD e saúde operacional |
| **FASE 4 — Revisão Contínua** | Participa de retrospectivas de produto | **Lidera** revisões arquiteturais e de pragmatismo | **Lidera** revisões de observabilidade e segurança |

---

## PARTE VIII — RELAÇÃO CRUZADA COM O ECOSSISTEMA DE DOCUMENTOS

Este framework não opera isolado. Cada fase referencia e depende dos outros documentos do repositório.

| Fase do Framework | Documento Principal | Seção de Referência |
|---|---|---|
| FASE 0 — Leitura de Natureza | [SKILL.md](./SKILL.md) | ETAPA 2 (Meta-Relação), ETAPA 16 (Pragmatismo) |
| FASE 1 — Planejamento — Arquitetura | [SKILL.md](./SKILL.md) | ETAPAS 1 a 18 (Artigo Técnico Completo) |
| FASE 1 — Planejamento — Segurança | [PRINCIPIOS_SEGURANCA.md](./PRINCIPIOS_SEGURANCA.md) | Princípios por Tipo de Projeto |
| FASE 2 — Definição de Tarefas — Perfis | Perfis FS / SE / DevOps | Matriz Comparativa de Perfis |
| FASE 2 — Definição de Tarefas — Avaliação | [SKILL.md](./SKILL.md) | PARTE II (Pseudo-algoritmo), PARTE III (Personas) |
| FASE 3 — Organização — Risco | [SKILL.md](./SKILL.md) | PARTE V (Tabela de Risco de Segurança) |
| FASE 4 — Revisão Contínua — Relatório | [SKILL.md](./SKILL.md) | PARTE IV (Modelo de Relatório), PARTE VI (Pitfalls) |

---

## PARTE IX — ANTI-PADRÕES DE PLANEJAMENTO (O QUE EVITAR)

Seguindo a lógica do Pragmatismo ([SKILL.md ETAPA 16](./SKILL.md)) e dos Pitfalls ([SKILL.md PARTE VI](./SKILL.md)):

| Anti-Padrão | Sintoma | Correção |
|---|---|---|
| **Backlog sem natureza** | Todas as tarefas tratadas da mesma forma independente do tipo de projeto | Executar FASE 0; recalibrar organização conforme o Tipo |
| **Tarefa sem responsabilidade única** | Uma tarefa cobre UI + backend + banco + deploy + documentação | Dividir em tarefas coesas; cada uma com perfil executor claro |
| **Segurança como última tarefa** | "Faremos o hardening no final, antes do go-live" | Aplicar Princípio 5 (Shift-Left); segurança integrada no DoD de cada tarefa |
| **Planejamento sem observabilidade** | Nenhuma tarefa de log/tracing no backlog até aparecer um bug em produção | Observabilidade é tarefa de fundação (Horizonte 1); não é opcional |
| **Perfil único para tudo** | O mesmo desenvolvedor arquiteta, implementa, faz deploy e audita segurança | Ativar conferência cruzada de perfis (Pitfall 2 do SKILL.md PARTE VI) |
| **Over-planning** | Planejar 6 meses de tarefas detalhadas antes de qualquer validação | Horizonte 1 detalhado; Horizonte 2 em blocos; Horizonte 3 em direções |
| **Ignorar a natureza do projeto** | Aplicar microserviços + DDD + EDA em um MVP de 3 semanas | Pragmatismo (ETAPA 16) + FASE 0 obrigatória antes de qualquer planejamento |

---

*Planning Framework — v1.0 — Eduardo Bastos*
*Ecossistema: [SKILL.md](./SKILL.md) · [PRINCIPIOS_SEGURANCA.md](./PRINCIPIOS_SEGURANCA.md) · [README.md](./README.md)*
*Repositório: https://github.com/eduardobbastos/estudos-engenharia-ti*
