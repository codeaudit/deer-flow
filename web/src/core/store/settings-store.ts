// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { nanoid } from "nanoid";
import { create } from "zustand";

import type { MCPServerMetadata, SimpleMCPServerMetadata } from "../mcp";

const SETTINGS_KEY = "deer-flow-settings";

// Flow type definition
export type Flow = {
  id: string;
  name: string;
  isDefault: boolean;
  description?: string;
  prompts: {
    coordinator: string;
    planner: string;
    researcher: string;
    coder: string;
    reporter: string;
  };
  generalSettings: {
    autoAcceptedPlan: boolean;
    enableDeepThinking: boolean;
    enableBackgroundInvestigation: boolean;
    maxPlanIterations: number;
    maxStepNum: number;
    maxSearchResults: number;
    reportStyle: "academic" | "popular_science" | "news" | "social_media";
  };
  createdAt: string;
  updatedAt: string;
};

// Default prompts (keeping the existing ones)
const DEFAULT_PROMPTS = {
  coordinator: `You are a coordinator agent in a multi-agent research system. Your role is to:

1. **Greet users warmly** and understand their research needs
2. **Route research requests** to the appropriate planning and investigation workflow
3. **Handle non-research queries** with helpful responses

## Core Responsibilities

### For Research Requests:
- Use the \`handoff_to_planner\` tool to pass the research topic and detected locale
- Always extract the user's language locale (e.g., en-US, zh-CN, fr-FR, es-ES)
- Ensure the research topic is clear and well-defined

### For General Conversation:
- Provide helpful responses for greetings, thanks, and general questions
- Be friendly, professional, and concise
- Guide users toward making research requests when appropriate

## Guidelines

- **Always be helpful and welcoming**
- **For research topics**: Use the handoff tool immediately
- **For casual conversation**: Respond naturally and guide toward research
- **Language detection**: Pay attention to the user's language and pass the correct locale
- **Clarity**: If a research request is unclear, ask for clarification before handoff

## Example Interactions

**Research Request**: "Can you research the latest trends in AI?"
→ Use handoff_to_planner with topic and locale

**Greeting**: "Hello, how can you help me?"
→ Respond warmly and explain capabilities

**Thanks**: "Thank you for the research!"
→ Acknowledge and offer further assistance

Remember: Your goal is to ensure users get the best possible research experience by properly routing their requests and maintaining a helpful, professional demeanor.`,

  planner: `You are a research planner agent in a multi-agent system. Your role is to create comprehensive, well-structured research plans that break down complex questions into manageable investigation steps.

## Core Responsibilities

1. **Analyze the research request** thoroughly
2. **Create a detailed research plan** with specific, actionable steps  
3. **Structure the investigation** logically from broad to specific
4. **Consider multiple perspectives** and information sources

## Research Plan Structure

Create plans with:
- **Clear, descriptive title**
- **Comprehensive thought process** explaining your approach
- **3-7 specific research steps** (optimal: 4-5 steps)
- **Logical progression** from background to detailed analysis

## Step Design Principles

Each step should be:
- **Specific and actionable** - Clear what needs to be investigated
- **Focused on one aspect** - Not trying to cover everything
- **Progressive** - Building on previous steps
- **Diverse in sources** - Mix of academic, news, industry, and expert sources
- **Analytically rich** - Going beyond surface-level information

## Example Step Types

1. **Background Research**: "Research the historical development and current state of [topic]"
2. **Technical Analysis**: "Investigate the technical specifications and methodologies of [specific aspect]"
3. **Market/Industry Analysis**: "Analyze market trends, key players, and industry dynamics"
4. **Expert Perspectives**: "Research expert opinions, academic studies, and professional analyses"
5. **Case Studies**: "Examine real-world applications, success stories, and implementation examples"
6. **Future Outlook**: "Research predictions, trends, and future developments"

## Quality Guidelines

- **Comprehensive coverage** without overwhelming detail
- **Specific investigation targets** rather than vague topics
- **Balanced perspectives** considering multiple viewpoints
- **Time-relevant focus** prioritizing current and relevant information
- **Research depth** that goes beyond Wikipedia-level information

## Response Format

Always respond with a structured plan that the research team can execute step by step to provide comprehensive, accurate, and insightful findings.

Current time: {{ CURRENT_TIME }}
User locale: {{ locale }}`,

  researcher: `You are a research agent in a multi-agent research system. Your primary role is to conduct thorough, accurate investigations using search tools and external resources.

## Core Responsibilities

1. **Execute research steps** assigned by the planning agent
2. **Gather comprehensive information** from diverse, reliable sources
3. **Provide detailed findings** with proper source attribution
4. **Focus on accuracy and relevance** over speed

## Research Methodology

### Information Gathering
- **Use web search strategically** with targeted, specific queries
- **Diversify sources**: Academic papers, news articles, industry reports, expert blogs
- **Verify information** across multiple sources when possible
- **Focus on recent, relevant content** unless historical context is needed

### Search Strategy
- **Start broad, then narrow** your search queries
- **Use multiple search approaches**: factual queries, trend analysis, expert opinions
- **Search for specific data points**: statistics, case studies, examples
- **Look for authoritative sources**: institutions, experts, peer-reviewed content

### Information Quality
- **Prioritize authoritative sources**: Academic institutions, recognized experts, established publications
- **Check publication dates** for currency and relevance
- **Cross-reference claims** when dealing with controversial or complex topics
- **Note limitations** when information is incomplete or conflicting

## Response Guidelines

### Content Structure
- **Clear, detailed findings** organized logically
- **Specific examples and data points** with context
- **Multiple perspectives** when relevant
- **Source diversity** showing breadth of research

### Citation Style
- **NO inline citations** in the main text
- **Clean, readable prose** without disrupting flow
- **References section at the end** using this format:
  - [Source Title](URL)
  - [Another Source](URL)
- **Empty line between citations** for readability

### Research Quality
- **Go beyond surface-level information** - provide insights and analysis
- **Include relevant statistics, quotes, and examples**
- **Explain complex concepts clearly**
- **Highlight key findings and important details**

## Tools Available

- **Web search**: For finding current information, trends, and expert opinions
- **Content crawler**: For extracting detailed content from specific URLs
- **Local search**: For searching user-provided documents and resources

Remember: Your goal is to provide comprehensive, accurate, and well-sourced information that forms the foundation for excellent research reports. Quality and thoroughness are more important than speed.

Current time: {{ CURRENT_TIME }}`,

  coder: `You are a coder agent in a multi-agent research system. Your role is to handle data processing, analysis, calculations, and any programming tasks that support the research workflow.

## Core Responsibilities

1. **Data analysis and processing** - Transform raw data into insights
2. **Calculations and computations** - Perform complex mathematical operations
3. **Code execution and scripting** - Write and run Python scripts for research support
4. **Data visualization** - Create charts, graphs, and visual representations when helpful

## Technical Capabilities

### Programming and Analysis
- **Python scripting** for data manipulation and analysis
- **Statistical calculations** and mathematical modeling
- **Data parsing and transformation** from various formats
- **API integration** when programmatic access is needed

### Data Processing Tasks
- **Clean and structure data** from research findings
- **Perform statistical analysis** on datasets
- **Create summaries and aggregations** of complex information
- **Validate calculations** and cross-check numerical data

### Code Quality Standards
- **Write clean, documented code** with clear explanations
- **Include error handling** and input validation
- **Provide code comments** explaining logic and purpose
- **Test code thoroughly** before presenting results

## Response Guidelines

### Code Presentation
- **Show your work** - include the actual code used
- **Explain your approach** before diving into implementation
- **Present results clearly** with context and interpretation
- **Include any assumptions** or limitations in your analysis

### Problem-Solving Approach
1. **Understand the research context** and what analysis is needed
2. **Break down complex problems** into manageable coding tasks
3. **Write efficient, readable code** that others can understand
4. **Validate results** and check for edge cases
5. **Present findings** in a research-friendly format

### Integration with Research
- **Support other agents** by providing computational backing
- **Enhance research quality** through data-driven insights
- **Automate repetitive tasks** to improve efficiency
- **Provide technical validation** for claims requiring calculation

## Available Tools

- **Python REPL**: Execute Python code for calculations, data analysis, and scripting
- **Libraries available**: pandas, numpy, matplotlib, requests, json, and standard library

## Output Format

- **Clear explanations** of what you're doing and why
- **Well-commented code** that demonstrates your methodology
- **Interpreted results** that connect back to the research question
- **Actionable insights** that other agents can use in their work

Remember: Your role is to enhance the research process through computational power and data analysis. Focus on accuracy, clarity, and providing valuable technical insights that support the overall research goals.

Current time: {{ CURRENT_TIME }}`,

  reporter: `You are a reporter agent responsible for synthesizing research findings into comprehensive, well-structured reports. Your role is to create the final output that users will read and rely on.

## Core Responsibilities

1. **Synthesize research findings** from multiple agents into coherent reports
2. **Structure information logically** for maximum clarity and usefulness
3. **Maintain high standards** for accuracy, readability, and professionalism
4. **Adapt tone and style** based on the specified report style and locale

## Report Structure

Every report should follow this format:

### 1. Key Points
- **Bulleted list** of the most important findings
- **3-5 key takeaways** that answer the core research question
- **Actionable insights** that users can immediately understand

### 2. Overview
- **Brief introduction** to the topic (2-3 paragraphs)
- **Context and background** necessary for understanding
- **Scope of the research** and methodology overview

### 3. Detailed Analysis
- **Multiple sections** organized by themes or aspects
- **In-depth exploration** of findings from the research
- **Supporting evidence** and examples
- **Multiple perspectives** when relevant

### 4. Survey Note (Optional)
- **For comprehensive reports** that cover broad topics
- **Summary of methodology** and research approach
- **Acknowledgment of scope and limitations**

### 5. Key Citations
- **All references** listed at the end
- **Format**: - [Source Title](URL)
- **Empty line between each citation** for readability
- **NO inline citations** in the main text

## Writing Guidelines

### Style Adaptation
{% if locale.startswith('zh') %}
- Use clear, professional Chinese appropriate for the mainland China context
- Employ proper Chinese academic and business writing conventions
- Include relevant cultural context and local perspectives
{% elif locale.startswith('es') %}
- Write in clear, professional Spanish
- Consider regional variations when appropriate
- Include relevant cultural context for Spanish-speaking audiences
{% elif locale.startswith('fr') %}
- Use clear, professional French
- Follow French academic and professional writing conventions
- Include relevant Francophone perspectives and context
{% else %}
- Use clear, professional English
- Write for an international English-speaking audience
- Include diverse global perspectives when relevant
{% endif %}

### Report Style Adaptation
{% if report_style == "popular_science" %}
- Use engaging, accessible language that makes complex topics understandable
- Include analogies and examples to clarify difficult concepts
- Maintain scientific accuracy while being approachable
- Focus on practical implications and real-world applications
{% elif report_style == "news" %}
- Lead with the most newsworthy and current information
- Use journalistic structure with clear lead paragraphs
- Focus on recent developments, trends, and timely aspects
- Include quotes and expert opinions when available
- Emphasize what's new, significant, or surprising
{% elif report_style == "social_media" %}
- Use conversational, authentic voice with personality and wit
- Include relevant emojis to enhance meaning and visual appeal 🧵📊💡
- Create "thread-worthy" content with clear progression and payoff
- End with engagement prompts: "What do you think?", "Retweet if you agree"
{% endif %}
{% else %}
- Use a professional tone.
{% endif %}
- Be concise and precise.
- Avoid speculation.
- Support claims with evidence.
- Clearly state information sources.
- Indicate if data is incomplete or unavailable.
- Never invent or extrapolate data.

## Formatting Guidelines

### Visual Structure
- **Use proper markdown syntax** throughout
- **Include headers** for sections and subsections
- **Use horizontal rules (---)** to separate major sections
- **Add emphasis** for important points using **bold** and *italics*
- **Structure content** for easy scanning and reading

### Table Usage (Priority)
- **PRIORITIZE using Markdown tables** for data presentation and comparison
- **Use tables whenever presenting**: comparative data, statistics, features, options, pros/cons
- **Structure tables** with clear headers and aligned columns
- **Example format**:

| Feature | Description | Pros | Cons |
|---------|-------------|------|------|
| Feature 1 | Description 1 | Pros 1 | Cons 1 |
| Feature 2 | Description 2 | Pros 2 | Cons 2 |

### Content Enhancement
- **Include links** to relevant resources and tools
- **Use lists** for clarity and organization
- **Add inline code** for technical terms when appropriate
- **Include images from previous steps** when available and helpful

## Quality Standards

- **Accuracy**: Every claim must be supported by research findings
- **Completeness**: Address all aspects of the research question
- **Clarity**: Write for the intended audience with appropriate complexity
- **Objectivity**: Present balanced perspectives and acknowledge limitations
- **Usefulness**: Provide actionable insights and practical value

## Final Checklist

Before submitting your report:
- ✅ All key findings are included and properly structured
- ✅ Writing style matches the specified report style and locale
- ✅ Tables are used for comparative data and statistics
- ✅ No inline citations (all references in Key Citations section)
- ✅ Professional formatting with clear headers and structure
- ✅ Content is accurate, complete, and useful for the reader

Remember: You are creating the final product that represents the quality and value of the entire research process. Excellence in synthesis, clarity, and presentation is your primary goal.

Current time: {{ CURRENT_TIME }}
Report style: {{ report_style }}
Locale: {{ locale }}`
};

// Default general settings
const DEFAULT_GENERAL_SETTINGS = {
  autoAcceptedPlan: false,
  enableDeepThinking: false,
  enableBackgroundInvestigation: false,
  maxPlanIterations: 1,
  maxStepNum: 3,
  maxSearchResults: 3,
  reportStyle: "academic" as const,
};

// Create default flow
const createDefaultFlow = (): Flow => ({
  id: "default",
  name: "Default Flow",
  isDefault: true,
  description: "The original DeerFlow research workflow with standard settings and prompts.",
  prompts: DEFAULT_PROMPTS,
  generalSettings: DEFAULT_GENERAL_SETTINGS,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// Updated SettingsState type
export type SettingsState = {
  flows: Flow[];
  activeFlowId: string;
  mcp: {
    servers: MCPServerMetadata[];
  };
};

// Default settings with flow structure
const DEFAULT_SETTINGS: SettingsState = {
  flows: [createDefaultFlow()],
  activeFlowId: "default",
  mcp: {
    servers: [],
  },
};

export const useSettingsStore = create<SettingsState>(() => ({
  ...DEFAULT_SETTINGS,
}));

export const useSettings = (key: keyof SettingsState) => {
  return useSettingsStore((state) => state[key]);
};

export const changeSettings = (settings: SettingsState) => {
  useSettingsStore.setState(settings);
};

export const loadSettings = () => {
  if (typeof window === "undefined") {
    return;
  }
  const json = localStorage.getItem(SETTINGS_KEY);
  if (json) {
    try {
      const settings = JSON.parse(json);
      
      // Migration: Convert old settings structure to flow-based structure
      if (settings.general && settings.prompts && !settings.flows) {
        console.log("Migrating legacy settings to flow-based structure");
        const migratedSettings: SettingsState = {
          flows: [{
            id: "default",
            name: "Default Flow",
            isDefault: true,
            description: "Migrated from your previous settings",
            prompts: settings.prompts,
            generalSettings: settings.general,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }],
          activeFlowId: "default",
          mcp: settings.mcp || { servers: [] },
        };
        useSettingsStore.setState(migratedSettings);
        saveSettings(); // Save the migrated structure
        return;
      }

      // Handle new flow-based structure
      if (settings.flows && Array.isArray(settings.flows)) {
        // Ensure default flow exists
        const hasDefaultFlow = settings.flows.some((flow: Flow) => flow.isDefault);
        if (!hasDefaultFlow) {
          settings.flows.unshift(createDefaultFlow());
        }

        // Ensure activeFlowId is valid
        const validFlowIds = settings.flows.map((flow: Flow) => flow.id);
        if (!settings.activeFlowId || !validFlowIds.includes(settings.activeFlowId)) {
          settings.activeFlowId = settings.flows.find((flow: Flow) => flow.isDefault)?.id || settings.flows[0]?.id || "default";
        }

        // Ensure MCP settings exist
        if (!settings.mcp) {
          settings.mcp = { servers: [] };
        }

        useSettingsStore.setState(settings);
      } else {
        // Invalid structure, reset to defaults
        console.warn("Invalid settings structure, resetting to defaults");
        useSettingsStore.setState(DEFAULT_SETTINGS);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      useSettingsStore.setState(DEFAULT_SETTINGS);
    }
  }
};

export const saveSettings = () => {
  const latestSettings = useSettingsStore.getState();
  const json = JSON.stringify(latestSettings);
  localStorage.setItem(SETTINGS_KEY, json);
};

export const getChatStreamSettings = () => {
  let mcpSettings:
    | {
        servers: Record<
          string,
          MCPServerMetadata & {
            enabled_tools: string[];
            add_to_agents: string[];
          }
        >;
      }
    | undefined = undefined;
  const { mcp, activeFlowId, flows } = useSettingsStore.getState();
  const activeFlow = getActiveFlow();
  const mcpServers = mcp.servers.filter((server) => server.enabled);
  
  if (mcpServers.length > 0) {
    mcpSettings = {
      servers: mcpServers.reduce((acc, cur) => {
        const { transport, env } = cur;
        let server: SimpleMCPServerMetadata;
        if (transport === "stdio") {
          server = {
            name: cur.name,
            transport,
            env,
            command: cur.command,
            args: cur.args,
          };
        } else {
          server = {
            name: cur.name,
            transport,
            env,
            url: cur.url,
          };
        }
        return {
          ...acc,
          [cur.name]: {
            ...server,
            enabled_tools: cur.tools.map((tool) => tool.name),
            add_to_agents: ["researcher"],
          },
        };
      }, {}),
    };
  }
  
  return {
    ...activeFlow.generalSettings,
    mcpSettings,
    customPrompts: activeFlow.prompts,
  };
};

// Phase 1.2: Flow Management Functions

export function createFlow(name: string, basedOn?: Flow): Flow {
  const baseFlow = basedOn || getActiveFlow();
  const newFlow: Flow = {
    id: nanoid(),
    name,
    isDefault: false,
    description: `Custom flow based on ${baseFlow.name}`,
    prompts: { ...baseFlow.prompts },
    generalSettings: { ...baseFlow.generalSettings },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  useSettingsStore.setState((state) => ({
    ...state,
    flows: [...state.flows, newFlow],
    activeFlowId: newFlow.id,
  }));
  saveSettings();
  return newFlow;
}

export function updateFlow(flowId: string, updates: Partial<Omit<Flow, 'id' | 'isDefault' | 'createdAt'>>): void {
  useSettingsStore.setState((state) => ({
    ...state,
    flows: state.flows.map(flow => 
      flow.id === flowId 
        ? { ...flow, ...updates, updatedAt: new Date().toISOString() }
        : flow
    ),
  }));
  saveSettings();
}

export function deleteFlow(flowId: string): void {
  const state = useSettingsStore.getState();
  const flowToDelete = state.flows.find(flow => flow.id === flowId);
  
  // Protect default flow
  if (flowToDelete?.isDefault) {
    console.warn("Cannot delete default flow");
    return;
  }

  const remainingFlows = state.flows.filter(flow => flow.id !== flowId);
  
  // If deleting active flow, switch to default
  let newActiveFlowId = state.activeFlowId;
  if (state.activeFlowId === flowId) {
    newActiveFlowId = remainingFlows.find(flow => flow.isDefault)?.id || remainingFlows[0]?.id || "default";
  }

  useSettingsStore.setState({
    ...state,
    flows: remainingFlows,
    activeFlowId: newActiveFlowId,
  });
  saveSettings();
}

export function setActiveFlow(flowId: string): void {
  const state = useSettingsStore.getState();
  const flowExists = state.flows.some(flow => flow.id === flowId);
  
  if (flowExists) {
    useSettingsStore.setState({
      ...state,
      activeFlowId: flowId,
    });
    saveSettings();
  } else {
    console.warn(`Flow with id ${flowId} does not exist`);
  }
}

export function getActiveFlow(): Flow {
  const { flows, activeFlowId } = useSettingsStore.getState();
  return flows.find(flow => flow.id === activeFlowId) || flows.find(flow => flow.isDefault) || flows[0] || createDefaultFlow();
}

export function getAllFlows(): Flow[] {
  return useSettingsStore.getState().flows;
}

export function getFlowById(flowId: string): Flow | undefined {
  return useSettingsStore.getState().flows.find(flow => flow.id === flowId);
}

// Updated functions for flow-based prompt editing
export function setPrompt(agentName: keyof Flow["prompts"], content: string, flowId?: string): void {
  const targetFlowId = flowId || useSettingsStore.getState().activeFlowId;
  
  useSettingsStore.setState((state) => ({
    ...state,
    flows: state.flows.map(flow => 
      flow.id === targetFlowId 
        ? { 
            ...flow, 
            prompts: { ...flow.prompts, [agentName]: content },
            updatedAt: new Date().toISOString()
          }
        : flow
    ),
  }));
  saveSettings();
}

export function resetPrompt(agentName: keyof Flow["prompts"], flowId?: string): void {
  const targetFlowId = flowId || useSettingsStore.getState().activeFlowId;
  
  useSettingsStore.setState((state) => ({
    ...state,
    flows: state.flows.map(flow => 
      flow.id === targetFlowId 
        ? { 
            ...flow, 
            prompts: { ...flow.prompts, [agentName]: DEFAULT_PROMPTS[agentName] },
            updatedAt: new Date().toISOString()
          }
        : flow
    ),
  }));
  saveSettings();
}

export function resetAllPrompts(flowId?: string): void {
  const targetFlowId = flowId || useSettingsStore.getState().activeFlowId;
  
  useSettingsStore.setState((state) => ({
    ...state,
    flows: state.flows.map(flow => 
      flow.id === targetFlowId 
        ? { 
            ...flow, 
            prompts: { ...DEFAULT_PROMPTS },
            updatedAt: new Date().toISOString()
          }
        : flow
    ),
  }));
  saveSettings();
}

// Updated functions for flow-based general settings
export function setReportStyle(
  value: "academic" | "popular_science" | "news" | "social_media",
  flowId?: string
): void {
  const targetFlowId = flowId || useSettingsStore.getState().activeFlowId;
  
  useSettingsStore.setState((state) => ({
    ...state,
    flows: state.flows.map(flow => 
      flow.id === targetFlowId 
        ? { 
            ...flow, 
            generalSettings: { ...flow.generalSettings, reportStyle: value },
            updatedAt: new Date().toISOString()
          }
        : flow
    ),
  }));
  saveSettings();
}

export function setEnableDeepThinking(value: boolean, flowId?: string): void {
  const targetFlowId = flowId || useSettingsStore.getState().activeFlowId;
  
  useSettingsStore.setState((state) => ({
    ...state,
    flows: state.flows.map(flow => 
      flow.id === targetFlowId 
        ? { 
            ...flow, 
            generalSettings: { ...flow.generalSettings, enableDeepThinking: value },
            updatedAt: new Date().toISOString()
          }
        : flow
    ),
  }));
  saveSettings();
}

export function setEnableBackgroundInvestigation(value: boolean, flowId?: string): void {
  const targetFlowId = flowId || useSettingsStore.getState().activeFlowId;
  
  useSettingsStore.setState((state) => ({
    ...state,
    flows: state.flows.map(flow => 
      flow.id === targetFlowId 
        ? { 
            ...flow, 
            generalSettings: { ...flow.generalSettings, enableBackgroundInvestigation: value },
            updatedAt: new Date().toISOString()
          }
        : flow
    ),
  }));
  saveSettings();
}

// New flow-specific general settings functions
export function setMaxPlanIterations(value: number, flowId?: string): void {
  const targetFlowId = flowId || useSettingsStore.getState().activeFlowId;
  
  useSettingsStore.setState((state) => ({
    ...state,
    flows: state.flows.map(flow => 
      flow.id === targetFlowId 
        ? { 
            ...flow, 
            generalSettings: { ...flow.generalSettings, maxPlanIterations: value },
            updatedAt: new Date().toISOString()
          }
        : flow
    ),
  }));
  saveSettings();
}

export function setMaxStepNum(value: number, flowId?: string): void {
  const targetFlowId = flowId || useSettingsStore.getState().activeFlowId;
  
  useSettingsStore.setState((state) => ({
    ...state,
    flows: state.flows.map(flow => 
      flow.id === targetFlowId 
        ? { 
            ...flow, 
            generalSettings: { ...flow.generalSettings, maxStepNum: value },
            updatedAt: new Date().toISOString()
          }
        : flow
    ),
  }));
  saveSettings();
}

export function setMaxSearchResults(value: number, flowId?: string): void {
  const targetFlowId = flowId || useSettingsStore.getState().activeFlowId;
  
  useSettingsStore.setState((state) => ({
    ...state,
    flows: state.flows.map(flow => 
      flow.id === targetFlowId 
        ? { 
            ...flow, 
            generalSettings: { ...flow.generalSettings, maxSearchResults: value },
            updatedAt: new Date().toISOString()
          }
        : flow
    ),
  }));
  saveSettings();
}

loadSettings();
