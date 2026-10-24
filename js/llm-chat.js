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
        ],
        "backbone": [
            "1 — Amazon Relay: Pushed Back on Chatbot-First AI Direction\n\n**S:** The Middle Mile Relay team's AI roadmap defaulted to layering a conversational assistant on top of existing carrier workflows.\n**T:** As a designer 5 weeks in, I had to challenge to gain enough context and work with existing stakeholders to form a tangible direction.\n**A:** I put together a comparative brief grounded in freight carrier research sessions I ran with UXR showing that AI as a dispatch-time cognitive aid — not a post-hoc assistant — was where the actual error reduction lived. I stated: *\"This approach won't meaningfully reduce operator errors and will erode trust in AI when it underperforms.\"* Existing stakeholders wished to continue on pushing for production of Relay Assistant with minimal UX involvement.\n**R:** The north star AI visions I created along with an existing designer shifted the conversation from feature-level to systems-level AI thinking and how to produce a meaningful outcome for a MLP.",
            "2 — Blue Origin: Disagreed with FAQ Bot Scope and modern AI as whole, Committed and Built BlueGPT\n\n**S:** Blue Origin's chatbot (pre chatgpt AI craze) roadmap called for a narrow FAQ chatbot to help engineers find documentation faster using existing non-AI systems. It had executive sponsorship. AI was pushed back heavily as too new.\n**T:** I believed the real problem — engineers making $250K-per-instance errors from conflicting documents — wouldn't be touched by a search interface.\n**A:** I formally challenged the scope to my VP and the director: *\"We're solving for discoverability. The actual problem is document conflict resolution under uncertainty.\"* They disagreed and held the course. I committed to the FAQ bot work while simultaneously prototyping an LLM-native document engine on my own time with my principle engineer. I showed it at a design review to the right audience — without going around leadership, but using legitimate internal forums.\n**R:** The prototype became BlueGPT, which shipped as an LLM document engine and saved up to $250K per incident. My disagreement became the eventual product which is now the face of one of the most visible internal software products.",
            "3 — Blue Origin: Opposed Cosmetic Design System Refresh, Advocated for complete mandate of DS use\n\n**S:** When the design system overhaul was scoped, leadership wanted no design system at all - as a point of efficiency.\n**T:** I disagreed. With tooling already on the product roadmap, I believed building a shallow cosmetic system would create retrofit debt the moment we introduced new systems similar to Meridian.\n**A:** I brought a written case to the design director arguing that we needed native tokens — components built scale across orgs and multiple modalities. I laid out what the retrofit cost would look like if we did the cosmetic version first. I was overruled on timeline — we'd do a phased approach starting with visuals. I fully committed to Phase 1 while advocating loudly for Phase 2 to be written into the roadmap immediately, which it was.\n**R:** When BlueKit launched, the components were already in the system. We didn't retrofit. Buy-in spread quickly through project support & office hours, growing past 50 applications. CSAT grew by 15% in the first quarter.",
            "4 — Actuate Ventures: Pushed Back on a Startup's MVP Scope That Would Have Burned Runway\n\n**S:** A portfolio company wanted to build a full-featured v1 with an admin portal, user-facing product, and analytics dashboard — all for an initial release with a tight runway window.\n**T:** As their design lead and GP, I disagreed that this was survivable. They needed signal, not surface area.\n**A:** In a founder session, I went on record: *\"If you build all three, you'll ship nothing investors can evaluate. I recommend we cut the admin portal and analytics from v1 entirely.\"* The founder pushed back — investors had specifically mentioned the analytics view. I held my position with user research backing it, pointing out that zero users meant zero analytics to show. Eventually we aligned on a stripped scope. I committed completely: I led the cut and made sure the engineering team didn't spend a day on deprioritized work.\n**R:** The product shipped on timeline. Operational costs dropped 30% for the client post-launch, and the fund used the outcome as portfolio validation in our next LP update.",
            "5 — RoundGlass: Challenged Data Architecture Decisions That Would Have Broken the Analytics UX\n\n**S:** Engineering proposed a data pipeline architecture for the predictive analytics platform that would have required the UI to display stale data with no freshness indicator — a common but user-trust-eroding pattern.\n**T:** I disagreed that this was acceptable for a wellness platform where users made health decisions based on data recency.\n**A:** I brought the issue to the engineering lead and PM directly, outside the sprint, before it got locked in: *\"We cannot show health metrics without data freshness context. Users will make decisions on stale data and attribute failures to the product, not the pipeline.\"* Engineering felt the API redesign wasn't their problem to solve. I wrote the UX requirements for freshness states into the acceptance criteria so it couldn't be descoped without an explicit decision. I also prototyped the fallback — a graceful degraded state — so engineering had a low-cost path to compliance.\n**R:** The freshness indicator shipped. Load times were already reduced 95% from the architecture work, and we avoided a wave of user trust complaints that would have undermined adoption metrics.",
            "6 — Digital 2020 / Real Benefits HR: Disagreed with Client's Low-Fidelity Approach for a High-Stakes Workforce Product\n\n**S:** The client wanted to ship a basic form-based HR management product to 50,000+ workers in high-risk industries. Fast and cheap. They didn't want user research — they wanted wireframes delivered in week one.\n**T:** I believed that skipping research on a product used by warehouse and field workers for benefits access was a compliance and usability risk, not just a design quality issue.\n**A:** I told the client directly: *\"I won't design this without at least a lightweight research sprint. If workers can't access benefits because the UX fails them, that's a legal and reputational exposure for you, not just a bad NPS score.\"* They pushed back on timeline and budget. I proposed a compressed research format — five interviews and a workflow audit — that fit in three days. They agreed reluctantly. I committed to the accelerated timeline and hit it.\n**R:** The interviews surfaced three critical workflow mismatches that would have blocked benefits access for a segment of their workforce. We designed around them. The admin dashboard shipped with measurably improved process transparency and I held the line on quality without blowing the project timeline."
        ],
        "ownership": [
            "1 — Blue Origin: Self-Assigned Enterprise Design System Across 50+ Apps Nobody Owned\n\n**S:** The design system at Blue Origin existed as a loose Figma library nobody maintained. Fifty-plus applications were diverging in pattern, and no one had accountability for it.\n**T:** This wasn't my direct mission. I was asked to ship product work for specific applications with the goal of launching rockets .\n**A:** I mapped 50+ apps, audited inconsistencies, and drafted a governance model. I then did something unusual for a designer: I co-wrote React component documentation with engineering so that developers could implement standards without reinterpreting them. I set up recurring cross-team reviews, escalated adoption blockers to director level, and absorbed scope from team members who were nominally contributing but not driving.\n**R:** Development scoped points dropped 28% for P0 project. The system became the infrastructure that made the eventual BlueGPT's AI component integration possible without a redesign.",
            "2 — Amazon Relay: Took ownership of multiple product features on short notice\n\n**S:** On the Relay, three complex products needed direct support: Relay chatbot assistant, customer secure onboarding verification, safety reward dashcam program\n**T:** Ramp up quick and provide tangible deliverables before handing back to designer who was ramping back up from leave.\n**A:** I took it on. Met with key stakeholders, consumed internal documents, built out pseudo AI personas to rapidly prototype designs, and provide value\n**R:** Produced a workflow for automated user testing that would take UX designers and UXR hours of UAT down to passive AI task that can be run during downtime.",
            "3 — Actuate Ventures: Owned Entire Product Lifecycle for a Startup With No PM\n\n**S:** A portfolio hardware/software startup had engineers, a founder, and a runway constraint — no PM, no design process, no research.\n**T:** I was the GP advising, not the product lead. But no one else was going to do it.\n**A:** I ran JTBD user research, synthesized findings, defined the roadmap, designed end-to-end in Figma, and embedded in their sprints as the de facto product owner. When scope threatened the runway window, I made the cuts — not the founder. When decisions required business context beyond design, I escalated to the investor group rather than waiting for the founder to resolve blockers.\n**R:** Operational costs dropped 30% post-launch. It shipped on time. I turned this into a documented design-to-delivery playbook for other portfolio companies.",
            "4 — Blue Origin: Owned Onboarding UX for Hardware Applications Nobody Was Advocating For\n\n**S:** Blue Origin's internal recruitment and onboarding applications had deteriorating UX. They weren't tied to any major product initiative — just quietly failing engineers and new hires.\n**T:** No product manager was assigned to centralized internal tooling. There was no roadmap for it.\n**A:** I added it to my work scope without being asked. I ran user research with new engineering hires to document their friction points, identified that onboarding completion rates were impacting time-to-productivity for critical roles, and redesigned the core flows. I built the case for the work by quantifying productivity loss, which got me 20% of my sprint capacity to address it.\n**R:** Onboarding and recruitment experiences measurably improved, directly reducing time-to-productivity for engineering hires in a period when Blue Origin needed to staff manufacturing programs quickly.",
            "5 — Digital 2020: Owned Marketo Automation Failure That Originated Outside My Scope\n\n**S:** A marketing automation project at D2020 was producing poor campaign results. The initial diagnosis was that the UX needed improvement — but the real failure was upstream in the Marketo workflow logic and data hygiene.\n**T:** The workflow architecture was owned by a different consultant. My scope was the interface layer.\n**A:** I didn't limit myself to the brief. I traced the performance failure back to the workflow and identified that campaign setup errors were systematic — users were making the same mistakes because the tool gave no feedback on misconfiguration. I redesigned both the interface and rewrote the automation handoff logic, then worked directly in Marketo to validate the fix.\n**R:** Campaign setup time dropped from one week to one day. Marketing ROI increased 80%. The client credited the outcome to UX improvements, but it was actually end-to-end ownership that solved it.",
            "6 — Edifecs: Owned Accessibility Compliance Nobody Was Tracking\n\n**S:** Edifecs's corporate intranet and admin portals had no WCAG compliance tracking. IT support was drowning in accessibility-related tickets but no one had mapped the cause.\n**T:** Accessibility compliance wasn't a stated design priority — there was no executive mandate and no budget allocated to it.\n**A:** I audited the intranet independently, mapped WCAG 2.1 AA violations to specific ticket categories, and built the business case for remediation by correlating accessibility failures to IT support volume. I presented the case to leadership, got a small allocation, and then led the full remediation across the intranet and admin portals.\n**R:** IT support tickets dropped 80%. I turned an invisible compliance risk into a documented organizational improvement and set the accessibility baseline that all future product work at the company was held to."
        ],
        "think_big": [
            "1 — Amazon Relay: North Star AI Vision for Scaling to millions\n\n**S:** My Relay mandate was Relay Rewards — a bounded product for 90%+ drivers and operators. I saw that AI capabilities being built for carrier experience were isolated per team with no connective vision. Multiple chatbots could be found on the platform doing different tasks\n**T:** Nobody asked me to look beyond my scope. I was 5 weeks in.\n**A:** I created a north star vision document showing how AI patterns from carrier UX could scale across Amazon's logistics network to millions of customers. 'One Relay'. I mapped when AI should surface recommendations vs. defer to operators, how to build trust scaffolding for AI-assisted workflows, and what component architecture would need to look like to serve radically different operator types (driver, dispatcher, network planner) from a unified system. I presented it as an unsolicited strategic artifact to design leadership.\n**R:** I passed these documents to warm reception to the direct team 'You got my brain thinking things I have never thought before...'",
            "2 — Blue Origin: Reframed the Design System as the Interface Layer for Human-AI Collaboration in Aerospace\n\n**S:** The design system project was scoped as a visual standardization effort — component cleanup, pattern consistency. Tactical.\n**T:** I saw it as something larger: the foundation through which AI would eventually be introduced to aerospace workers. Build it wrong now and every AI integration would require a costly, dangerous retrofit in safety-critical contexts.\n**A:** I reframed the project in every executive-facing presentation as: *\"We are building the human interface layer for an AI-assisted aerospace operation.\"* I pushed for AI-native design tokens — components built for probabilistic content, uncertainty, and confidence states — years before this was industry standard. I documented interaction patterns for explainability surfaces and error-state design for AI recommendations.\n**R:** When Blue Kit launched, the system was already ready for AI-generated content states. No retrofit needed. Blue Kit shipped with design quality that directly contributed to $250K/instance savings.",
            "3 — Blue Origin: Proposed BlueGPT as an Enterprise Knowledge Graph, Not a Chat Tool\n\n**S:** When BlueGPT was gaining internal traction as an LLM document engine, stakeholders naturally wanted to position it as a chat interface for document lookup — a well-understood product category.\n**T:** I believed the transformative opportunity was much larger: treating BlueGPT as the foundation for an enterprise knowledge graph that could surface relationships across engineering documents, manufacturing procedures, and compliance records at a scale no human review process could match.\n**A:** I pitched a longer-horizon vision to the product and engineering leadership: BlueGPT as a layer that could eventually flag regulatory conflicts across document sets, identify design drift in manufacturing specs before it caused failures, and build institutional memory that persisted across team turnover. I documented this as a product strategy addendum alongside the immediate shipping roadmap — not as a replacement for near-term delivery, but as a 3-year directional stake in the ground.\n**R:** The immediate product shipped on its original scope. The longer-horizon framing influenced how the engineering team structured the data model — keeping it open to the graph expansion I'd described — rather than optimizing only for the chat retrieval use case.",
            "4 — Actuate Ventures: Positioned a Deep-Tech Startup's UX as Competitive Differentiation in a Hardware-First Industry\n\n**S:** One of the Actuate portfolio companies was building space hardware — a domain where product design is traditionally an afterthought. Their pitch narrative was entirely technical.\n**T:** I believed their biggest unlock wasn't better hardware specs — it was making their technology accessible and legible to non-technical buyers and operators, which was a market the technical founders were ignoring.\n**A:** I proposed and led a UX strategy reframe: design the operator interface and data visualization layer as a primary product, not a utility skin over the hardware. I built the case that in government and enterprise procurement, evaluators who couldn't *understand* the hardware would default to incumbents. I designed the interface to make their technology's advantages visible in the demo environment — not just the spec sheet.\n**R:** The reframe became part of the fund's advising playbook for hardware startups. We positioned UX as competitive moat in a sector that treated it as overhead, and it differentiated our portfolio companies in procurement conversations.",
            "5 — RoundGlass: Proposed Predictive Wellness as a Platform Shift, Not a Feature\n\n**S:** RoundGlass's analytics work was scoped as a reporting dashboard — a feature that admins could use to see engagement data.\n**T:** I saw that the underlying data model could support something much larger: a predictive engine that anticipated user wellness needs before the user articulated them, which would fundamentally change the product category.\n**A:** I designed and built the predictive analytics platform with the architecture of a recommendation engine, not a reporting tool — surfacing leading indicators rather than lagging metrics. I proposed to leadership that this capability, if invested in further, would shift the product from a wellness *tracker* to a wellness *advisor*, which was a different competitive category entirely. I built the prototype fast enough that the 95% load time improvement validated the technical feasibility before leadership had to commit resources to the full vision.\n**R:** The load time improvement (95% reduction) was the headline metric, but the architectural direction I set enabled RoundGlass to pursue the predictive personalization roadmap as a platform differentiator.",
            "6 — W3C / Samsung: Pushed Accessibility Standards into New Display Form Factors Before Anyone Else Was\n\n**S:** Folding screens were entering the consumer market and no one had addressed what WCAG compliance meant for a screen that changed aspect ratio dynamically — creating a gap that would affect hundreds of millions of users as the form factor scaled.\n**T:** This wasn't my job. I was a contributor, not a W3C member leading the working group.\n**A:** I contributed specifications and considerations for folding screen display accessibility to the WCAG guidelines — documenting what content reflow, focus management, and touch target sizing requirements should look like when the physical screen geometry changed mid-session. I also presented on this at Samsung's UX Talk on space technologies, linking the principles to novel display environments where standard assumptions break down.\n**R:** My contributions were incorporated into W3C accessibility considerations for this display category — setting a standard that would govern how billions of dollars of future product development would approach accessibility in a new form factor, long before it became a mainstream design concern."
        ],
        "amazon_cheat_sheet": [
            "## Cheat Sheet: Which Story to Use When\n\n| LP | Best opener | Most L7-signal story |\n| :-- | :-- | :-- |\n| **Backbone** | Amazon Relay AI challenge (shows speed + conviction in new role) | Blue Origin BlueGPT (high stakes, overruled, built the vision anyway) |\n| **Ownership** | Blue Origin Design System (spans 50+ apps, self-assigned) | D2020 Marketo (went beyond scope to fix the real root cause) |\n| **Think Big** | Amazon Relay North Star AI (millions of customers, 5 weeks in) | Blue Origin human-AI interface layer (years ahead of industry) |"
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
        let prompt = `You are an intelligent chatbot for Christopher Le Nguyen's portfolio website.

[PROFILE CONTEXT]
- Strategic thinker combining design + VC business acumen
- UX engineering → design leadership → product management → VC managing partner
- Expertise: design systems, product strategy, AI/LLM, enterprise UX, accessibility (WCAG 3.0 APCA)
- Technical: HTML/CSS/JavaScript, Figma, Cursor AI, LLM integration
- Leadership: Led 10+ engineers, VC managing partner, portfolio company advisor
- Domain: Deep-tech/space-tech, aerospace engineering, startup operations, HCD
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
