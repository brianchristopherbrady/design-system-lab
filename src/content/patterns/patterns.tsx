import { useState, type ComponentType, type ReactNode } from 'react';
import { ScrollRegion, Stack } from '@/design-system/layout';
import { Switch } from '@/design-system/primitives';
import { catalog } from '@/domain/system';
import { DocSection, Note, Prose, SourceList, type SourceReference } from '@/features/docs';
import { ContainerInspector } from '@/features/playground';
import { ScenarioDemo, type ScenarioOption } from '@/features/scenarios';
import { ActivityDashboard } from './ActivityDashboard';
import { FormValidation } from './FormValidation';
import { ResourceDetail } from './ResourceDetail';
import { directoryPageSize, ResourceDirectory } from './ResourceDirectory';

export interface PatternDoc {
  /** Catalog id; name and summary come from the catalog entry. */
  id: string;
  sections: readonly { id: string; label: string }[];
  Content: ComponentType;
}

const sections = [
  { id: 'demo', label: 'Demo' },
  { id: 'states', label: 'States and transitions' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'accessibility', label: 'Accessibility' },
  { id: 'responsive', label: 'Responsive behavior' },
  { id: 'tradeoffs', label: 'Tradeoffs and mistakes' },
  { id: 'source', label: 'Source' },
] as const;

/**
 * One scenario as a demo offers it: the selector's label and description, and what the states
 * table documents. The selector and the table read the same list, so every documented scenario
 * is one the page offers.
 */
interface ScenarioDoc extends ScenarioOption {
  renders: ReactNode;
  next: ReactNode;
}

function StatesTable({ scenarios }: { scenarios: readonly ScenarioDoc[] }) {
  return (
    <Prose>
      <ScrollRegion aria-label="What each demo scenario renders">
        <table>
          <caption>What each demo scenario renders</caption>
          <thead>
            <tr>
              <th scope="col">Scenario</th>
              <th scope="col">Renders</th>
              <th scope="col">Transitions</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((row) => (
              <tr key={row.scenario}>
                <th scope="row">{row.label}</th>
                <td>{row.renders}</td>
                <td>{row.next}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollRegion>
    </Prose>
  );
}

interface PatternPageProps {
  demo: ReactNode;
  states: ReactNode;
  architecture: ReactNode;
  accessibility: ReactNode;
  responsive: ReactNode;
  tradeoffs: ReactNode;
  sources: readonly SourceReference[];
}

function InspectableDemo({ children }: { children: ReactNode }) {
  const [inspect, setInspect] = useState(false);
  return (
    <Stack gap="small">
      <Switch
        label="Show query containers"
        description="Outline each container this pattern's components query, with its live width. Resize the window to watch them respond."
        checked={inspect}
        onChange={(event) => setInspect(event.target.checked)}
      />
      <ContainerInspector enabled={inspect}>{children}</ContainerInspector>
    </Stack>
  );
}

function PatternPage({ demo, states, architecture, accessibility, responsive, tradeoffs, sources }: PatternPageProps) {
  return (
    <Stack gap="extraExtraLarge">
      <DocSection id="demo" title="Demo">
        <InspectableDemo>{demo}</InspectableDemo>
      </DocSection>
      <DocSection id="states" title="States and transitions">
        {states}
      </DocSection>
      <DocSection id="architecture" title="Architecture">
        {architecture}
      </DocSection>
      <DocSection id="accessibility" title="Accessibility">
        {accessibility}
      </DocSection>
      <DocSection id="responsive" title="Responsive behavior">
        {responsive}
      </DocSection>
      <DocSection id="tradeoffs" title="Tradeoffs and mistakes">
        {tradeoffs}
      </DocSection>
      <DocSection id="source" title="Source">
        <SourceList sources={sources} />
      </DocSection>
    </Stack>
  );
}

const sharedSources: SourceReference[] = [
  { path: 'src/content/patterns/fixtures.ts', note: 'Simulated requests over the real catalog' },
  { path: 'src/features/scenarios/scenarios.ts', note: 'Scenario list and deterministic outcomes' },
  { path: 'src/features/scenarios/useRequest.ts', note: 'Request state machine with cancellation' },
  { path: 'src/features/scenarios/ScenarioDemo.tsx', note: 'The Demo scenario selector and reset' },
];

/** How every request-driven demo works. What each scenario returns is the pattern's own, in its states table. */
function Orchestration({ outcomes }: { outcomes: ReactNode }) {
  return (
    <Prose>
      <ul>
        <li>
          <strong>Fixtures and requests live in content.</strong> <code>fixtures.ts</code> wraps the real catalog and
          changelog in <code>simulateRequest</code>; no design-system component knows they exist.
        </li>
        <li>
          <strong>Request state lives in one hook.</strong> <code>useRequest</code> holds a discriminated union (idle,
          pending, success, error, cancelled), aborts the previous request when a new one starts, and ignores late
          responses by request id.
        </li>
        <li>
          <strong>The scenario selector owns resets.</strong> <code>ScenarioDemo</code> keys the demo by scenario and a
          reset counter, so changing the scenario or pressing Reset demo remounts it from scratch: state, focus and
          attempt counters included. Each demo lists only the scenarios that apply to it, in its own words.
        </li>
        <li>
          <strong>Outcomes are deterministic.</strong> A request’s outcome depends only on the scenario and the attempt:
          Loading never settles, Error fails the first request and succeeds on every retry, and the other scenarios
          succeed.
        </li>
        <li>
          <strong>In this demo:</strong> {outcomes}
        </li>
      </ul>
    </Prose>
  );
}

const directoryScenarios: readonly ScenarioDoc[] = [
  {
    scenario: 'success',
    label: 'Success',
    description: `The request returns all ${catalog.length} catalog entries. The first ${directoryPageSize} are listed; search and filters cover every entry.`,
    renders: `Filters, a live count, the first ${directoryPageSize} matching EntryCards in alphabetical order with working Pin toggles, and Show more while more match.`,
    next: 'Show more lists the next page and moves focus to its first entry. Changing the search or a filter starts again from the first page; filtering to zero results shows No results inline.',
  },
  {
    scenario: 'loading',
    label: 'Loading',
    description: 'The request never settles, so the loading state stays visible for inspection.',
    renders: 'A status message (“Loading entries…”), aria-busy on the section and skeleton cards.',
    next: 'Stays here; change the scenario to leave.',
  },
  {
    scenario: 'empty',
    label: 'Empty',
    description: 'The request succeeds with no entries at all, so there is nothing to search yet.',
    renders: 'EmptyState explaining that the catalog has no entries, with a link to how entries are added. No filters, because there is nothing to filter.',
    next: 'None: the next action leaves the demo.',
  },
  {
    scenario: 'noResults',
    label: 'No results',
    description: 'Every entry loads, but the search starts as “tooltip”, a component this system does not have.',
    renders: 'Filters prefilled with “tooltip” and an EmptyState that says the search and filters, not the directory, are the cause.',
    next: 'Clear filters lists the first page of every entry.',
  },
  {
    scenario: 'error',
    label: 'Error',
    description: 'The first request fails. Retry succeeds, so recovery can be tested.',
    renders: 'A danger Alert with role="alert", the server message and Retry.',
    next: 'Retry shows Loading, then Success; focus moves to the section heading.',
  },
];

function DirectoryContent() {
  return (
    <PatternPage
      demo={<ScenarioDemo scenarios={directoryScenarios}>{(scenario) => <ResourceDirectory scenario={scenario} />}</ScenarioDemo>}
      states={<StatesTable scenarios={directoryScenarios} />}
      architecture={
        <Orchestration
          outcomes={
            <>
              <code>fetchEntries</code> returns the whole catalog, or nothing for Empty. Search, filters and paging run in
              the browser over every entry the request returned, so a search finds entries that are not listed yet.
            </>
          }
        />
      }
      accessibility={
        <Prose>
          <ul>
            <li>The search region is labelled; the result count is a polite live region so filtering is announced.</li>
            <li>Empty and No results use different headings, so screen-reader users hear why nothing is listed.</li>
            <li>Pin buttons use aria-pressed and include the entry name, so every Pin button has a unique accessible name.</li>
            <li>After a successful retry the Retry button disappears; focus moves to the heading instead of being lost.</li>
          </ul>
        </Prose>
      }
      responsive={
        <Prose>
          <ul>
            <li>Filters sit in one row from 40rem of their container, otherwise they stack.</li>
            <li>The Grid fits as many 18rem columns as the container allows; EntryCard rearranges itself at 28rem.</li>
          </ul>
        </Prose>
      }
      tradeoffs={
        <>
          <Prose>
            <ul>
              <li>Common mistake: one message for both “nothing exists” and “nothing matches”. They need different next actions.</li>
              <li>
                Component layer appears only while Resource type is Component, because only components have one. Changing the
                type clears it, so a filter that is no longer shown cannot hide results.
              </li>
              <li>
                The Components index uses the same filters without Resource type, since every entry there is a component, and
                stores them in the URL; this demo keeps them in local state so scenarios reset cleanly.
              </li>
            </ul>
          </Prose>
          <Note title="Same filters, two state owners">
            <p>
              <code>DirectoryFilters</code> is controlled. The Components index passes URL state from{' '}
              <code>useUrlDirectoryFilters</code>; this demo passes <code>useState</code>. The component cannot tell the
              difference.
            </p>
          </Note>
        </>
      }
      sources={[{ path: 'src/content/patterns/ResourceDirectory.tsx', note: 'The demo' }, { path: 'src/features/directory/filters.ts', note: 'Filtering and URL encoding' }, ...sharedSources]}
    />
  );
}

const detailScenarios: readonly ScenarioDoc[] = [
  {
    scenario: 'success',
    label: 'Success',
    description: 'The Button entry loads with its recorded changes, on the Overview tab.',
    renders: 'Metadata, Tabs (Overview, History, Documentation), Pin and Archive. Archive opens a confirmation Dialog.',
    next: 'See the archive flow below.',
  },
  {
    scenario: 'loading',
    label: 'Loading',
    description: 'The request never settles, so the loading state stays visible for inspection.',
    renders: 'A provisional heading, a status message and skeletons.',
    next: 'Stays here; change the scenario to leave.',
  },
  {
    scenario: 'empty',
    label: 'Empty history',
    description: 'The entry loads, but it has no recorded changes. The demo opens on the History tab to show that empty state.',
    renders: 'The entry, opened on its History tab, which has an EmptyState instead of events. The other tabs and Archive still work.',
    next: 'Reset demo opens the History tab again.',
  },
  {
    scenario: 'error',
    label: 'Error',
    description: 'The first request fails. Retry succeeds, so recovery can be tested.',
    renders: 'A heading that says the entry is unavailable and an Alert with Retry.',
    next: 'Retry loads the entry; focus moves to its heading.',
  },
];

function DetailContent() {
  return (
    <PatternPage
      demo={
        <ScenarioDemo scenarios={detailScenarios}>
          {(scenario) => <ResourceDetail scenario={scenario} initialTab={scenario === 'empty' ? 'history' : 'overview'} />}
        </ScenarioDemo>
      }
      states={
        <>
          <StatesTable scenarios={detailScenarios} />
          <Prose>
            <h3>Archive flow</h3>
            <ol>
              <li>Archive opens the Dialog with focus on Cancel.</li>
              <li>Confirm shows the loading button; the first attempt always fails.</li>
              <li>The error appears inside the Dialog as an Alert with role="alert", and the action becomes Try again.</li>
              <li>The second attempt succeeds: the Dialog closes, focus returns to the opener (now Restore), and a status message confirms.</li>
            </ol>
            <p>
              There is no No results scenario: the detail view has no search. Its empty state is an entry without history,
              not a missing entry.
            </p>
          </Prose>
        </>
      }
      architecture={
        <Orchestration
          outcomes={
            <>
              <code>fetchEntryDetail</code> returns the Button entry and its changelog, or the entry with an empty history
              for Empty history. <code>archiveEntry</code> fails its first attempt in every scenario, so the error path in the
              Dialog is always reachable.
            </>
          }
        />
      }
      accessibility={
        <Prose>
          <ul>
            <li>The Dialog is labelled by its title and described by its description; Escape and Cancel close it without side effects.</li>
            <li>The opener stays enabled after archiving (it becomes Restore), so focus restoration always has a target.</li>
            <li>Tabs follow the ARIA pattern: arrow keys switch tabs, Tab moves into the panel.</li>
          </ul>
        </Prose>
      }
      responsive={
        <Prose>
          <ul>
            <li>Title and actions share a row that wraps; the overview cards use a responsive Grid.</li>
            <li>The Dialog is capped by dialog.width.small and the viewport, whichever is smaller.</li>
          </ul>
        </Prose>
      }
      tradeoffs={
        <Prose>
          <ul>
            <li>Common mistake: closing the dialog when the operation fails, which hides the error and loses the decision.</li>
            <li>Common mistake: disabling the opener after success, which sends focus to the page body.</li>
          </ul>
        </Prose>
      }
      sources={[{ path: 'src/content/patterns/ResourceDetail.tsx', note: 'The demo' }, ...sharedSources]}
    />
  );
}

const dashboardScenarios: readonly ScenarioDoc[] = [
  {
    scenario: 'success',
    label: 'Success',
    description: 'The changelog loads. Metrics are computed from the catalog and the feed lists every change.',
    renders: 'Three metric cards computed from the catalog and changelog, and the searchable change feed.',
    next: 'Searching to zero results shows No results inline.',
  },
  {
    scenario: 'loading',
    label: 'Loading',
    description: 'The request never settles, so the loading state stays visible for inspection.',
    renders: 'Status message and skeleton metric cards.',
    next: 'Stays here; change the scenario to leave.',
  },
  {
    scenario: 'empty',
    label: 'Empty',
    description: 'The request succeeds, but no changes have been recorded.',
    renders: 'EmptyState: no activity has been recorded, with a link to browse components.',
    next: 'None: the next action leaves the demo.',
  },
  {
    scenario: 'noResults',
    label: 'No results',
    description: 'The changelog loads, but the feed search starts as “tooltip”, which matches no change.',
    renders: 'Metrics as in Success, and the feed search prefilled with “tooltip” above an EmptyState.',
    next: 'Clear search lists every change.',
  },
  {
    scenario: 'error',
    label: 'Error',
    description: 'The first request fails. Retry succeeds, so recovery can be tested.',
    renders: 'One Alert with Retry; metrics are hidden because they depend on the feed.',
    next: 'Retry loads everything; focus moves to the heading.',
  },
];

function DashboardContent() {
  return (
    <PatternPage
      demo={<ScenarioDemo scenarios={dashboardScenarios}>{(scenario) => <ActivityDashboard scenario={scenario} />}</ScenarioDemo>}
      states={<StatesTable scenarios={dashboardScenarios} />}
      architecture={
        <Orchestration
          outcomes={
            <>
              <code>fetchActivity</code> returns the changelog, or nothing for Empty. The catalog metric counts every
              resource type in the catalog, so its parts always add up to its total.
            </>
          }
        />
      }
      accessibility={
        <Prose>
          <ul>
            <li>Metrics are text, not charts, so they need no alternative description.</li>
            <li>Each change states its kind in text; the badge tone only repeats it.</li>
            <li>The visible count is a live region, announced as the search narrows.</li>
          </ul>
        </Prose>
      }
      responsive={
        <Prose>
          <ul>
            <li>Metric cards fit as many 10rem columns as available.</li>
            <li>ActivityList switches from stacked rows to a three-column row at 36rem of its own width.</li>
          </ul>
        </Prose>
      }
      tradeoffs={
        <Prose>
          <ul>
            <li>One request feeds both metrics and the list, so one error state covers both; separate requests would need separate error regions.</li>
          </ul>
        </Prose>
      }
      sources={[{ path: 'src/content/patterns/ActivityDashboard.tsx', note: 'The demo' }, { path: 'src/domain/system/activity.ts', note: 'Changelog fixture and derived counts' }, ...sharedSources]}
    />
  );
}

function FormContent() {
  return (
    <PatternPage
      demo={<FormValidation />}
      states={
        <Prose>
          <ul>
            <li>
              <strong>Pristine:</strong> no errors are shown while typing.
            </li>
            <li>
              <strong>Submitted with errors:</strong> an error summary appears above the form and receives focus; each item
              links to its field. Each field shows its own message, and messages update as fields change.
            </li>
            <li>
              <strong>Submitted:</strong> the form resets and a status message says the demo submission is complete and
              nothing was sent.
            </li>
          </ul>
          <p>
            This pattern has no request, so it has no Demo scenario selector, and a valid submission goes nowhere. To
            propose a real component, open an issue in the project’s repository. Validation rules are a pure function,{' '}
            <code>validateProposal</code>, tested without rendering.
          </p>
        </Prose>
      }
      architecture={
        <Prose>
          <ul>
            <li>Field wires each label, description and error; the form only decides when errors are shown.</li>
            <li>The name rule reads the components in the real catalog, so proposing “Button” is rejected as a duplicate.</li>
            <li>
              The component layer must be Layout, Primitive or Composite, read from the catalog’s shared list. Validation
              checks the value itself, not only the options offered.
            </li>
          </ul>
        </Prose>
      }
      accessibility={
        <Prose>
          <ul>
            <li>Errors are text with an icon and the word “Error” where needed, never color alone.</li>
            <li>Native validation is off (noValidate) so messages are consistent and announced through the summary.</li>
            <li>Every error is linked from the summary and associated with its control through aria-describedby.</li>
          </ul>
        </Prose>
      }
      responsive={
        <Prose>
          <p>Component name and component layer share a row when the Grid has room for two 18rem columns.</p>
        </Prose>
      }
      tradeoffs={
        <Prose>
          <ul>
            <li>Common mistake: validating on every keystroke from the start, which shows errors before people finish typing.</li>
            <li>Common mistake: a disabled submit button, which hides why the form cannot be sent.</li>
          </ul>
        </Prose>
      }
      sources={[{ path: 'src/content/patterns/FormValidation.tsx', note: 'Form, rules and error summary' }, { path: 'src/design-system/composites/Field/Field.tsx', note: 'Label, description and error wiring' }]}
    />
  );
}

export const patternDocs: readonly PatternDoc[] = [
  { id: 'resource-directory', sections, Content: DirectoryContent },
  { id: 'resource-detail', sections, Content: DetailContent },
  { id: 'activity-dashboard', sections, Content: DashboardContent },
  { id: 'form-validation', sections, Content: FormContent },
];

export function findPatternDoc(id: string): PatternDoc | undefined {
  return patternDocs.find((doc) => doc.id === id);
}
