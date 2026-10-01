/**
 * The services and questions for the <ServiceSorter> on the comparison page.
 * Kept separate from the engine (service-sorter.ts) so the question set and
 * its correct answers can be unit-tested. Every answer is grounded in the
 * AWS Config FAQ, the CloudTrail User Guide, or the CloudWatch User Guide.
 */
import type { ServiceId, SorterQuestion } from './service-sorter';

export const services: { id: ServiceId; name: string; question: string }[] = [
  { id: 'config', name: 'AWS Config', question: 'What did my resource look like?' },
  { id: 'cloudtrail', name: 'AWS CloudTrail', question: 'Who made the API call?' },
  { id: 'cloudwatch', name: 'Amazon CloudWatch', question: 'How is my resource performing?' },
];

export const questions: SorterQuestion[] = [
  {
    id: 'what-did-it-look-like',
    prompt: 'What did the "Production-DB" security group look like last Tuesday?',
    answer: 'config',
    because: 'AWS Config keeps a configuration history, so it can show a resource\u2019s past configuration.',
  },
  {
    id: 'who-changed-it',
    prompt: 'Which user made the API call that changed this security group?',
    answer: 'cloudtrail',
    because: 'AWS CloudTrail records user API activity, including the identity behind each call.',
  },
  {
    id: 'cpu-alarm',
    prompt: 'Alert me when this instance\u2019s CPU stays above 80% for five minutes.',
    answer: 'cloudwatch',
    because: 'Amazon CloudWatch collects metrics and raises alarms on them in near real time.',
  },
  {
    id: 'noncompliant-resources',
    prompt: 'Which of my resources break my encryption policy right now?',
    answer: 'config',
    because: 'AWS Config evaluates resources against rules and reports which are noncompliant.',
  },
  {
    id: 'api-audit-trail',
    prompt: 'Give me an audit trail of every API action taken in my account.',
    answer: 'cloudtrail',
    because: 'AWS CloudTrail is the record of API activity across your account.',
  },
  {
    id: 'log-metrics',
    prompt: 'Chart application errors from my log data and dashboard them.',
    answer: 'cloudwatch',
    because: 'Amazon CloudWatch collects logs and metrics and shows them on dashboards.',
  },
];
