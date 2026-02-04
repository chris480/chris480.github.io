/**
 * LLM-Powered Chat Integration
 * Intelligent Q&A system using OpenRouter API with knowledge base matching
 */

(function() {
    'use strict';

    // Knowledge Base - Predefined answers organized by category
    const knowledgeBase = {
        // Strategic thinking & product impact
        "strategic_thinking": [
            "I combine design expertise with VC business acumen—I understand both user value and business viability. At Blue Origin, I designed systems serving complex aerospace engineering constraints while maintaining usability. Every design decision is traced back to measurable impact and business ROI.",
            "My career progression from UX engineering → design leadership → product management → VC managing partner shows strategic scope beyond tactical execution. I evaluate market opportunities, product-market fit, and go-to-market strategies, not just design execution.",
            "I bring disciplined prioritization from my VC background. I regularly evaluate startup roadmaps, balancing technical feasibility, user needs, market timing, and resource constraints. Every decision matters when resources are tight."
        ],

        // AI & LLM capabilities
        "ai_llm": [
            "I'm hands-on with LLM integration and API optimization. Currently building an AI-powered Q&A system using OpenRouter and DeepSeek V3. My approach: intelligent selection from curated answers rather than pure generation—balancing control with intelligence while optimizing costs.",
            "I think about AI as a design material, not just a feature to add. The goal is making AI feel reliable, interpretable, and trustworthy through design. This means understanding model capabilities and limitations, prompt engineering, and knowing when to use predefined answers vs. generative responses.",
            "I've explored conversational AI, prompt engineering, and model selection extensively. My philosophy: make informed trade-offs between model intelligence, cost, and latency. Strong views on modern AI shaped by hands-on implementation work."
        ],

        // Design systems & scalability
        "design_systems": [
            "I led design systems at Blue Origin for aerospace products, achieving organization-wide adoption. This included design tokens, component libraries, governance models, and technical implementation. I understand how to scale beyond a single designer's control while maintaining consistency and enabling evolution.",
            "Design systems are fundamentally about enabling teams. I've worked with both high-level strategy (tokens, architecture) and ground-level implementation (coded components, documentation). Reduced development cycles from months to days through systematic approaches.",
            "My systems thinking spans visual design (typography, color, layout), technical architecture (tokens, components), and organizational adoption (change management, training, governance). Design systems enable 10x scaling of impact."
        ],

        // Enterprise & B2B experience
        "enterprise_b2b": [
            "I've designed for complex B2B environments: PEO platforms with payroll/tax/HR compliance, aerospace design systems, VC portfolio operations. I understand multi-user systems, role-based access, organizational hierarchies, and regulatory constraints—not just consumer UX.",
            "Enterprise design requires understanding organizational rollout, change management, compliance, and security implications. I've guided teams through organizational transformation where every decision has organizational ripple effects.",
            "B2B experience spans admin panels, configuration interfaces, permission systems, and operational workflows. I understand the difference between designing for individual users vs. designing for organizational adoption and scale."
        ],

        // Technical depth & implementation
        "technical_implementation": [
            "I'm both a design leader and UI engineer. I code: HTML/CSS/JavaScript for production sites, React understanding, GitHub portfolio with open-source examples. I use Cursor AI for assisted development and can implement designs or collaborate closely with engineering teams.",
            "Technical knowledge enables better design. I understand API design, performance constraints, accessibility implementation (WCAG 3.0 APCA), and can have detailed technical conversations with engineering teams. Currently implementing LLM integration with cost optimization and proper error handling.",
            "I thrive at the intersection of design and engineering. Aerospace background means I understand constraints deeply—designing within feasibility while pushing innovation. Can move between high-level strategy and tactical implementation."
        ],

        // Leadership & collaboration
        "leadership_collaboration": [
            "I lead through influence, not authority. As VC managing partner, I advise portfolio companies without direct control. Core principle: make sure everyone's voice is heard. I believe in collaborative culture, empowerment, and building trust for difficult conversations.",
            "I've led 10+ front-end engineers with focus on quality, accessibility, and user experience. Mentorship style is hands-on but independence-enabling. Currently advising multiple portfolio companies on product strategy and market positioning.",
            "I operate effectively at multiple scales: startup individual contributor, leading teams at large aerospace org, VC managing partner role. The constant: influence through design thinking, data, and genuine collaboration."
        ],

        // Zero-to-one product work
        "zero_to_one": [
            "I thrive in ambiguity. I designed PEO platforms from scratch. VC work is fundamentally zero-to-one evaluation. Startup experience where every decision matters taught me to move fast, adapt quickly, never lose sight of what really matters.",
            "My approach: start with hypothesis → iterate → let requirements emerge through research. Lean validation, MVP thinking, hypothesis testing. Balance research rigor with speed to learning. Use prototyping to validate before building.",
            "I'm comfortable with changing requirements, pivots, and high-pressure launches. I help startups move from months-long cycles to launching in days. Rapid iteration based on feedback and data is second nature."
        ],

        // Background & expertise overview
        "background_overview": [
            "I'm a UX design leader, product manager, and VC managing partner based in Seattle. Current focus: managing Actuate Ventures ($5M fund for deep-tech/space-tech startups) while building my design portfolio showcasing enterprise, B2B, and zero-to-one work.",
            "My career: UX engineering → design leadership → product management → venture capital. This progression reflects expansion from execution to strategy while maintaining deep technical skills and hands-on involvement.",
            "Expertise spans design systems, product strategy, AI/LLM integration, enterprise UX, advanced accessibility (WCAG 3.0 APCA), leadership, and deep-tech/space-tech domain knowledge. Rare combination of design thinking + technical depth + business acumen."
        ],

        // Accessibility & quality standards
        "quality_standards": [
            "My portfolio implements WCAG 3.0 APCA contrast (ahead of standards), maintains Lighthouse 95+ scores, and prioritizes accessibility as a quality metric, not compliance checkbox. Keyboard navigation, screen reader optimization, and thoughtful edge case handling are table stakes.",
            "Obsessive attention to detail: no layout shifts, comprehensive keyboard support, semantic HTML, design tokens for systematic thinking. I believe accessible design is inherently good design.",
            "Quality manifests throughout my work: technical implementation rigor, thoughtful interaction patterns, performance optimization, and design that scales. Details matter."
        ],

        // Aerospace & deep-tech domain
        "aerospace_deeptech": [
            "I bring aerospace engineering background and hands-on involvement in space-tech startups through Actuate Ventures. Understanding of orbital mechanics, propulsion systems, launch vehicle design, and manufacturing constraints inform investment theses and product strategy.",
            "Deep-tech experience spans design systems for aerospace products, payload operations, and complex engineering workflows. I understand the intersection of technical constraint and user needs in high-stakes environments.",
            "Space-tech focus: cislunar economy, commercial lunar operations, advanced propulsion, on-orbit manufacturing. Portfolio companies include Trimagnetix, Ultraview, Wave Motion, Charter Space, and others. Genuine expertise from both theory and practice."
        ],

        // Generic helpful response
        "general_help": [
            "I'm happy to answer questions about my background, expertise, fit for specific roles, or anything about the intersection of design, product, and technology. Feel free to ask about design systems, product strategy, AI/LLM integration, VC work, or space-tech.",
            "What would you like to know? I can discuss my experience, explain why I'd be a great fit for specific roles, dive into technical details, or explore how my background relates to different domains.",
            "I'm here to help you understand my background and why I'd be valuable to your team or project. Ask me anything!"
        ]
    };

    // API Configuration
    const API_URL = 'https://api.chrisle.design';

    // State
    let jobSourceUrl = null;
    let isProcessing = false;

    // Initialize chat on DOM ready
    document.addEventListener('DOMContentLoaded', function() {
        const urlParams = new URLSearchParams(window.location.search);
        const showChat = urlParams.get('llm') === 'true';
        const sourceParam = urlParams.get('source');

        if (!showChat) {
            return; // Don't initialize if llm=true not present
        }

        // Show chat container
        const chatContainer = document.getElementById('llm-chat');
        if (chatContainer) {
            chatContainer.style.display = 'block';
        }

        // Store job source URL if provided
        if (sourceParam) {
            jobSourceUrl = sourceParam;
            updateSuggestedPromptsForJob();
        }

        // Initialize chat UI
        initializeChat();
    });

    /**
     * Initialize chat UI components
     */
    function initializeChat() {
        const chatForm = document.getElementById('chat-form');
        const chatInput = document.getElementById('chat-input');
        const promptButtons = document.querySelectorAll('.prompt-btn');

        if (!chatForm || !chatInput) {
            return;
        }

        // Auto-focus input
        setTimeout(() => {
            chatInput.focus();
        }, 100);

        // Form submission
        chatForm.addEventListener('submit', handleSubmit);

        // Prompt button clicks
        promptButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const prompt = btn.getAttribute('data-prompt');
                if (prompt) {
                    chatInput.value = prompt;
                    chatInput.focus();
                    handleSubmit(new Event('submit'));
                }
            });
        });

        // Enter key support (already handled by form submit)
        // Commented out - form submit already handles Enter key natively
        // chatInput.addEventListener('keydown', (e) => {
        //     if (e.key === 'Enter' && !e.shiftKey) {
        //         e.preventDefault();
        //         chatForm.dispatchEvent(new Event('submit'));
        //     }
        // });
    }

    /**
     * Handle form submission
     */
    async function handleSubmit(e) {
        e.preventDefault();

        if (isProcessing) {
            return;
        }

        const chatInput = document.getElementById('chat-input');
        const question = chatInput.value.trim();

        if (!question) {
            return;
        }

        // Clear input
        chatInput.value = '';
        chatInput.disabled = true;

        // Hide empty state
        const emptyState = document.getElementById('chat-empty-state');
        if (emptyState) {
            emptyState.style.display = 'none';
        }

        // Add user message
        addMessage('user', question);

        // Show typing indicator
        const typingId = addTypingIndicator();

        isProcessing = true;

        try {
            // Build system prompt
            const systemPrompt = buildSystemPrompt();

            // Call Cloudflare Worker API (proxies to OpenRouter)
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt
                        },
                        {
                            role: 'user',
                            content: question
                        }
                    ],
                    max_tokens: 400,
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Remove typing indicator
            removeTypingIndicator(typingId);

            // Parse response
            let answer;
            try {
                const content = data.choices[0]?.message?.content || '';
                
                // Strip markdown code block markers if present
                let jsonContent = content.trim();
                if (jsonContent.startsWith('```json')) {
                    jsonContent = jsonContent.replace(/^```json\s*/i, '').replace(/\s*```\s*$/, '');
                } else if (jsonContent.startsWith('```')) {
                    jsonContent = jsonContent.replace(/^```\s*/, '').replace(/\s*```\s*$/, '');
                }
                
                const parsed = JSON.parse(jsonContent.trim());
                answer = parsed.final_answer || content;
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                // Fallback: use raw content if JSON parsing fails
                answer = data.choices[0]?.message?.content || 'I apologize, but I encountered an error processing your question.';
                
                // TODO: For future use - regex extraction fallback if needed
                // If JSON parsing fails, try to extract just the final_answer if it's visible
                // const content = data.choices[0]?.message?.content || '';
                // const finalAnswerMatch = content.match(/"final_answer"\s*:\s*"([^"\\]*(\\.[^"\\]*)*)"/);
                // if (finalAnswerMatch) {
                //     answer = finalAnswerMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
                // } else {
                //     answer = content;
                // }
            }

            // Add assistant message
            addMessage('assistant', answer);

        } catch (error) {
            console.error('Chat error:', error);
            removeTypingIndicator(typingId);
            addMessage('assistant', 'I apologize, but I encountered an error. Please try again in a moment.');
        } finally {
            isProcessing = false;
            chatInput.disabled = false;
            chatInput.focus();
        }
    }

    /**
     * Build system prompt with knowledge base and optional job context
     */
    function buildSystemPrompt() {
        let prompt = `You are an intelligent chatbot for Christopher Nguyen's portfolio website.

[PROFILE CONTEXT]
- Strategic thinker combining design + VC business acumen
- UX engineering → design leadership → product management → VC managing partner
- Expertise: design systems, product strategy, AI/LLM, enterprise UX, accessibility (WCAG 3.0 APCA)
- Technical: HTML/CSS/JavaScript, Figma, Cursor AI, LLM integration
- Leadership: Led 10+ engineers, VC managing partner, portfolio company advisor
- Domain: Deep-tech/space-tech, aerospace engineering, startup operations
[END PROFILE CONTEXT]

[KNOWLEDGE BASE]
`;

        // Add knowledge base structure
        const categories = Object.keys(knowledgeBase);
        categories.forEach(category => {
            prompt += `\nCategory: ${category}\n`;
            knowledgeBase[category].forEach((answer, index) => {
                prompt += `  ${category}-${index}: ${answer}\n`;
            });
        });

        prompt += `[END KNOWLEDGE BASE]\n\n`;

        // Add job source URL if available
        if (jobSourceUrl) {
            prompt += `[JOB POSTING URL]
${jobSourceUrl}
[END JOB POSTING URL]

IMPORTANT: The visitor is asking about a specific job posting. Use the job URL above to understand the job requirements, company, responsibilities, and required skills. When answering questions, tailor your responses to show why Christopher would be exceptional for THIS specific role based on the job posting details.\n\n`;
        }

        prompt += `Your job: Understand the visitor's question and intelligently select the best predefined answer from the knowledge base. ${jobSourceUrl ? 'Adapt it to show why Christopher would be exceptional for THIS specific job based on the job posting URL provided above.' : ''}

Response format (MUST be valid JSON, no markdown):
{
  "choice": "category-index",
  "final_answer": "the selected answer, slightly tailored to directly address the question"
}`;

        return prompt;
    }

    /**
     * Update suggested prompts for job-specific context
     */
    function updateSuggestedPromptsForJob() {
        const promptsContainer = document.getElementById('suggested-prompts');
        if (!promptsContainer) return;

        promptsContainer.innerHTML = `
            <button class="prompt-btn" data-prompt="Why would you be exceptional for this role?">Why would you be exceptional for this role?</button>
            <button class="prompt-btn" data-prompt="How does your background match these requirements?">How does your background match these requirements?</button>
            <button class="prompt-btn" data-prompt="What would you bring to this company?">What would you bring to this company?</button>
        `;

        // Re-attach event listeners
        const promptButtons = promptsContainer.querySelectorAll('.prompt-btn');
        promptButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const prompt = btn.getAttribute('data-prompt');
                const chatInput = document.getElementById('chat-input');
                if (prompt && chatInput) {
                    chatInput.value = prompt;
                    chatInput.focus();
                    handleSubmit(new Event('submit'));
                }
            });
        });
    }

    /**
     * Add a message to the chat
     */
    function addMessage(role, content) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message chat-message-${role}`;
        messageDiv.setAttribute('role', role === 'user' ? 'user' : 'assistant');
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        
        messageDiv.appendChild(contentDiv);
        messagesContainer.appendChild(messageDiv);

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * Add typing indicator
     */
    function addTypingIndicator() {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return null;

        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message chat-message-assistant typing-indicator';
        typingDiv.id = 'typing-indicator';
        typingDiv.setAttribute('role', 'status');
        typingDiv.setAttribute('aria-live', 'polite');
        
        typingDiv.innerHTML = `
            <div class="message-content">
                <span class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </span>
            </div>
        `;
        
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        return 'typing-indicator';
    }

    /**
     * Remove typing indicator
     */
    function removeTypingIndicator(id) {
        const indicator = document.getElementById(id);
        if (indicator) {
            indicator.remove();
        }
    }
})();
