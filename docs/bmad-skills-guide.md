# Guia prático das skills BMad

Este guia explica qual skill BMad usar em cada situação, como invocá-la e o que esperar como resultado. O inventário cobre as 46 skills instaladas neste repositório.

> Inicie cada workflow principal em uma tarefa nova do Codex. Um contexto limpo reduz a mistura entre descoberta, planejamento, implementação e revisão.

## Como invocar

Use o nome da skill com `$` e descreva objetivo, entradas, restrições e resultado esperado:

```text
$bmad-prd crie um PRD para o modo de dueto do Rhythm Tunes
```

Para trabalhar sobre um artefato existente, informe seu caminho:

```text
$bmad-editorial-review-structure revise docs/architecture-frontend.md
```

Também é possível usar linguagem natural quando a intenção é inequívoca:

```text
Use bmad-code-review para revisar as mudanças desta branch.
```

## Escolha rápida

| Situação | Skill |
|---|---|
| Não sei por onde começar ou qual é o próximo passo | `bmad-help` |
| Quero gerar muitas possibilidades | `bmad-brainstorming` |
| Quero pressionar uma ideia até ela se provar ou falhar | `bmad-forge-idea` |
| Preciso entender concorrentes e clientes | `bmad-market-research` |
| Preciso aprender um setor, regras e terminologia | `bmad-domain-research` |
| Preciso comparar tecnologias ou validar viabilidade | `bmad-technical-research` |
| Quero resumir uma ideia de produto | `bmad-product-brief` |
| Quero testar a ideia pelo método Working Backwards | `bmad-prfaq` |
| Preciso criar, atualizar ou validar requisitos de produto | `bmad-prd` |
| Preciso transformar fontes dispersas em um contrato preciso | `bmad-spec` |
| Preciso planejar a experiência e os fluxos da interface | `bmad-ux` |
| Preciso definir decisões e invariantes técnicos | `bmad-architecture` |
| Preciso decompor requisitos em épicos e histórias | `bmad-create-epics-and-stories` |
| Quero verificar se o planejamento está pronto | `bmad-check-implementation-readiness` |
| Preciso planejar e acompanhar o sprint | `bmad-sprint-planning` / `bmad-sprint-status` |
| Preciso preparar ou implementar uma história | `bmad-create-story` / `bmad-dev-story` |
| Quero implementar uma mudança direta | `bmad-quick-dev` |
| O sprint sofreu uma mudança relevante | `bmad-correct-course` |
| Quero revisar código ou conduzir revisão humana | `bmad-code-review` / `bmad-checkpoint-preview` |
| Preciso gerar testes automatizados API/E2E | `bmad-qa-generate-e2e-tests` |
| Um épico terminou e quero extrair aprendizados | `bmad-retrospective` |
| Preciso criar ou manter documentação | `bmad-agent-tech-writer` |
| Quero vários especialistas debatendo uma decisão | `bmad-party-mode` |
| Quero mudar permanentemente o comportamento do BMad | `bmad-customize` |

## Fluxo completo de produto

Nem todo projeto precisa de todas as etapas. Descoberta e UX são opcionais conforme a incerteza e o tipo de produto; PRD, arquitetura, épicos/histórias, prontidão e planejamento formam os gates do fluxo BMad completo.

```mermaid
flowchart LR
    A["Ideia ou problema"] --> B["Descoberta opcional"]
    B --> C["PRD"]
    C --> D["UX, se aplicável"]
    D --> E["Arquitetura"]
    E --> F["Épicos e histórias"]
    F --> G["Implementation Readiness"]
    G --> H["Sprint Planning"]
    H --> I["Criar história"]
    I --> J["Desenvolver história"]
    J --> K["Code Review"]
    K --> L["Próxima história ou retrospectiva"]
```

Para uma mudança pequena e bem delimitada, `bmad-quick-dev` pode substituir o ciclo completo. Se uma mudança comprometer o plano vigente, use `bmad-correct-course`.

## Descoberta, ideias e pesquisa

### `bmad-help` — BMad Help (`BH`)

- **Quando:** você não sabe em qual fase está, qual artefato falta ou qual skill executar.
- **Como:** descreva o que já existe e pergunte pelo próximo passo; a skill verifica o catálogo, a configuração e os artefatos do projeto.
- **Exemplo:** `$bmad-help já temos PRD e arquitetura; o que falta antes de implementar?`
- **Saída:** recomendação priorizada, distinguindo passos opcionais e obrigatórios.

### `bmad-brainstorming` — Brainstorming (`BP`/`BSP`)

- **Quando:** a pergunta é aberta, você quer opções ou está preso em uma solução.
- **Como:** informe desafio, público, restrições e, se quiser, a técnica criativa.
- **Exemplo:** `$bmad-brainstorming gere formas de tornar o karaokê divertido mesmo quando o jogador erra.`
- **Saída:** sessão estruturada de ideação para alimentar brief, PRFAQ, forge ou PRD.

### `bmad-forge-idea` — Forge Idea (`FI`)

- **Quando:** já existe uma ideia, mas premissas, valor, riscos e coerência precisam ser testados.
- **Como:** apresente a ideia e peça foco em produto, negócio, técnica ou comportamento do usuário.
- **Exemplo:** `$bmad-forge-idea pressione a ideia de batalhas de karaokê assíncronas.`
- **Saída:** ideia refinada, redirecionada ou descartada; pode seguir para `bmad-spec` ou `bmad-quick-dev`.

### `bmad-advanced-elicitation`

- **Quando:** uma resposta recente parece superficial e deve ser reconsiderada por outra lente.
- **Como:** invoque imediatamente depois do conteúdo e indique um método, como socrático, primeiros princípios, pré-mortem ou red team.
- **Exemplo:** `$bmad-advanced-elicitation aplique um pré-mortem à arquitetura proposta.`
- **Saída:** crítica e versão refinada do conteúdo recente; não substitui uma revisão formal completa.

### `bmad-market-research` — Market Research (`MR`)

- **Quando:** a decisão depende de clientes, concorrentes, tendências, segmentos ou posicionamento.
- **Como:** delimite mercado, região, público, período e decisão a sustentar.
- **Exemplo:** `$bmad-market-research analise jogos sociais de música para jovens adultos no Brasil.`
- **Saída:** relatório de mercado baseado em fontes atuais e verificáveis.

### `bmad-domain-research` — Domain Research (`DR`)

- **Quando:** a equipe precisa dominar um setor, suas regras, práticas, riscos e vocabulário.
- **Como:** informe o domínio e as decisões ou requisitos que dependem dele.
- **Exemplo:** `$bmad-domain-research pesquise licenciamento de músicas para jogos no Brasil.`
- **Saída:** relatório com terminologia, atores, normas, riscos e implicações.

### `bmad-technical-research` — Technical Research (`TR`)

- **Quando:** é preciso comparar tecnologias, abordagens, desempenho, custo ou viabilidade.
- **Como:** formule a decisão técnica, restrições e critérios de comparação.
- **Exemplo:** `$bmad-technical-research compare Web Audio API e processamento no servidor para pontuação vocal.`
- **Saída:** relatório técnico atual, citado e orientado à decisão arquitetural.

## Produto, requisitos, UX e solução

### `bmad-product-brief` — Product Brief (`CB`)

- **Quando:** a ideia está entendida e você quer consolidar problema, público, valor, escopo e sucesso sem escrever um PRD completo.
- **Como:** peça para criar, atualizar ou validar um brief e forneça notas, pesquisas ou arquivo existente.
- **Exemplo:** `$bmad-product-brief crie um brief para o modo história.`
- **Saída:** product brief enxuto que normalmente antecede o PRD.

### `bmad-prfaq` — PRFAQ Challenge (`WB`)

- **Quando:** você quer trabalhar de trás para frente a partir do valor percebido pelo cliente e está disposto a questionar a ideia.
- **Como:** forneça conceito e público; a skill conduz press release, FAQ e testes de coerência.
- **Exemplo:** `$bmad-prfaq execute o Working Backwards para um ranking semanal de karaokê.`
- **Saída:** PRFAQ e avaliação crítica. É alternativa mais desafiadora ao product brief, não uma etapa posterior obrigatória.

### `bmad-prd` — PRD (`PRD`)

- **Quando:** é preciso criar, atualizar ou validar o documento canônico de requisitos.
- **Como:** declare a intenção e forneça briefs, pesquisas, sinal de mudança ou caminho do PRD.
- **Exemplos:** `$bmad-prd crie o PRD do modo de dueto`; `$bmad-prd atualize o PRD para convidados sem conta`; `$bmad-prd valide caminho/do/prd.md`.
- **Saída:** PRD adequado ao escopo ou relatório HTML de validação. No fluxo completo, é obrigatório antes da solução.

### `bmad-spec` — Spec (`SP`)

- **Quando:** fontes dispersas precisam virar um contrato curto, preciso, preservado e verificável.
- **Como:** forneça brief, PRD, transcrição, notas, design ou múltiplas fontes e declare se quer criar, atualizar ou validar.
- **Exemplo:** `$bmad-spec transforme o PRD e os mockups do modo dueto em uma SPEC canônica.`
- **Saída:** `SPEC.md` e companheiros em `_bmad-output/specs/spec-{slug}`.
- **Diferença para PRD:** o PRD comunica produto e valor; a SPEC fixa de forma compacta o que deve ser verdade.

### `bmad-ux` — Create UX (`CU`)

- **Quando:** interface e experiência exigem fluxos, padrões, estados e decisões explícitas.
- **Como:** forneça PRD, pesquisas, plataforma, identidade visual e interface existente.
- **Exemplo:** `$bmad-ux planeje o seletor de dificuldade e seus estados de erro.`
- **Saída:** especificação de UX que orienta arquitetura e histórias.

### `bmad-architecture` — Architecture (`CA`)

- **Quando:** os requisitos existem e é hora de decidir como construir, ou partes independentes correm risco de divergir.
- **Como:** forneça PRD ou SPEC, UX, restrições do código-base e decisões existentes; peça criação, atualização ou validação.
- **Exemplo:** `$bmad-architecture crie a arquitetura de pontuação assíncrona sem quebrar o backend atual.`
- **Saída:** espinha de invariantes, limites, integrações e decisões. Vem antes de épicos e histórias.

### `bmad-create-epics-and-stories` — Create Epics and Stories (`CE`)

- **Quando:** PRD e arquitetura estão maduros e devem virar incrementos implementáveis.
- **Como:** informe caminhos do PRD, UX e arquitetura e prioridades de entrega.
- **Exemplo:** `$bmad-create-epics-and-stories decomponha o modo dueto em épicos e histórias.`
- **Saída:** épicos e histórias com critérios de aceitação e rastreabilidade.

### `bmad-check-implementation-readiness` — Implementation Readiness (`IR`)

- **Quando:** PRD, UX, arquitetura e épicos/histórias existem e precisam de um gate antes da implementação.
- **Como:** aponte os artefatos e peça checagem de alinhamento e completude.
- **Exemplo:** `$bmad-check-implementation-readiness valide os artefatos antes do sprint.`
- **Saída:** relatório de lacunas, inconsistências e bloqueios.

## Planejamento e implementação

### `bmad-sprint-planning` — Sprint Planning (`SP`)

- **Quando:** épicos e histórias estão aprovados e a implementação vai começar.
- **Como:** forneça os artefatos e o diretório de implementação.
- **Exemplo:** `$bmad-sprint-planning gere o plano a partir dos épicos aprovados.`
- **Saída:** `sprint-status.yaml` com sequência e acompanhamento das histórias.

### `bmad-sprint-status` — Sprint Status (`SS`)

- **Quando:** você quer progresso, riscos, bloqueios e a próxima ação recomendada.
- **Como:** peça uma fotografia do sprint após mudanças ou antes da próxima história.
- **Exemplo:** `$bmad-sprint-status mostre o sprint e o próximo workflow.`
- **Saída:** resumo e roteamento para story, dev, review, retro ou correção de curso.

### `bmad-create-story` — Create/Validate Story (`CS`/`VS`)

- **Quando:** é preciso preparar a próxima história ou validar se uma história está pronta.
- **Como:** indique identificador/caminho ou peça a próxima do sprint; declare quando a intenção for validar.
- **Exemplos:** `$bmad-create-story crie a próxima história`; `$bmad-create-story valide docs/tasks/rt-ui-001-functional-startup-loading.md`.
- **Saída:** história autocontida com contexto, tarefas, critérios e referências, ou relatório de lacunas.

### `bmad-dev-story` — Dev Story (`DS`)

- **Quando:** existe uma história pronta e você quer implementar suas tarefas e critérios.
- **Como:** informe o caminho exato e mantenha uma história por tarefa do Codex.
- **Exemplo:** `$bmad-dev-story implemente docs/tasks/rt-ui-001-functional-startup-loading.md.`
- **Saída:** código, testes, atualização da história e evidências; depois use `bmad-code-review`.

### `bmad-quick-dev` — Quick Dev (`QQ`)

- **Quando:** a mudança é pequena ou média, direta e não justifica o ciclo completo.
- **Como:** descreva resultado, escopo, critérios e arquivos relevantes.
- **Exemplo:** `$bmad-quick-dev corrija o loading inicial e adicione testes de regressão.`
- **Saída:** clarificação, plano curto, implementação, revisão e apresentação.
- **Evite:** quando há decisões de produto abertas ou a mudança atravessa muitos subsistemas.

### `bmad-dev-auto`

- **Quando:** você quer explicitamente uma iteração sem interação humana e o objetivo já está muito bem definido.
- **Como:** invoque pelo nome com contrato objetivo, critérios verificáveis e limites claros; ela só inicia quando chamada explicitamente.
- **Exemplo:** `$bmad-dev-auto implemente a SPEC X, teste e endureça a mudança até ficar revisável.`
- **Saída:** uma iteração autônoma de implementação, teste e revisão.
- **Evite:** quando existem escolhas de produto, dados sensíveis ou decisões irreversíveis que exigem aprovação.

### `bmad-correct-course` — Correct Course (`CC`)

- **Quando:** surge mudança significativa de escopo, requisito, prioridade, arquitetura ou viabilidade durante o sprint.
- **Como:** descreva o sinal, artefatos afetados e restrições.
- **Exemplo:** `$bmad-correct-course avalie trocar pontuação em tempo real por processamento assíncrono.`
- **Saída:** proposta estruturada para atualizar PRD, arquitetura, épicos ou sprint, ou reiniciar parte do planejamento.

### `bmad-retrospective` — Retrospective (`ER`)

- **Quando:** um épico terminou ou um ciclo precisa gerar aprendizados.
- **Como:** informe épico, resultados, incidentes e artefatos.
- **Exemplo:** `$bmad-retrospective conduza a retro do épico de inicialização.`
- **Saída:** aprendizados, sucessos, problemas e ações para o próximo épico.

## Revisão, qualidade e testes

### `bmad-code-review` — Code Review (`CR`)

- **Quando:** a implementação está pronta para revisão técnica.
- **Como:** indique história, diff, branch ou arquivos e critérios de aceitação.
- **Exemplo:** `$bmad-code-review revise a implementação da história RT-UI-001.`
- **Saída:** revisão adversarial em camadas, com defeitos, casos extremos e aderência aos critérios triados em ações.

### `bmad-checkpoint-preview` — Checkpoint (`CK`)

- **Quando:** uma pessoa precisa entender e validar uma mudança sem se perder no diff.
- **Como:** informe mudança e decisão humana esperada; a skill conduz propósito, riscos, detalhes e testes.
- **Exemplo:** `$bmad-checkpoint-preview me guie pela mudança do bootstrap.`
- **Saída:** walkthrough para revisão humana. Diferente do code review, prioriza entendimento e decisão.

### `bmad-qa-generate-e2e-tests` — QA Automation (`QA`)

- **Quando:** uma feature implementada precisa de testes automatizados de API ou ponta a ponta.
- **Como:** indique feature, critérios, ambiente e framework existente.
- **Exemplo:** `$bmad-qa-generate-e2e-tests crie testes para iniciar uma música e exibir a letra.`
- **Saída:** suíte automatizada e instruções. Para revisão ou story validation, use as skills específicas.

### `bmad-review-adversarial-general` — Adversarial Review (`AR`)

- **Quando:** qualquer artefato precisa de crítica cética antes de ser finalizado.
- **Como:** forneça caminho/conteúdo e objetivo do artefato.
- **Exemplo:** `$bmad-review-adversarial-general critique _bmad-output/planning-artifacts/architecture.md.`
- **Saída:** relatório amplo de fragilidades e achados.

### `bmad-review-edge-case-hunter` — Edge Case Hunter (`ECH`)

- **Quando:** é preciso percorrer ramificações, estados, limites e falhas não tratadas.
- **Como:** forneça código, spec ou diff e entradas/estados conhecidos.
- **Exemplo:** `$bmad-review-edge-case-hunter procure casos ausentes no upload e pontuação.`
- **Saída:** somente edge cases não tratados; combine com revisão adversarial para cobertura complementar.

## Documentação e conhecimento

### `bmad-document-project` — Document Project (`DP`)

- **Quando:** um projeto existente precisa ser entendido e documentado para pessoas e IA.
- **Como:** informe escopo do código-base e profundidade.
- **Exemplo:** `$bmad-document-project documente arquitetura e contratos do backend.`
- **Saída:** visão geral, arquitetura, árvore, contratos, modelos e guias conforme o projeto.

### `bmad-generate-project-context` — Generate Project Context (`GPC`)

- **Quando:** agentes precisam de regras curtas sobre padrões, convenções e armadilhas do repositório.
- **Como:** peça a análise e informe regras críticas conhecidas.
- **Exemplo:** `$bmad-generate-project-context gere o project-context.md.`
- **Saída:** contexto enxuto para IA. Diferente de `document-project`, registra regras operacionais, não uma explicação abrangente.

### `bmad-agent-tech-writer` — Paige (`WD`, `US`, `MG`, `VD`, `EC`)

- **Quando:** você quer escrever, explicar, diagramar, validar ou padronizar documentação.
- **Como:** peça à Paige um dos modos:
  - **Write Document (`WD`):** escrever um documento.
  - **Update Standards (`US`):** persistir preferências em `documentation-standards.md`.
  - **Mermaid Generate (`MG`):** criar diagrama Mermaid.
  - **Validate Document (`VD`):** revisar um arquivo e priorizar melhorias.
  - **Explain Concept (`EC`):** explicar um conceito com exemplos/diagramas.
- **Exemplo:** `$bmad-agent-tech-writer valide docs/integration-architecture.md.`
- **Saída:** documento, diagrama, explicação, padrão ou relatório, conforme o modo.

### `bmad-index-docs` — Index Docs (`ID`)

- **Quando:** uma pasta tem vários documentos e precisa de navegação sem carregar tudo.
- **Como:** informe pasta e profundidade.
- **Exemplo:** `$bmad-index-docs atualize docs/index.md.`
- **Saída:** `index.md` com links e descrições.

### `bmad-shard-doc` — Shard Document (`SD`)

- **Quando:** um Markdown, normalmente com mais de 500 linhas, ficou difícil de navegar ou carregar.
- **Como:** informe o caminho; por padrão, a divisão segue seções `##`.
- **Exemplo:** `$bmad-shard-doc divida _bmad-output/planning-artifacts/prd.md.`
- **Saída:** arquivos menores que preservam a estrutura original.

### `bmad-editorial-review-structure` — Structure (`ES`)

- **Quando:** ordem, redundância, cortes e fluxo precisam ser revistos.
- **Como:** forneça arquivo e público.
- **Exemplo:** `$bmad-editorial-review-structure revise docs/project-analysis-report.md.`
- **Saída:** proposta de reorganização; execute antes da revisão de prosa.

### `bmad-editorial-review-prose` — Prose (`EP`)

- **Quando:** a estrutura está estável e o texto precisa de clareza, concisão ou correção.
- **Como:** informe arquivo, idioma, público e tom.
- **Exemplo:** `$bmad-editorial-review-prose melhore docs/deployment-guide.md sem alterar o conteúdo técnico.`
- **Saída:** tabela com trecho, problema e correção sugerida.

## Personas especializadas

Use as personas para colaboração aberta e contínua. Quando o artefato desejado já está claro, prefira a skill de workflow correspondente.

### `bmad-agent-analyst` — Mary, Business Analyst

- **Quando:** explorar problemas, stakeholders, processos, requisitos e evidências.
- **Como:** `$bmad-agent-analyst mapeie stakeholders e riscos do licenciamento de músicas.`

### `bmad-agent-pm` — John, Product Manager

- **Quando:** conduzir descoberta, Jobs-to-be-Done, priorização e valor para usuário.
- **Como:** `$bmad-agent-pm ajude a decidir o MVP do modo multiplayer.`

### `bmad-agent-ux-designer` — Sally, UX Designer

- **Quando:** explorar jornadas, interação, acessibilidade e estados da interface.
- **Como:** `$bmad-agent-ux-designer critique a jornada de escolher música e cantar.`

### `bmad-agent-architect` — Winston, System Architect

- **Quando:** discutir trade-offs, limites, integrações e decisões técnicas.
- **Como:** `$bmad-agent-architect compare fila, cron e processamento síncrono para o worker.`

### `bmad-agent-dev` — Amelia, Senior Software Engineer

- **Quando:** colaboração de engenharia orientada a arquivos, critérios e testes.
- **Como:** `$bmad-agent-dev avalie como implementar RT-UI-002 com testes primeiro.`

### `bmad-agent-tech-writer` — Paige, Technical Writer

- **Quando:** manter uma conversa contínua sobre arquitetura da informação, público, tom, diagramas e conhecimento.
- **Como:** `$bmad-agent-tech-writer reorganize a documentação para novos contribuidores.`

## Colaboração e personalização

### `bmad-party-mode` — Party Mode (`PM`)

- **Quando:** uma decisão se beneficia de perspectivas simultâneas ou você quer criar/configurar uma party personalizada.
- **Como:** informe tema, decisão e especialistas participantes.
- **Exemplo:** `$bmad-party-mode reúna PM, UX e arquitetura para debater multiplayer síncrono versus assíncrono.`
- **Saída:** mesa-redonda mediada e síntese. Evite quando basta uma resposta factual ou uma especialidade.

### `bmad-customize` — BMad Customize (`BC`)

- **Quando:** é preciso alterar permanentemente fatos, templates, menus, etapas ou hooks de uma skill/agente.
- **Como:** descreva o comportamento; a skill descobre o ponto de extensão, grava em `_bmad/custom/` e verifica o merge.
- **Exemplo:** `$bmad-customize faça o tech writer produzir documentação em português do Brasil.`
- **Saída:** overrides TOML versionáveis sem editar as skills instaladas.

## Skills obsoletas

Estas quatro skills existem apenas para compatibilidade e serão removidas na versão 7. Não as use em trabalho novo.

| Skill obsoleta | Use no lugar | Intenção preservada |
|---|---|---|
| `bmad-create-architecture` | `bmad-architecture` | criar arquitetura |
| `bmad-create-prd` | `bmad-prd` | criar PRD |
| `bmad-edit-prd` | `bmad-prd` | atualizar PRD |
| `bmad-validate-prd` | `bmad-prd` | validar PRD |

Os aliases ainda encaminham a execução e preservam overrides antigos, mas comandos e documentos novos devem usar as skills consolidadas.

## Combinações úteis

```text
Ideia incerta:
bmad-brainstorming → bmad-forge-idea → bmad-product-brief ou bmad-prfaq → bmad-prd

Produto com interface:
bmad-prd → bmad-ux → bmad-architecture → bmad-create-epics-and-stories

Ciclo de história:
bmad-create-story (criar) → bmad-create-story (validar) → bmad-dev-story
→ bmad-code-review → bmad-dev-story para correções → próxima história

Revisão forte de documento:
bmad-editorial-review-structure → bmad-editorial-review-prose
→ bmad-review-adversarial-general → bmad-review-edge-case-hunter

Mudança pequena:
bmad-quick-dev → bmad-code-review ou bmad-checkpoint-preview
```

## Situação atual do Rhythm Tunes

O projeto já possui documentação brownfield em `docs/` e uma SPEC em `_bmad-output/implementation-artifacts/`. Para escolher o próximo passo sem presumir o estado da implementação:

```text
$bmad-help verifique os artefatos atuais do Rhythm Tunes e recomende o próximo workflow.
```

Para a SPEC existente, o caminho natural é validar a história correspondente e então usar `bmad-dev-story` ou `bmad-quick-dev`, conforme o planejamento adotado.

---

Fonte: catálogo local `_bmad/_config/bmad-help.csv` e metadados em `.agents/skills/`.
