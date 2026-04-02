'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { approveAction, rejectAction, approveDataPoint, rejectDataPoint } from '@/app/actions';
import {
  FileText,
  BarChart3,
  GraduationCap,
  ListChecks,
  Database,
  CheckCircle2,
  X,
  Lightbulb,
  Quote,
} from 'lucide-react';

interface ScoreData {
  overall: number;
  criteria: Array<{
    name: string;
    score: number;
    weight: number;
    evidence: string;
    feedback: string;
  }>;
}

interface CoachingData {
  strengths: string[];
  improvements: Array<{
    area: string;
    current: string;
    suggested: string;
    example_script: string;
  }>;
  summary: string;
}

interface Action {
  id: string;
  action_type: string;
  description: string;
  priority: string;
  status: string;
  suggested_payload?: { reasoning?: string } | null;
}

interface DataPoint {
  id: string;
  field_name: string;
  field_value: string;
  confidence: string;
  source: string;
}

interface Props {
  transcript: string;
  score: ScoreData | null;
  coaching: CoachingData | null;
  callSummary: string;
  actions: Action[];
  dataPoints: DataPoint[];
}

const priorityStyles: Record<string, string> = {
  high: 'bg-red-50 text-red-700',
  medium: 'bg-amber-50 text-amber-700',
  low: 'bg-zinc-100 text-zinc-600',
};

const statusStyles: Record<string, string> = {
  suggested: 'bg-zinc-100 text-zinc-600',
  approved: 'bg-blue-50 text-blue-700',
  executed: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-600',
};

function formatType(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function CallDetailTabs({ transcript, score, coaching, callSummary, actions, dataPoints }: Props) {
  return (
    <Tabs defaultValue="coaching">
      <TabsList variant="line" className="mb-6">
        <TabsTrigger value="coaching" className="gap-1.5">
          <GraduationCap className="h-3.5 w-3.5" />
          Coaching
        </TabsTrigger>
        <TabsTrigger value="criteria" className="gap-1.5">
          <BarChart3 className="h-3.5 w-3.5" />
          Criteria
        </TabsTrigger>
        <TabsTrigger value="transcript" className="gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          Transcript
        </TabsTrigger>
        <TabsTrigger value="nextsteps" className="gap-1.5">
          <ListChecks className="h-3.5 w-3.5" />
          Next Steps
        </TabsTrigger>
        <TabsTrigger value="datapoints" className="gap-1.5">
          <Database className="h-3.5 w-3.5" />
          Data Points
        </TabsTrigger>
      </TabsList>

      {/* -- Coaching -- */}
      <TabsContent value="coaching">
        <CoachingView coaching={coaching} callSummary={callSummary} />
      </TabsContent>

      {/* -- Criteria (was Score Card) -- */}
      <TabsContent value="criteria">
        <ScoreCardView score={score} />
      </TabsContent>

      {/* -- Transcript -- */}
      <TabsContent value="transcript">
        <TranscriptView text={transcript} />
      </TabsContent>

      {/* -- Next Steps -- */}
      <TabsContent value="nextsteps">
        <NextStepsView actions={actions} />
      </TabsContent>

      {/* -- Data Points -- */}
      <TabsContent value="datapoints">
        <DataPointsView dataPoints={dataPoints} />
      </TabsContent>
    </Tabs>
  );
}

/* -------------------------------------------------------------------------- */
/*  Transcript -- iMessage style                                              */
/* -------------------------------------------------------------------------- */

function TranscriptView({ text }: { text: string }) {
  if (!text) {
    return <p className="py-8 text-center text-sm text-zinc-400">No transcript available.</p>;
  }

  // Split by speaker labels
  const lines: { speaker: 'rep' | 'prospect'; text: string }[] = [];
  const parts = text.split(/\n/).filter(Boolean);

  for (const line of parts) {
    const trimmed = line.trim();
    if (trimmed.startsWith('Rep:')) {
      lines.push({ speaker: 'rep', text: trimmed.replace(/^Rep:\s*/, '') });
    } else if (trimmed.startsWith('Prospect:')) {
      lines.push({ speaker: 'prospect', text: trimmed.replace(/^Prospect:\s*/, '') });
    } else if (trimmed.startsWith('Maria:')) {
      lines.push({ speaker: 'prospect', text: `Maria: ${trimmed.replace(/^Maria:\s*/, '')}` });
    } else if (lines.length > 0) {
      // Continuation of previous speaker
      lines[lines.length - 1].text += ' ' + trimmed;
    }
  }

  return (
    <div className="space-y-2 max-w-2xl">
      {lines.map((line, i) => (
        <div
          key={i}
          className={`flex ${line.speaker === 'rep' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[80%] px-3.5 py-2.5 text-[13px] leading-relaxed ${
              line.speaker === 'rep'
                ? 'rounded-2xl rounded-br-md bg-blue-500 text-white'
                : 'rounded-2xl rounded-bl-md bg-zinc-100 text-zinc-800'
            }`}
          >
            {line.text}
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Criteria -- thinner bars, refined evidence box                            */
/* -------------------------------------------------------------------------- */

function ScoreCardView({ score }: { score: ScoreData | null }) {
  if (!score) {
    return <p className="py-8 text-center text-sm text-zinc-400">No score data available.</p>;
  }

  function barColor(s: number) {
    if (s >= 8) return 'bg-emerald-500';
    if (s >= 6) return 'bg-amber-500';
    return 'bg-red-500';
  }

  function textColor(s: number) {
    if (s >= 8) return 'text-emerald-600';
    if (s >= 6) return 'text-amber-600';
    return 'text-red-600';
  }

  return (
    <div className="space-y-5 max-w-2xl">
      {score.criteria.map((c) => (
        <div key={c.name} className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-900">{c.name}</span>
              <span className="text-[11px] text-zinc-400">{c.weight}% weight</span>
            </div>
            <span className={`text-lg font-bold tabular-nums ${textColor(c.score)}`}>
              {c.score}<span className="text-sm font-normal text-zinc-300">/10</span>
            </span>
          </div>

          {/* Bar -- thinner */}
          <div className="h-1.5 w-full rounded-full bg-zinc-100">
            <div
              className={`h-full rounded-full transition-all ${barColor(c.score)}`}
              style={{ width: `${c.score * 10}%` }}
            />
          </div>

          {/* Evidence & feedback -- white bg with subtle border */}
          <div className="rounded-md border border-zinc-100 bg-white px-3 py-2.5 text-xs">
            <p className="italic text-zinc-500">&ldquo;{c.evidence}&rdquo;</p>
            <p className="mt-1.5 text-zinc-600">{c.feedback}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Coaching -- softer styling                                                */
/* -------------------------------------------------------------------------- */

function CoachingView({ coaching, callSummary }: { coaching: CoachingData | null; callSummary: string }) {
  if (!coaching) {
    return <p className="py-8 text-center text-sm text-zinc-400">No coaching data available.</p>;
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Call summary -- no border, just bg */}
      {callSummary && (
        <div className="rounded-xl bg-zinc-50 px-4 py-3.5">
          <p className="mb-1.5 text-[12px] font-medium text-zinc-400">Summary</p>
          <p className="text-[13px] leading-relaxed text-zinc-700">{callSummary}</p>
        </div>
      )}

      {/* Improvements */}
      <div>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-900">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          Areas to Improve
        </h3>
        <div className="space-y-3">
          {coaching.improvements.map((imp, i) => (
            <div key={i} className={`rounded-xl bg-amber-50/30 border border-amber-200/50 p-4 space-y-3 animate-slide-up stagger-${i + 1}`}>
              <p className="text-sm font-medium text-amber-900">{imp.area}</p>
              <div className="space-y-1.5 text-sm">
                <p className="text-zinc-500">
                  <span className="font-medium text-zinc-600">What you did: </span>
                  {imp.current}
                </p>
                <p className="text-zinc-500">
                  <span className="font-medium text-zinc-600">Try instead: </span>
                  {imp.suggested}
                </p>
              </div>
              <div className="rounded-md bg-zinc-50 px-3.5 py-2.5">
                <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-amber-600">
                  <Quote className="h-3 w-3" />
                  Example script
                </div>
                <p className="text-[13px] italic leading-relaxed text-zinc-700">
                  {imp.example_script}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Coaching summary */}
      <div className="rounded-xl bg-zinc-50 px-4 py-3.5">
        <p className="mb-1.5 text-[12px] font-medium text-zinc-400">Overall assessment</p>
        <p className="text-[13px] leading-relaxed text-zinc-700">{coaching.summary}</p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Next Steps -- tighter spacing, subtle border                              */
/* -------------------------------------------------------------------------- */

function NextStepsView({ actions }: { actions: Action[] }) {
  if (actions.length === 0) {
    return <p className="py-8 text-center text-sm text-zinc-400">No actions suggested.</p>;
  }

  return (
    <div className="space-y-2.5 max-w-2xl">
      {actions.map((action) => {
        const reasoning = (action.suggested_payload as { reasoning?: string } | null)?.reasoning;
        return (
          <div key={action.id} className="rounded-lg border border-zinc-100 bg-white p-4 space-y-2.5 hover-lift">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="bg-zinc-100 text-zinc-700 border-0 text-[11px]">
                  {formatType(action.action_type)}
                </Badge>
                <Badge variant="secondary" className={`border-0 text-[11px] ${priorityStyles[action.priority] ?? priorityStyles.low}`}>
                  {action.priority}
                </Badge>
                <Badge variant="secondary" className={`border-0 text-[11px] ${statusStyles[action.status] ?? statusStyles.suggested}`}>
                  {action.status}
                </Badge>
              </div>

              {action.status === 'suggested' && (
                <div className="flex shrink-0 gap-1.5">
                  <form action={approveAction.bind(null, action.id)}>
                    <Button type="submit" size="xs" variant="outline" className="gap-1 text-emerald-700 hover:bg-emerald-50">
                      <CheckCircle2 className="h-3 w-3" />
                      Approve
                    </Button>
                  </form>
                  <form action={rejectAction.bind(null, action.id)}>
                    <Button type="submit" size="xs" variant="outline" className="gap-1 text-zinc-500 hover:bg-zinc-100">
                      <X className="h-3 w-3" />
                      Reject
                    </Button>
                  </form>
                </div>
              )}
            </div>

            <p className="text-sm text-zinc-800">{action.description}</p>

            {reasoning && (
              <p className="text-xs text-zinc-400">{reasoning}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Data Points -- tighter spacing, subtle border                             */
/* -------------------------------------------------------------------------- */

function DataPointsView({ dataPoints }: { dataPoints: DataPoint[] }) {
  if (dataPoints.length === 0) {
    return <p className="py-8 text-center text-sm text-zinc-400">No data points extracted.</p>;
  }

  function confidenceBadge(c: string) {
    const n = parseFloat(c);
    if (n >= 0.9) return 'bg-emerald-50 text-emerald-700';
    if (n >= 0.7) return 'bg-blue-50 text-blue-700';
    return 'bg-zinc-100 text-zinc-600';
  }

  function confidenceLabel(c: string) {
    const n = parseFloat(c);
    if (n >= 0.9) return 'High';
    if (n >= 0.7) return 'Medium';
    return 'Low';
  }

  return (
    <div className="space-y-2.5 max-w-2xl">
      {dataPoints.map((dp) => (
        <div key={dp.id} className="rounded-lg border border-zinc-100 bg-white p-4 flex items-start justify-between gap-4 hover-lift">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-900">
                {formatType(dp.field_name)}
              </span>
              <Badge variant="secondary" className={`border-0 text-[11px] ${confidenceBadge(dp.confidence)}`}>
                {confidenceLabel(dp.confidence)}
              </Badge>
            </div>
            <p className="text-sm text-zinc-700">{dp.field_value}</p>
          </div>

          {dp.source === 'call' && (
            <div className="flex shrink-0 gap-1.5">
              <form action={approveDataPoint.bind(null, dp.id)}>
                <Button type="submit" size="xs" variant="outline" className="gap-1 text-emerald-700 hover:bg-emerald-50">
                  <CheckCircle2 className="h-3 w-3" />
                </Button>
              </form>
              <form action={rejectDataPoint.bind(null, dp.id)}>
                <Button type="submit" size="xs" variant="outline" className="gap-1 text-zinc-400 hover:bg-zinc-100">
                  <X className="h-3 w-3" />
                </Button>
              </form>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
