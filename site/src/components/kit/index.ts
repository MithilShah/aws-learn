// Components available in every journey MDX file without an import.
// Pages render content with <Content components={mdxComponents} />.
import Arrow from './Arrow.astro';
import Callout from './Callout.astro';
import CompliancePill from './CompliancePill.astro';
import Diagram from './Diagram.astro';
import Figure from './Figure.astro';
import KeyPrefixExplorer from './KeyPrefixExplorer.astro';
import KeyTerms from './KeyTerms.astro';
import RuleSimulator from './RuleSimulator.astro';
import ServiceNode from './ServiceNode.astro';
import ServiceSorter from './ServiceSorter.astro';
import StepLink from './StepLink.astro';
import Stepper from './Stepper.astro';
import StorageClassMatrix from './StorageClassMatrix.astro';
import StorageSorter from './StorageSorter.astro';
import TabPanel from './TabPanel.astro';
import Tabs from './Tabs.astro';
import Term from './Term.astro';
import VersionTimeline from './VersionTimeline.astro';

export const mdxComponents = {
  Arrow,
  Callout,
  CompliancePill,
  Diagram,
  Figure,
  KeyPrefixExplorer,
  KeyTerms,
  RuleSimulator,
  ServiceNode,
  ServiceSorter,
  StepLink,
  Stepper,
  StorageClassMatrix,
  StorageSorter,
  TabPanel,
  Tabs,
  Term,
  VersionTimeline,
};
