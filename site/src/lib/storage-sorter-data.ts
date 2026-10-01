/**
 * The services and workloads for the <StorageSorter> on the comparison page.
 * Kept separate from the engine (storage-sorter.ts) so the question set and
 * its correct answers can be unit-tested. Every answer is grounded in the
 * distinction the AWS user guides draw between object, block and file storage.
 */
import type { StorageId, StorageQuestion } from './storage-sorter';

export const services: { id: StorageId; name: string; kind: string }[] = [
  { id: 's3', name: 'Amazon S3', kind: 'Object storage' },
  { id: 'ebs', name: 'Amazon EBS', kind: 'Block storage' },
  { id: 'efs', name: 'Amazon EFS', kind: 'File storage' },
];

export const questions: StorageQuestion[] = [
  {
    id: 'media-library',
    prompt: 'Store a growing library of images and videos, served to users over the web.',
    answer: 's3',
    because: 'Objects served by key over HTTP are the classic fit for Amazon S3 object storage.',
  },
  {
    id: 'database-volume',
    prompt: 'Provide a low-latency disk for a database running on one EC2 instance.',
    answer: 'ebs',
    because: 'A block volume attached to a single EC2 instance is exactly what Amazon EBS provides.',
  },
  {
    id: 'shared-home-dirs',
    prompt: 'Give a fleet of Linux servers one shared file system they all mount at once.',
    answer: 'efs',
    because: 'Amazon EFS is a managed file system many instances can mount concurrently across AZs.',
  },
  {
    id: 'backup-archive',
    prompt: 'Keep durable backups and archives you rarely read, at low cost.',
    answer: 's3',
    because: 'High durability and cheap archival storage classes make Amazon S3 the natural home for backups.',
  },
  {
    id: 'boot-volume',
    prompt: 'Act as the boot disk for a single EC2 instance.',
    answer: 'ebs',
    because: 'A boot volume is block storage attached to one instance — an Amazon EBS volume.',
  },
  {
    id: 'cms-uploads',
    prompt: 'Let several app servers read and write the same uploaded files with normal file paths.',
    answer: 'efs',
    because: 'Shared POSIX file access across many instances is what Amazon EFS is built for.',
  },
];
