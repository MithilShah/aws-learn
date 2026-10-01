// Components available in every journey MDX file without an import.
// Pages render content with <Content components={mdxComponents} />.
import Arrow from './Arrow.astro';
import Callout from './Callout.astro';
import CompliancePill from './CompliancePill.astro';
import Diagram from './Diagram.astro';
import Figure from './Figure.astro';
import KeyTerms from './KeyTerms.astro';
import RuleSimulator from './RuleSimulator.astro';
import ServiceNode from './ServiceNode.astro';
import ServiceSorter from './ServiceSorter.astro';
import StepLink from './StepLink.astro';
import Stepper from './Stepper.astro';
import TabPanel from './TabPanel.astro';
import Tabs from './Tabs.astro';
import Term from './Term.astro';

export const mdxComponents = {
  Arrow,
  Callout,
  CompliancePill,
  Diagram,
  Figure,
  KeyTerms,
  RuleSimulator,
  ServiceNode,
  ServiceSorter,
  StepLink,
  Stepper,
  TabPanel,
  Tabs,
  Term,
};
