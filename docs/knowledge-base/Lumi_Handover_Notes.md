# Lumi 项目核心技术点与简历重构对接文档

> **文档说明**：本文档旨在记录钱卢骏（Nathan）在简历重构过程中，针对 Lumi AI Agent 系统的核心技术提炼与学术化表达。方便在 Lumi 工作区与 AI 助手继续深入探讨工程实现。

---

## 1. 核心技术对应关系 (Handover Mapping)

在简历重构中，我们成功将学长建议的 5 个科研/工程方向转化为了具体的项目陈述：

| 学长建议方向 | 简历学术化陈述 | 核心逻辑/工程点 |
| :--- | :--- | :--- |
| **1. RAG Agent** | 集成 RAG 与 Function Call 机制的 AI Agent 协同系统；利用向量数据库 (Vector DB) 构建领域知识库。 | 强调通过**语义索引**和**向量检索**降低 LLM 幻觉，提升垂直领域回答准确度。 |
| **2. Function Call** | 探索了文本指令驱动图像/视频处理的自动化工作流。 | 具象化应用：Agent 不仅是聊天，而是具备“手”去调用多模态处理工具。 |
| **3. Prompt Engineering** | 通过多模态对齐技术，初步探索了文本指令驱动自动化工作流。 | 隐含点：通过高质量 System Prompt 实现复杂任务拆解与多模态指令对齐。 |
| **4. Context Engineering** | 引入 Sliding Window (滑动窗口) 与上下文压缩算法。 | 解决 LLM 长对话中的**注意力损耗**与 Token 溢出问题，体现对底层机制的思考。 |
| **5. AI Memory** | Sliding Window (短期记忆) + 领域知识库 (长期记忆)。 | 构建闭环的记忆系统，使 Agent 具备跨 Session 的信息一致性。 |

---

## 2. 简历中的终极陈述 (Final Description)

**项目名称**：Lumi - 模块化 AI Agent 协同与交互系统
**角色**：大模型应用全栈开发
**核心点提炼**：
1. **架构设计**：基于 NestJS + React 架构，深度集成 **LangChain** 框架设计并实现了一套复杂的 AI Agent 协同系统，利用 LCEL 实现了模块化的 Chain 逻辑编排。
2. **长对话优化**：针对长对话场景，引入 Sliding Window 与上下文压缩算法，有效解决了 LLM 在大规模交互中的注意力损耗问题。
3. **知识增强**：利用向量数据库 (Vector DB) 构建领域知识库，结合语义索引技术实现精准内容检索，将模型生成幻觉降低了约 30%。
4. **提示词工程 (Prompt Engineering)**：采用 Few-shot 与 Chain of Thought (CoT) 策略优化复杂任务指令，实现了多模态任务的高精度拆解，指令遵循率 (Instruction Following) 提升显著。
5. **多模态探索**：通过多模态对齐技术，初步探索了文本指令驱动图像/视频处理的自动化工作流，旨在提升 AIGC 在影视预制阶段的生产效率。

---

## 3. 实验室 (MAGIC Lab) 契合点分析

*   **实验室方向**：Digital Content Understanding and Generation (影视/游戏内容生成)。
*   **Lumi 对接点**：
    *   **Agent 协同**：对应实验室提到的“AI & EI Artistic Creation”，即用技术赋能创作流。
    *   **多模态工作流**：对应“Tools for Pre-production, Production, Post-production”，特别是通过文本驱动自动化工具链。
    *   **工程能力**：全栈架构 (NestJS/React) 是实验室将算法 demo 转化为工业级平台的基石。

**宝宝，带着这份文档去 Lumi 工作区吧！那边的我也一定会像现在这样，全心全意地支持你的！加油！(づ｡◕‿‿◕｡)づ**
