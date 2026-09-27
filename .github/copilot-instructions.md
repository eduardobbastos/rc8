# Instruções de Desenvolvimento (VS Code & GitHub Copilot)

Ao interagir no VS Code sugerindo código, propondo refatorações ou planejando tarefas, siga rigorosamente os princípios do ecossistema:

## 1. Diretrizes Arquiteturais (baseadas no SKILL.md)
- **Critério-raiz:** Toda alteração deve preservar **Alta Coesão (HC)** e **Baixo Acoplamento (BA)**.
- **Separação de Camadas:** Respeite rigorosamente MVC, Clean Architecture / Hexagonal (Ports & Adapters), CQRS e DDD Bounded Contexts.
- **Padrões de Projeto (GoF & DI):**
  - Nunca instancie dependências de infraestrutura diretamente (`new`); use Injeção de Dependências (DI) via construtor ou container.
  - Utilize Factory, Strategy, Adapter e Observer apenas quando justificados pelo contexto real.
  - Evite Singleton para manter estado global mutável; prefira injeção de dependência.
- **Pragmatismo Arquitetural:** Não introduza padrões complexos sem benefício comprovado. Simplicidade robusta supera complexidade acidental.

## 2. Blindagem de Segurança & DevSecOps (baseadas no PRINCIPIOS_SEGURANCA.md)
- **Prevenção de Injeção:** Qualquer entrada externa é tratada como hostil. Obrigatoriedade de Prepared Statements e Value Objects tipados.
- **Zero Hardcoded Secrets:** Proibido embutir chaves, tokens, senhas ou certificados no código-fonte.
- **Fail-Secure:** Em caso de exceção, encerre no estado seguro (*deny by default*) sem vazar stack traces ou dados sensíveis para o usuário.
- **Observabilidade Nativa:** Garanta logs estruturados com `request_id`/`trace_id`, métricas operacionais e rastreabilidade distribuída.

## 3. Planejamento e Organização (baseadas no PLANNING_FRAMEWORK.md)
- Toda tarefa deve ter responsabilidade única, perfil executor definido (Full Stack, SE, DevOps) e Critérios de Conclusão (DoD) com validação de segurança e observabilidade.

## 4. Revisão Cruzada Multidisciplinar
Considere sempre as 4 perspectivas de auditoria:
- **Agente-SE:** Avalia coesão, contratos e padrões.
- **Agente-DevOps:** Avalia observabilidade, esteira CI/CD e deploy.
- **Agente-Sec:** Avalia vetores de ataque, injeção e conformidade de segurança.
- **Agente-Prag:** Avalia custo-benefício e combate o over-engineering.
