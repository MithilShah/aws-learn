/**
 * The concrete rules and resources the <RuleSimulator> on the Config rules
 * page offers. Kept separate from the engine (rule-simulator.ts) so each
 * rule's behaviour can be unit-tested against how its AWS docs page
 * describes it.
 *
 * Rules modelled:
 *  - encrypted-volumes      NON_COMPLIANT if an attached EBS volume is
 *                           unencrypted, or encrypted with a KMS key not in
 *                           the kmsId parameter. (ENCRYPTED_VOLUMES)
 *  - s3-bucket-versioning-enabled
 *                           COMPLIANT if versioning is enabled on the bucket.
 *  - required-tags          Needs a tag key parameter; ERROR when it's
 *                           missing, otherwise checks the resource has it.
 */
import type { EvaluationResult, SimResource, SimRule } from './rule-simulator';

export const rules: SimRule[] = [
  {
    id: 'encrypted-volumes',
    name: 'encrypted-volumes',
    description:
      'Checks if attached Amazon EBS volumes are encrypted, and optionally encrypted with a specified KMS key.',
    appliesTo: ['AWS::EC2::Volume'],
    check: (resource, params): EvaluationResult => {
      if (resource.attributes.encrypted !== true) return 'NON_COMPLIANT';
      // Optional kmsId: if supplied, the volume's key must match.
      const required = params.kmsId?.trim();
      if (required && resource.attributes.kmsKeyId !== required) return 'NON_COMPLIANT';
      return 'COMPLIANT';
    },
  },
  {
    id: 's3-bucket-versioning-enabled',
    name: 's3-bucket-versioning-enabled',
    description: 'Checks if versioning is enabled for your Amazon S3 buckets.',
    appliesTo: ['AWS::S3::Bucket'],
    check: (resource): EvaluationResult =>
      resource.attributes.versioningEnabled === true ? 'COMPLIANT' : 'NON_COMPLIANT',
  },
  {
    id: 'required-tags',
    name: 'required-tags',
    description: 'Checks if your resources have the tags that you specify.',
    appliesTo: ['AWS::EC2::Volume', 'AWS::S3::Bucket', 'AWS::EC2::Instance'],
    check: (resource, params): EvaluationResult => {
      const key = params.tagKey?.trim();
      // A required parameter is missing or empty: the rule can't run.
      if (!key) return 'ERROR';
      const tags = (resource.attributes.tags as Record<string, string> | undefined) ?? {};
      return key in tags ? 'COMPLIANT' : 'NON_COMPLIANT';
    },
  },
];

export const resources: SimResource[] = [
  {
    id: 'encrypted-volume',
    label: 'Encrypted EBS volume',
    type: 'AWS::EC2::Volume',
    attributes: { encrypted: true, kmsKeyId: 'key-approved', tags: { team: 'payments' } },
  },
  {
    id: 'unencrypted-volume',
    label: 'Unencrypted EBS volume',
    type: 'AWS::EC2::Volume',
    attributes: { encrypted: false, tags: {} },
  },
  {
    id: 'versioned-bucket',
    label: 'S3 bucket with versioning on',
    type: 'AWS::S3::Bucket',
    attributes: { versioningEnabled: true, tags: { team: 'payments' } },
  },
  {
    id: 'plain-bucket',
    label: 'S3 bucket with versioning off',
    type: 'AWS::S3::Bucket',
    attributes: { versioningEnabled: false, tags: {} },
  },
];
