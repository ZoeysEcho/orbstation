import { sortBy } from 'common/collections';
import { classes } from 'common/react';
import { InfernoNode, SFC } from 'inferno';
import { useBackend } from '../../backend';
import { Box, Button, Dropdown, Section, Stack, Tooltip } from '../../components';
import { createSetPreference, Job, JoblessRole, JobPriority, PreferencesMenuData } from './data';
import { ServerPreferencesFetcher } from './ServerPreferencesFetcher';

const sortJobs = (entries: [string, Job][], head?: string) =>
  sortBy<[string, Job]>(
    ([key, _]) => (key === head ? -1 : 1),
    ([key, _]) => key
  )(entries);

const PRIORITY_BUTTON_SIZE = '18px';

const PriorityButton = (props: {
  name: string;
  color: string;
  modifier?: string;
  enabled: boolean;
  onClick: () => void;
}) => {
  const className = `PreferencesMenu__Jobs__departments__priority`;

  return (
    <Stack.Item height={PRIORITY_BUTTON_SIZE}>
      <Button
        className={classes([
          className,
          props.modifier && `${className}--${props.modifier}`,
        ])}
        color={props.enabled ? props.color : 'white'}
        circular
        onClick={props.onClick}
        tooltip={props.name}
        tooltipPosition="bottom"
        height={PRIORITY_BUTTON_SIZE}
        width={PRIORITY_BUTTON_SIZE}
      />
    </Stack.Item>
  );
};

type CreateSetPriority = (priority: JobPriority | null) => () => void;

const createSetPriorityCache: Record<string, CreateSetPriority> = {};

const createCreateSetPriorityFromName = (
  context,
  jobName: string
): CreateSetPriority => {
  if (createSetPriorityCache[jobName] !== undefined) {
    return createSetPriorityCache[jobName];
  }

  const perPriorityCache: Map<JobPriority | null, () => void> = new Map();

  const createSetPriority = (priority: JobPriority | null) => {
    const existingCallback = perPriorityCache.get(priority);
    if (existingCallback !== undefined) {
      return existingCallback;
    }

    const setPriority = () => {
      const { act } = useBackend<PreferencesMenuData>(context);

      act('set_job_preference', {
        job: jobName,
        level: priority,
      });
    };

    perPriorityCache.set(priority, setPriority);
    return setPriority;
  };

  createSetPriorityCache[jobName] = createSetPriority;

  return createSetPriority;
};

const PriorityHeaders = () => {
  const className = 'PreferencesMenu__Jobs__PriorityHeader';

  return (
    <Stack>
      <Stack.Item grow />

      <Stack.Item className={className}>Off</Stack.Item>

      <Stack.Item className={className}>Low</Stack.Item>

      <Stack.Item className={className}>Medium</Stack.Item>

      <Stack.Item className={className}>High</Stack.Item>
    </Stack>
  );
};

const PriorityButtons = (props: {
  createSetPriority: CreateSetPriority;
  isOverflow: boolean;
  priority: JobPriority;
}) => {
  const { createSetPriority, isOverflow, priority } = props;

  return (
    <Stack
      style={{
        'align-items': 'center',
        'height': '100%',
        'justify-content': 'flex-end',
        'padding-left': '0.3em',
      }}>
      {isOverflow ? (
        <>
          <PriorityButton
            name="Off"
            modifier="off"
            color="light-grey"
            enabled={!priority}
            onClick={createSetPriority(null)}
          />

          <PriorityButton
            name="On"
            color="green"
            enabled={!!priority}
            onClick={createSetPriority(JobPriority.High)}
          />
        </>
      ) : (
        <>
          <PriorityButton
            name="Off"
            modifier="off"
            color="light-grey"
            enabled={!priority}
            onClick={createSetPriority(null)}
          />

          <PriorityButton
            name="Low"
            color="red"
            enabled={priority === JobPriority.Low}
            onClick={createSetPriority(JobPriority.Low)}
          />

          <PriorityButton
            name="Medium"
            color="yellow"
            enabled={priority === JobPriority.Medium}
            onClick={createSetPriority(JobPriority.Medium)}
          />

          <PriorityButton
            name="High"
            color="green"
            enabled={priority === JobPriority.High}
            onClick={createSetPriority(JobPriority.High)}
          />
        </>
      )}
    </Stack>
  );
};

const JobRow = (
  props: {
    className?: string;
    job: Job;
    name: string;
  },
  context
) => {
  const { data } = useBackend<PreferencesMenuData>(context);
  const { className, job, name } = props;

  const isOverflow = data.overflow_role === name;
  const priority = data.job_preferences[name];

  const createSetPriority = createCreateSetPriorityFromName(context, name);

  const experienceNeeded =
    data.job_required_experience && data.job_required_experience[name];
  const daysLeft = data.job_days_left ? data.job_days_left[name] : 0;

  let rightSide: InfernoNode;

  if (experienceNeeded) {
    const { experience_type, required_playtime } = experienceNeeded;
    const hoursNeeded = Math.ceil(required_playtime / 60);

    rightSide = (
      <Stack align="center" height="100%" pr={1}>
        <Stack.Item grow textAlign="right">
          <b>{hoursNeeded}h</b> as {experience_type}
        </Stack.Item>
      </Stack>
    );
  } else if (daysLeft > 0) {
    rightSide = (
      <Stack align="center" height="100%" pr={1}>
        <Stack.Item grow textAlign="right">
          <b>{daysLeft}</b> day{daysLeft === 1 ? '' : 's'} left
        </Stack.Item>
      </Stack>
    );
  } else if (data.job_bans && data.job_bans.indexOf(name) !== -1) {
    rightSide = (
      <Stack align="center" height="100%" pr={1}>
        <Stack.Item grow textAlign="right">
          <b>Banned</b>
        </Stack.Item>
      </Stack>
    );
  } else {
    rightSide = (
      <PriorityButtons
        createSetPriority={createSetPriority}
        isOverflow={isOverflow}
        priority={priority}
      />
    );
  }

  return (
    <Stack.Item
      className={className}
      height="100%"
      style={{
        'margin-top': 0,
      }}>
      <Stack fill align="center">
        <Tooltip content={job.description} position="bottom-start">
          <Stack.Item
            className="job-name"
            width="50%"
            style={{
              'padding-left': '0.3em',
            }}>
            {name}
          </Stack.Item>
        </Tooltip>

        <Stack.Item grow className="options">
          {rightSide}
        </Stack.Item>
      </Stack>
    </Stack.Item>
  );
};

const Department: SFC<{ department: string }> = (props) => {
  const { children, department: name } = props;
  const className = `PreferencesMenu__Jobs__departments--${name}`;

  return (
    <ServerPreferencesFetcher
      render={(data) => {
        if (!data) {
          return null;
        }

        const { departments, jobs } = data.jobs;
        const department = departments[name];

        // This isn't necessarily a bug, it's like this
        // so that you can remove entire departments without
        // having to edit the UI.
        // This is used in events, for instance.
        if (!department) {
          return null;
        }

        const jobsForDepartment = sortJobs(
          Object.entries(jobs).filter(([_, job]) => job.department === name),
          department.head
        );

        return (
          <Box>
            <Stack vertical fill>
              {jobsForDepartment.map(([name, job]) => {
                return (
                  <JobRow
                    className={classes([
                      className,
                      name === department.head && 'head',
                    ])}
                    key={name}
                    job={job}
                    name={name}
                  />
                );
              })}
            </Stack>

            {children}
          </Box>
        );
      }}
    />
  );
};

// *Please* find a better way to do this, this is RIDICULOUS.
// All I want is for a gap to pretend to be an empty space.
// But in order for everything to align, I also need to add the 0.2em padding.
// But also, we can't be aligned with names that break into multiple lines!
const Gap = (props: { amount: number }) => {
  // 0.2em comes from the padding-bottom in the department listing
  return <Box height={`calc(${props.amount}px + 0.2em)`} />;
};

const JoblessRoleDropdown = (props, context) => {
  const { act, data } = useBackend<PreferencesMenuData>(context);
  const selected = data.character_preferences.misc.joblessrole;

  const options = [
    {
      displayText: `Join as ${data.overflow_role} if unavailable`,
      value: JoblessRole.BeOverflow,
    },
    {
      displayText: `Join as a random job if unavailable`,
      value: JoblessRole.BeRandomJob,
    },
    {
      displayText: `Return to lobby if unavailable`,
      value: JoblessRole.ReturnToLobby,
    },
  ];

  return (
    <Box position="absolute" right={0} width="30%">
      <Dropdown
        width="100%"
        selected={selected}
        onSelected={createSetPreference(act, 'joblessrole')}
        options={options}
        displayText={
          <Box pr={1}>
            {options.find((option) => option.value === selected)!.displayText}
          </Box>
        }
      />
    </Box>
  );
};

const DepartmentPopTracker: SFC<{ department: string }> = (props, context) => {
  const { department: name } = props;

  const prefData = useBackend<PreferencesMenuData>(context);
  const hasSigned: boolean = !!prefData.data.department_counts[name];
  if (!hasSigned) {
    return;
  }

  const signedCount: number = prefData.data.department_counts[name];
  let highCount: number = 0;
  if (prefData.data.department_high && prefData.data.department_high[name]) {
    highCount = prefData.data.department_high[name];
  }
  return (
    <Section backgroundColor="#6a6a6a" ml={'-2px'} mr={'-2px'}>
      <Stack vertical>
        <Stack.Item>
          <b>{name}</b>
        </Stack.Item>
        <Stack.Item>{signedCount} ready.</Stack.Item>
        <Stack.Item>{highCount} high priority.</Stack.Item>
      </Stack>
    </Section>
  );
};

const DepartmentPopArea: SFC = (props, context) => {
  const prefData = useBackend<PreferencesMenuData>(context);
  const hasDepartments: boolean =
    Object.keys(prefData.data.department_counts).length > 0;
  if (!hasDepartments) {
    return (
      <Section mb={`5px`}>
        Nobody who is ready has selected any jobs in departments yet!
      </Section>
    );
  }
  return (
    <Section>
      <Stack>
        {Object.keys(prefData.data.department_counts).map((department) => (
          <Stack.Item
            key={department}
            grow
            textAlign="center"
            className="options">
            <DepartmentPopTracker department={department} />
          </Stack.Item>
        ))}
      </Stack>
    </Section>
  );
};

const HeadPopTracker: SFC<{
  name: string;
  colour: string;
  heads: string[];
}> = (props, context) => {
  const { name, colour, heads } = props;
  if (heads.length === 0) {
    heads.push('None');
  }
  return (
    <Section backgroundColor="#6a6a6a" ml={'-2px'} mr={'-2px'}>
      <Stack vertical>
        <Stack.Item backgroundColor={colour}>
          <b>{name}</b>
        </Stack.Item>
        {heads.map((role) => (
          <Stack.Item key={role}>{role}</Stack.Item>
        ))}
      </Stack>
    </Section>
  );
};

const HeadPopArea: SFC = (props, context) => {
  const prefData = useBackend<PreferencesMenuData>(context);
  const hasHeads: boolean = Object.keys(prefData.data.biggest_head).length > 0;
  if (!hasHeads) {
    return (
      <Section mb={`5px`}>
        Nobody who is ready has selected any Head of Staff jobs yet!
      </Section>
    );
  }
  let low: string[] = [];
  let medium: string[] = [];
  let high: string[] = [];
  for (const head of Object.keys(prefData.data.biggest_head)) {
    switch (prefData.data.biggest_head[head]) {
      case 1:
        low.push(head);
        break;
      case 2:
        medium.push(head);
        break;
      case 3:
        high.push(head);
        break;
    }
  }
  return (
    <Section>
      <Stack fill>
        <Stack.Item grow textAlign="center" className="options">
          <HeadPopTracker name="High" colour="#1b9638" heads={high} />
        </Stack.Item>
        <Stack.Item grow textAlign="center" className="options">
          <HeadPopTracker name="Medium" colour="#d9b804" heads={medium} />
        </Stack.Item>
        <Stack.Item grow textAlign="center" className="options">
          <HeadPopTracker name="Low" colour="#bd2020" heads={low} />
        </Stack.Item>
      </Stack>
    </Section>
  );
};

export const JobsPage = () => {
  return (
    <>
      <JoblessRoleDropdown />

      <Stack vertical fill>
        <Gap amount={22} />

        <Stack.Item>
          <Stack fill className="PreferencesMenu__Jobs">
            <Stack.Item mr={1}>
              <Gap amount={36} />

              <PriorityHeaders />

              <Department department="Engineering">
                <Gap amount={6} />
              </Department>

              <Department department="Science">
                <Gap amount={6} />
              </Department>

              <Department department="Silicon">
                <Gap amount={12} />
              </Department>

              <Department department="Assistant" />
            </Stack.Item>

            <Stack.Item mr={1}>
              <PriorityHeaders />

              <Department department="Captain">
                <Gap amount={6} />
              </Department>

              <Department department="Service">
                <Gap amount={6} />
              </Department>

              <Department department="Cargo" />
            </Stack.Item>

            <Stack.Item>
              <Gap amount={36} />

              <PriorityHeaders />

              <Department department="Security">
                <Gap amount={6} />
              </Department>

              <Department department="Medical" />
            </Stack.Item>
          </Stack>
        </Stack.Item>
        <Gap amount={22} />
        <Stack.Item>
          <Section backgroundColor="#848484">
            <Stack vertical fill>
              <Stack.Item>
                <Tooltip
                  content={
                    'A count of unique, readied players who have selected jobs in each department.'
                  }
                  position="bottom-start">
                  <Section
                    backgroundColor="#6a6a6a"
                    mr={'-4px'}
                    ml={'-4px'}
                    mb={'2px'}>
                    <b>Populated Departments</b>
                  </Section>
                </Tooltip>
              </Stack.Item>
              <Stack.Item>
                <DepartmentPopArea />
              </Stack.Item>

              <Stack.Item>
                <Tooltip
                  content={
                    'A display of the minimum priority any player has picked for a head of staff.'
                  }
                  position="bottom-start">
                  <Section
                    backgroundColor="#6a6a6a"
                    mr={'-4px'}
                    ml={'-4px'}
                    mt={'-10px'}
                    mb={'2px'}>
                    <b>Heads of Staff</b>
                  </Section>
                </Tooltip>
              </Stack.Item>
              <Stack.Item>
                <HeadPopArea />
              </Stack.Item>
            </Stack>
          </Section>
        </Stack.Item>
      </Stack>
    </>
  );
};
