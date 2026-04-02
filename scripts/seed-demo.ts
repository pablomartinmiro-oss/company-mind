import { readFileSync } from 'fs';
import { resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx);
  const val = trimmed.slice(eqIdx + 1);
  process.env[key] = val;
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TENANT_ID = 'eb14e21e-1f61-44a2-a908-48b5b43303d9';

const now = new Date();
function hoursAgo(h: number) { return new Date(now.getTime() - h * 3600000).toISOString(); }
function daysAgo(d: number, h = 0) { return new Date(now.getTime() - (d * 86400000 + h * 3600000)).toISOString(); }

const calls = [
  {
    id: crypto.randomUUID(),
    tenant_id: TENANT_ID,
    contact_name: 'Sarah Chen',
    contact_ghl_id: 'demo-contact-001',
    source: 'ghl' as const,
    source_id: 'ghl-call-001',
    direction: 'outbound',
    duration_seconds: 1847,
    call_type: 'closing',
    status: 'complete' as const,
    called_at: hoursAgo(3),
    speaker_map: { A: 'rep', B: 'prospect' },
    transcript_text: `Rep: Sarah, great to connect again. I wanted to walk through the pilot results and talk next steps.
Prospect: Absolutely, we've been really impressed with the results so far.
Rep: That's great to hear. Your team processed 340 leads through the system this month, up from about 120 manually. How did that feel on the ground?
Prospect: Night and day honestly. My team stopped spending half their morning on data entry. They're actually selling now.
Rep: Love that. And the call scoring — your reps averaged 7.2 this month, up from the 5.8 baseline. Are they using the coaching tips?
Prospect: Yes, especially the discovery question suggestions. Marcus in particular went from a 5 to an 8.
Rep: That's exactly the trajectory we see. So the annual plan at $899/month gives you unlimited seats, priority support, and custom rubric tuning.
Prospect: We've already discussed it internally. I just need to loop in our CFO for the final sign-off, but I'm ready to move forward.
Rep: Perfect. I'll send over the agreement today. Can we target signing by end of week?
Prospect: That works. Thursday or Friday should be fine.
Rep: Wonderful. I'll also set up your dedicated success manager — you'll hear from them within 24 hours of signing.
Prospect: Sounds great. Really excited about this.
Rep: Me too, Sarah. This is going to be a game-changer for your team. Talk soon.`,
    score: {
      overall: 91,
      criteria: [
        { name: 'Rapport Building', score: 9, weight: 15, evidence: "Great to connect again — immediately warm and personal", feedback: "Strong existing rapport leveraged well. Referencing pilot results shows preparation." },
        { name: 'Needs Discovery', score: 8, weight: 25, evidence: "How did that feel on the ground?", feedback: "Good discovery about team impact, though could probe deeper on remaining pain points." },
        { name: 'Active Listening', score: 9, weight: 20, evidence: "That's exactly the trajectory we see — acknowledges her data point about Marcus", feedback: "Excellent active listening, building on prospect's specific examples." },
        { name: 'Value Proposition', score: 10, weight: 20, evidence: "340 leads processed vs 120 manually, rep scores up from 5.8 to 7.2", feedback: "Outstanding use of concrete pilot metrics to anchor value. Quantified ROI perfectly." },
        { name: 'Next Steps', score: 9, weight: 20, evidence: "Can we target signing by end of week?", feedback: "Clear timeline, commitment to send agreement same day, success manager intro — thorough close." }
      ]
    },
    coaching: {
      strengths: [
        'Exceptional use of pilot data to demonstrate ROI — specific numbers made the value undeniable',
        'Smooth transition from results review to pricing without feeling pushy',
        'Proactive next steps with agreement timeline and success manager setup'
      ],
      improvements: [
        { area: 'Expansion Discovery', current: 'Focused only on current team size and use case', suggested: 'Ask about other departments or locations that could benefit', example_script: '"Sarah, given how well this worked for your sales team — are there other teams like customer success or marketing that deal with similar lead management challenges?"' },
        { area: 'Urgency Creation', current: 'Accepted end-of-week timeline without urgency', suggested: 'Create gentle urgency around onboarding timing', example_script: '"If we can get this signed by Wednesday, we can get your success manager started Thursday and have custom rubrics live before your Monday team meeting."' }
      ],
      summary: 'Excellent closing call with strong data-driven approach. The pilot results spoke for themselves and the rep leveraged them masterfully. Minor opportunity to explore expansion and create urgency around onboarding timeline.'
    },
    next_steps: [
      { action_type: 'create_task', description: 'Send annual agreement to Sarah Chen', priority: 'high', reasoning: 'Prospect verbally committed — need to get paperwork in hand before momentum fades' },
      { action_type: 'move_pipeline', description: 'Move Sarah Chen to Closed Won stage', priority: 'high', reasoning: 'Verbal commitment received, pending CFO sign-off which prospect indicated is formality' },
      { action_type: 'create_note', description: 'CFO approval needed — Sarah targeting Thursday/Friday signature', priority: 'medium', reasoning: 'Track the approval dependency for follow-up timing' }
    ],
    data_point_updates: [
      { field: 'deal_value', suggested_value: '$10,788/year', evidence: '$899/month annual plan discussed', confidence: 0.95 },
      { field: 'decision_maker', suggested_value: 'Sarah Chen + CFO', evidence: 'I just need to loop in our CFO for the final sign-off', confidence: 0.9 },
      { field: 'company_name', suggested_value: 'Chen Solutions', evidence: 'Context from pilot program', confidence: 0.8 },
      { field: 'team_size', suggested_value: '8-10 reps', evidence: 'Your team processed 340 leads', confidence: 0.7 }
    ],
    call_summary: 'Closing call with Sarah Chen reviewing pilot results. Team processed 340 leads (up from 120) and rep scores improved from 5.8 to 7.2 average. Sarah verbally committed to $899/month annual plan, pending CFO sign-off by end of week. Agreement to be sent today with success manager introduction.'
  },
  {
    id: crypto.randomUUID(),
    tenant_id: TENANT_ID,
    contact_name: 'Marcus Thompson',
    contact_ghl_id: 'demo-contact-002',
    source: 'zoom' as const,
    source_id: 'zoom-call-002',
    direction: 'outbound',
    duration_seconds: 2103,
    call_type: 'demo',
    status: 'complete' as const,
    called_at: daysAgo(1, 4),
    speaker_map: { A: 'rep', B: 'prospect' },
    transcript_text: `Rep: Marcus, thanks for jumping on. I've got a demo environment set up based on what you told me about your HVAC business. Ready to dive in?
Prospect: Yeah, let's do it. We're drowning in leads from our Google Ads and nobody follows up fast enough.
Rep: That's exactly what we solve. Let me show you the lead capture flow first. When a call comes in, Company Mind automatically creates the contact, logs the call, and starts scoring the conversation.
Prospect: Wait, it scores the call live?
Rep: Not quite live — it processes the recording right after. But within minutes you'll see scores on rapport, discovery, value prop, and next steps. Here, let me show you a scored call.
Prospect: Oh wow, that's detailed. It even pulled out that the prospect mentioned they need a new furnace by winter?
Rep: Exactly — those are data point extractions. The AI reads the conversation and pulls out buying signals, timeline, budget mentions, anything relevant. Then it suggests actions like creating a follow-up task or moving the deal stage.
Prospect: That's slick. How much manual setup does this need?
Rep: Minimal. We connect to your GHL account, set up the scoring rubric for your industry — which we have HVAC templates for — and you're live in about a day.
Prospect: What about my existing pipeline? We've got about 200 deals in various stages.
Rep: Those stay exactly where they are. Company Mind layers on top. Your team keeps working in GHL, they just get AI-powered insights now.
Prospect: Price?
Rep: For your team of 5, you're looking at $499/month on the annual plan. That includes unlimited call scoring, the AI assistant, and pipeline automation.
Prospect: Let me talk to my partner about it. Can you send me a summary?
Rep: Absolutely. I'll send over a proposal with the HVAC-specific scoring rubric and some ROI projections based on your current close rate. Sound good?
Prospect: Perfect. We'll review it this week.`,
    score: {
      overall: 82,
      criteria: [
        { name: 'Rapport Building', score: 8, weight: 15, evidence: "I've got a demo environment set up based on what you told me — shows preparation", feedback: "Good personalization with industry-specific demo. Natural conversational tone." },
        { name: 'Needs Discovery', score: 7, weight: 25, evidence: "We're drowning in leads from our Google Ads and nobody follows up fast enough", feedback: "Captured the core pain but didn't quantify it — how many leads? What's the current response time? What revenue is being lost?" },
        { name: 'Active Listening', score: 9, weight: 20, evidence: "Exactly — those are data point extractions — picked up on the prospect's excitement about the feature", feedback: "Excellent at reading the room and building on prospect's reactions." },
        { name: 'Value Proposition', score: 8, weight: 20, evidence: "We connect to your GHL account, set up the scoring rubric for your industry — which we have HVAC templates for", feedback: "Strong industry-specific positioning. Could have tied features more directly to revenue impact." },
        { name: 'Next Steps', score: 8, weight: 20, evidence: "I'll send over a proposal with the HVAC-specific scoring rubric and some ROI projections", feedback: "Good next steps but no specific follow-up date committed. 'This week' is vague." }
      ]
    },
    coaching: {
      strengths: [
        'Industry-specific demo preparation showed professionalism and research',
        'Excellent at handling feature questions with live demonstrations',
        'Addressed integration concerns proactively — existing pipeline stays intact'
      ],
      improvements: [
        { area: 'Pain Quantification', current: 'Accepted "drowning in leads" without digging deeper', suggested: 'Quantify the pain to build urgency and ROI case', example_script: '"When you say nobody follows up fast enough — what\'s your current response time? And roughly how many of those Google Ads leads go cold before someone reaches out?"' },
        { area: 'Timeline Commitment', current: 'Accepted vague "this week" for review', suggested: 'Pin down a specific follow-up date and time', example_script: '"Perfect, I\'ll have that over to you by end of today. Would Thursday at 2pm work for a quick 15-minute call to answer any questions after you and your partner review?"' }
      ],
      summary: 'Strong demo execution with good industry personalization. Main area for improvement is pain quantification during discovery — the prospect gave signals about lead volume and response time that could have been explored to build a stronger ROI case. Follow-up timing should be more specific.'
    },
    next_steps: [
      { action_type: 'create_task', description: 'Send HVAC proposal with ROI projections to Marcus Thompson', priority: 'high', reasoning: 'Promised to send same day — deliver fast to maintain momentum' },
      { action_type: 'create_task', description: 'Schedule follow-up call with Marcus for Thursday/Friday', priority: 'medium', reasoning: 'Prospect said they would review this week — need a concrete meeting' },
      { action_type: 'create_note', description: 'Partner involved in decision. Team of 5. ~200 deals in pipeline. Google Ads lead source.', priority: 'low', reasoning: 'Capture key context for follow-up conversations' }
    ],
    data_point_updates: [
      { field: 'deal_value', suggested_value: '$5,988/year', evidence: '$499/month on the annual plan for team of 5', confidence: 0.9 },
      { field: 'company_name', suggested_value: 'Thompson HVAC', evidence: 'HVAC business context', confidence: 0.75 },
      { field: 'team_size', suggested_value: '5', evidence: 'For your team of 5', confidence: 0.95 },
      { field: 'lead_source', suggested_value: 'Google Ads', evidence: 'drowning in leads from our Google Ads', confidence: 0.95 }
    ],
    call_summary: 'Product demo for Marcus Thompson, HVAC business owner. Showed lead capture, call scoring, and data extraction features using industry-specific environment. Prospect impressed by AI scoring and data extraction. Team of 5, ~200 existing deals. Proposal with ROI projections to be sent. Partner involvement in decision — review expected this week.'
  },
  {
    id: crypto.randomUUID(),
    tenant_id: TENANT_ID,
    contact_name: 'Lisa Patel',
    contact_ghl_id: 'demo-contact-003',
    source: 'ghl' as const,
    source_id: 'ghl-call-003',
    direction: 'outbound',
    duration_seconds: 1523,
    call_type: 'follow_up',
    status: 'complete' as const,
    called_at: daysAgo(2, 6),
    speaker_map: { A: 'rep', B: 'prospect' },
    transcript_text: `Rep: Lisa, how's it going? I wanted to follow up on the demo from last week and see where things stand.
Prospect: Hi! So I shared the recording with my team and they had some questions.
Rep: Great, fire away. What came up?
Prospect: First, the call scoring — does it work with our existing phone system? We use RingCentral.
Rep: Yes, we integrate with RingCentral natively. Calls get pulled in automatically, no manual uploads needed.
Prospect: Ok good. Second question — my CEO is concerned about data privacy. Where is the data stored and who has access?
Rep: Great question. All data is stored in your own Supabase instance — you own it entirely. We never share data between tenants and everything is encrypted at rest and in transit.
Prospect: That helps. She's pretty particular about that since we handle medical referrals.
Rep: Totally understand given healthcare adjacency. We can also set up role-based access so only managers see full transcripts while reps see their own scores.
Prospect: That's smart. One more thing — can we customize the scoring criteria? Our sales process is pretty specific since we're a medical staffing agency.
Rep: Absolutely. During onboarding we work with you to build a custom rubric. For medical staffing, we'd probably weight compliance language and urgency assessment higher than in a standard rubric.
Prospect: That makes sense. Let me bring this all back to the CEO. I think we're close but she'll want to see the security docs.
Rep: I'll email you our SOC 2 report and data processing agreement right after this call. Would it help to schedule a 15-minute call with your CEO next week?
Prospect: Actually yes, that would really help move things along. She's available Tuesday or Wednesday afternoon.
Rep: Perfect, I'll send a calendar invite for Tuesday at 2pm. That work?
Prospect: That works. Thanks for being so thorough.`,
    score: {
      overall: 77,
      criteria: [
        { name: 'Rapport Building', score: 7, weight: 15, evidence: "Lisa, how's it going? — casual but professional opening", feedback: "Adequate rapport but missed opportunity to reference something specific from the demo." },
        { name: 'Needs Discovery', score: 7, weight: 25, evidence: "we handle medical referrals — discovered healthcare adjacency and its implications", feedback: "Good discovery of the privacy concern context but reactive — should proactively explore compliance needs for medical staffing." },
        { name: 'Active Listening', score: 8, weight: 20, evidence: "Totally understand given healthcare adjacency — immediately connected her concern to industry context", feedback: "Strong acknowledgment and contextual response to concerns." },
        { name: 'Value Proposition', score: 7, weight: 20, evidence: "For medical staffing, we'd probably weight compliance language and urgency assessment higher", feedback: "Good customization positioning but could have shared a case study or specific metric from similar clients." },
        { name: 'Next Steps', score: 9, weight: 20, evidence: "I'll send a calendar invite for Tuesday at 2pm", feedback: "Excellent — specific date, specific time, security docs promised immediately, CEO meeting scheduled." }
      ]
    },
    coaching: {
      strengths: [
        'Handled objections about data privacy with specific, reassuring details',
        'Excellent close — scheduled CEO meeting with specific date/time',
        'Proactively offered role-based access solution before being asked'
      ],
      improvements: [
        { area: 'Proactive Discovery', current: 'Waited for prospect to bring up concerns reactively', suggested: 'Anticipate objections based on industry knowledge', example_script: '"Lisa, before we go through questions — since you\'re in medical staffing, I imagine data privacy and compliance are top of mind. Let me address those upfront so you have that context for the team discussion."' },
        { area: 'Social Proof', current: 'No case studies or references mentioned', suggested: 'Reference similar clients to build confidence', example_script: '"We actually work with two other medical staffing agencies who had the exact same concern. Happy to connect you with one of them as a reference if that would help your CEO feel more comfortable."' }
      ],
      summary: 'Solid follow-up call handling multiple stakeholder concerns. The rep addressed technical, security, and customization questions well. Key win was scheduling the CEO meeting. Could improve by being more proactive about anticipated objections and leveraging social proof for the medical staffing vertical.'
    },
    next_steps: [
      { action_type: 'create_task', description: 'Send SOC 2 report and DPA to Lisa Patel', priority: 'high', reasoning: 'Promised immediately after call — needed for CEO review before Tuesday meeting' },
      { action_type: 'create_task', description: 'Send calendar invite for CEO meeting Tuesday 2pm', priority: 'high', reasoning: 'Confirmed time with Lisa — lock it in before it slips' },
      { action_type: 'create_note', description: 'CEO is decision maker, concerned about data privacy. Medical staffing agency — healthcare adjacency. Custom rubric needed.', priority: 'medium', reasoning: 'Prep context for CEO meeting' }
    ],
    data_point_updates: [
      { field: 'company_name', suggested_value: 'Patel Medical Staffing', evidence: 'Medical staffing agency context', confidence: 0.7 },
      { field: 'decision_maker', suggested_value: 'CEO (via Lisa Patel)', evidence: 'my CEO is concerned about data privacy... she\'ll want to see the security docs', confidence: 0.9 },
      { field: 'industry_vertical', suggested_value: 'Medical Staffing / Healthcare', evidence: 'we handle medical referrals... medical staffing agency', confidence: 0.95 },
      { field: 'phone_system', suggested_value: 'RingCentral', evidence: 'We use RingCentral', confidence: 1.0 }
    ],
    call_summary: 'Follow-up call with Lisa Patel from a medical staffing agency. Addressed team questions about RingCentral integration, data privacy (SOC 2, encryption, tenant isolation), and custom scoring rubrics for healthcare. CEO is the blocker — concerned about data security. Scheduled CEO meeting for Tuesday at 2pm. SOC 2 report and DPA to be sent immediately.'
  },
  {
    id: crypto.randomUUID(),
    tenant_id: TENANT_ID,
    contact_name: 'Jake Rivera',
    contact_ghl_id: 'demo-contact-004',
    source: 'manual' as const,
    source_id: 'manual-call-004',
    direction: 'inbound',
    duration_seconds: 487,
    call_type: 'discovery',
    status: 'complete' as const,
    called_at: daysAgo(4, 2),
    speaker_map: { A: 'rep', B: 'prospect' },
    transcript_text: `Rep: Company Mind, this is Pablo. How can I help you?
Prospect: Hey, I saw your ad about AI for CRM. I run a landscaping company and I'm kinda overwhelmed with managing my sales pipeline.
Rep: I hear that a lot from service business owners. Tell me more about what you're dealing with day to day.
Prospect: I've got about 30 leads coming in a week from Thumbtack and Google, and half of them go cold because I can't call them back fast enough.
Rep: That's a real revenue leak. Are you using any CRM right now?
Prospect: I'm on Go High Level but honestly I barely use it. I set it up but I don't have time to manage it.
Rep: That's actually perfect for us — we sit on top of GHL and essentially become your AI sales manager. What would it mean for your business if those 15 cold leads per week got followed up with?
Prospect: I mean, if I closed even 3 more jobs a week that's probably $6,000 extra a month.
Rep: So $72K a year in recovered revenue. That's significant. Look, I'd love to show you a quick demo. Are you free tomorrow afternoon?
Prospect: Uh, yeah I think so. What time?
Rep: How about 2pm? I'll send you a calendar link.
Prospect: Sure, that works. Just keep it short, I've got a crew to manage.
Rep: 30 minutes tops. Talk then, Jake.`,
    score: {
      overall: 64,
      criteria: [
        { name: 'Rapport Building', score: 6, weight: 15, evidence: "I hear that a lot from service business owners — generic empathy statement", feedback: "Adequate but not memorable. Could reference landscaping specifically or ask about the business." },
        { name: 'Needs Discovery', score: 7, weight: 25, evidence: "30 leads a week, half go cold, Thumbtack and Google sources", feedback: "Got good data points but missed digging into team size, current process, or what 'overwhelmed' specifically looks like." },
        { name: 'Active Listening', score: 6, weight: 20, evidence: "That's actually perfect for us — pivoted to pitch instead of exploring the GHL underutilization", feedback: "Jumped to solution too quickly when prospect mentioned barely using GHL. Should have explored why." },
        { name: 'Value Proposition', score: 6, weight: 20, evidence: "$72K a year in recovered revenue — good math but felt rushed", feedback: "The ROI calculation was smart but felt like a scripted move. Needed more context before running numbers." },
        { name: 'Next Steps', score: 7, weight: 20, evidence: "How about 2pm? I'll send you a calendar link — quick and specific", feedback: "Good concrete next step. Could have set an agenda to make the demo more valuable." }
      ]
    },
    coaching: {
      strengths: [
        'Quick ROI calculation was effective — turning cold leads into revenue',
        'Secured a concrete demo appointment with specific time',
        'Respected the prospect\'s time constraint ("30 minutes tops")'
      ],
      improvements: [
        { area: 'Deeper Discovery', current: 'Accepted surface-level answers about being overwhelmed', suggested: 'Dig into the specifics of their current process', example_script: '"Jake, when those 30 leads come in from Thumbtack — walk me through what happens next. Who sees them first? How long before someone picks up the phone?"' },
        { area: 'GHL Exploration', current: 'Immediately pivoted to pitch when prospect mentioned barely using GHL', suggested: 'Explore the GHL underutilization as a pain point', example_script: '"You mentioned you set up GHL but barely use it — what was the barrier? Was it too complex, not enough time, or something else? Understanding that helps me make sure we solve the actual problem."' },
        { area: 'Demo Prep', current: 'No agenda or preparation shared for the demo', suggested: 'Set a mini-agenda so the prospect prepares too', example_script: '"For tomorrow\'s demo, it would help if you could pull up your GHL pipeline so I can show you exactly how Company Mind works with your existing data. Sound fair?"' }
      ],
      summary: 'Decent inbound discovery with quick qualification. The rep identified the core pain (lead follow-up speed) and quantified it well. However, the call felt rushed — jumping from discovery to pitch to close in under 8 minutes. More time exploring the GHL underutilization would have yielded deeper insights and set up a more effective demo.'
    },
    next_steps: [
      { action_type: 'create_task', description: 'Send calendar invite for demo with Jake Rivera tomorrow at 2pm', priority: 'high', reasoning: 'Confirmed on the call — send immediately before he forgets' },
      { action_type: 'create_note', description: 'Landscaping company. 30 leads/week from Thumbtack + Google. Half go cold. On GHL but barely uses it. Potential $72K/year recovery.', priority: 'medium', reasoning: 'Demo prep context' }
    ],
    data_point_updates: [
      { field: 'company_name', suggested_value: 'Rivera Landscaping', evidence: 'I run a landscaping company', confidence: 0.7 },
      { field: 'lead_volume', suggested_value: '30/week', evidence: 'about 30 leads coming in a week', confidence: 0.9 },
      { field: 'lead_source', suggested_value: 'Thumbtack, Google', evidence: 'from Thumbtack and Google', confidence: 0.95 },
      { field: 'potential_revenue', suggested_value: '$72,000/year', evidence: 'if I closed even 3 more jobs a week that\'s probably $6,000 extra a month', confidence: 0.8 }
    ],
    call_summary: 'Inbound discovery call from Jake Rivera, landscaping business owner. Gets 30 leads/week from Thumbtack and Google, losing half to slow follow-up. Already on GHL but underutilizing it. Quick ROI calculation: $72K/year in recovered revenue. Demo scheduled for tomorrow at 2pm.'
  },
  {
    id: crypto.randomUUID(),
    tenant_id: TENANT_ID,
    contact_name: 'David Kim',
    contact_ghl_id: 'demo-contact-005',
    source: 'ghl' as const,
    source_id: 'ghl-call-005',
    direction: 'outbound',
    duration_seconds: 2456,
    call_type: 'demo',
    status: 'complete' as const,
    called_at: daysAgo(0, 6),
    speaker_map: { A: 'rep', B: 'prospect' },
    transcript_text: `Rep: David, thanks for making time. I know you're busy running two locations, so I'll make every minute count.
Prospect: Appreciate that. My office manager Maria is also on the line — she'll be the one using this day to day.
Rep: Perfect, hi Maria! Great to have you both. David, last time we talked you mentioned your biggest headache was inconsistent sales performance across your two auto detailing locations. Still the case?
Prospect: Yeah, exactly. My north side team closes at like 40% and the south side is maybe 22%. Same leads, same services, totally different results.
Rep: That's a 18-point gap — that's huge. If we got the south side even halfway to the north side's numbers, what would that look like in revenue?
Prospect: Probably an extra $15K a month honestly.
Rep: $180K a year. So let me show you exactly how Company Mind would help close that gap. First, let me pull up call scoring. Maria, this is what you'd see every morning.
Prospect: Oh this is like a dashboard for all our calls?
Rep: Exactly. Every call gets scored automatically. You can see which reps are strong on rapport but weak on next steps, or great at discovery but miss the close. Let me show you a real example.
Prospect: That score breakdown is really useful. We could use this for our weekly team meetings.
Rep: That's exactly how our best clients use it. And here's the coaching tab — specific suggestions with example scripts your reps can practice.
Prospect: Maria, could you use this to train the new hires?
Maria: Definitely. We spend so much time on ride-alongs right now, this would cut that in half.
Rep: And the pipeline automation — deals move stages automatically based on call outcomes. No more manual updates.
Prospect: What's the damage on pricing?
Rep: For two locations with 8 total reps, you're at $699/month annual. That's about $87 per rep per month.
Prospect: Against $180K in potential recovered revenue... that's a no-brainer honestly.
Rep: It really is. We can have you live by next week if we start onboarding today.
Prospect: Let's do it. Maria, get this set up. Where do we sign?
Rep: I'll send the agreement right now. David, Maria — you're going to love this.`,
    score: {
      overall: 94,
      criteria: [
        { name: 'Rapport Building', score: 9, weight: 15, evidence: "I know you're busy running two locations, so I'll make every minute count — shows awareness and respect", feedback: "Exceptional opening that acknowledged both the prospect's time and their multi-location context. Including Maria was smart." },
        { name: 'Needs Discovery', score: 10, weight: 25, evidence: "40% close rate north vs 22% south — that's an 18-point gap — quantified the performance discrepancy perfectly", feedback: "Outstanding discovery. Quantified the gap, calculated the revenue impact, and anchored everything to real numbers." },
        { name: 'Active Listening', score: 9, weight: 20, evidence: "That's exactly how our best clients use it — validated Maria's training use case", feedback: "Great at picking up on both David's strategic needs and Maria's operational needs." },
        { name: 'Value Proposition', score: 10, weight: 20, evidence: "$87 per rep per month against $180K in potential recovered revenue", feedback: "Perfect per-unit pricing against massive ROI. Made the decision feel obvious." },
        { name: 'Next Steps', score: 9, weight: 20, evidence: "We can have you live by next week if we start onboarding today — created urgency naturally", feedback: "Strong close with immediate next step. Agreement sent same call. Only missed asking about implementation preferences." }
      ]
    },
    coaching: {
      strengths: [
        'Masterful multi-stakeholder selling — engaged both the decision maker and the end user',
        'ROI calculation was devastating: $87/rep/month vs $180K/year in recovered revenue',
        'Created urgency naturally without being pushy — "live by next week" was compelling'
      ],
      improvements: [
        { area: 'Implementation Planning', current: 'Jumped straight to "send agreement" without discussing onboarding', suggested: 'Brief onboarding overview builds confidence in the transition', example_script: '"Here\'s what the first week looks like: Day 1 we connect your GHL and phone system, Day 2-3 we build your custom scoring rubric with Maria, and by Day 5 your first calls are being scored. Maria, would mornings or afternoons work better for the setup sessions?"' }
      ],
      summary: 'Near-perfect demo execution. The multi-stakeholder approach was exemplary — engaging both the owner (David) on strategy/ROI and the operator (Maria) on daily usage. The performance gap quantification was masterful and the per-unit pricing made the ROI undeniable. Only area for improvement is brief onboarding planning to reinforce confidence in the buying decision.'
    },
    next_steps: [
      { action_type: 'create_task', description: 'Send agreement to David Kim immediately', priority: 'high', reasoning: 'Verbal close on the call — David said "where do we sign"' },
      { action_type: 'move_pipeline', description: 'Move David Kim to Closed Won', priority: 'high', reasoning: 'Deal closed on the call, agreement being sent now' },
      { action_type: 'create_task', description: 'Schedule onboarding kickoff with Maria for next week', priority: 'high', reasoning: 'Maria will be primary user — need to get onboarding started per timeline promise' }
    ],
    data_point_updates: [
      { field: 'deal_value', suggested_value: '$8,388/year', evidence: '$699/month annual for two locations', confidence: 0.95 },
      { field: 'company_name', suggested_value: 'Kim Auto Detailing', evidence: 'two auto detailing locations', confidence: 0.75 },
      { field: 'team_size', suggested_value: '8 reps across 2 locations', evidence: '8 total reps', confidence: 0.95 },
      { field: 'decision_maker', suggested_value: 'David Kim (owner), Maria (office manager)', evidence: 'My office manager Maria... she\'ll be the one using this day to day', confidence: 0.95 }
    ],
    call_summary: 'Winning demo with David Kim and office manager Maria from a 2-location auto detailing business. Identified 18-point close rate gap between locations ($180K/year opportunity). Demo focused on call scoring for team coaching and pipeline automation. Deal closed on the call at $699/month annual. Agreement being sent immediately, onboarding to start next week.'
  }
];

async function seed() {
  console.log('Seeding demo data...');

  // Clean existing demo data
  console.log('Cleaning existing demo data...');
  const contactIds = ['demo-contact-001','demo-contact-002','demo-contact-003','demo-contact-004','demo-contact-005'];
  await supabaseAdmin.from('contact_data_points').delete().eq('tenant_id', TENANT_ID).in('contact_ghl_id', contactIds);
  await supabaseAdmin.from('call_actions').delete().eq('tenant_id', TENANT_ID);
  await supabaseAdmin.from('calls').delete().eq('tenant_id', TENANT_ID).in('contact_ghl_id', contactIds);

  // Insert calls
  console.log('Inserting 5 calls...');
  for (const call of calls) {
    const { next_steps, data_point_updates, ...callRow } = call;
    const { error } = await supabaseAdmin.from('calls').insert(callRow);
    if (error) {
      console.error(`Failed to insert call for ${call.contact_name}:`, error.message);
      continue;
    }
    console.log(`  ✓ ${call.contact_name} (${call.call_type}, score: ${call.score.overall})`);

    // Insert call_actions
    const actionStatuses = ['suggested', 'approved', 'executed', 'suggested', 'approved'];
    let statusIdx = 0;
    for (const step of next_steps) {
      const status = actionStatuses[statusIdx % actionStatuses.length];
      statusIdx++;
      const { error: actionErr } = await supabaseAdmin.from('call_actions').insert({
        tenant_id: TENANT_ID,
        call_id: call.id,
        action_type: step.action_type,
        description: step.description,
        suggested_payload: step,
        priority: step.priority,
        status,
      });
      if (actionErr) console.error(`    Action error: ${actionErr.message}`);
    }

    // Insert contact_data_points
    for (const dp of data_point_updates) {
      const { error: dpErr } = await supabaseAdmin.from('contact_data_points').upsert({
        tenant_id: TENANT_ID,
        contact_ghl_id: call.contact_ghl_id,
        field_name: dp.field,
        field_value: dp.suggested_value,
        source: 'call',
        source_call_id: call.id,
        confidence: String(dp.confidence),
      }, { onConflict: 'tenant_id,contact_ghl_id,field_name' });
      if (dpErr) console.error(`    Data point error: ${dpErr.message}`);
    }
  }

  // Verify
  const { count: callCount } = await supabaseAdmin.from('calls').select('*', { count: 'exact', head: true }).eq('tenant_id', TENANT_ID);
  const { count: actionCount } = await supabaseAdmin.from('call_actions').select('*', { count: 'exact', head: true }).eq('tenant_id', TENANT_ID);
  const { count: dpCount } = await supabaseAdmin.from('contact_data_points').select('*', { count: 'exact', head: true }).eq('tenant_id', TENANT_ID);

  console.log(`\nDone! Inserted:`);
  console.log(`  ${callCount} calls`);
  console.log(`  ${actionCount} call_actions`);
  console.log(`  ${dpCount} contact_data_points`);
}

seed().catch(console.error);
