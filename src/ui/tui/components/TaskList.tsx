import { Box, Text } from 'ink';
import { Colors, Icons } from '../styles.js';

export type TaskItem = {
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
};

type TaskListProps = {
  tasks: TaskItem[];
};

const STATUS_ICONS: Record<TaskItem['status'], string> = {
  pending: Icons.circle,
  active: Icons.triangleRight,
  done: Icons.bullet,
  error: Icons.cross,
};

const STATUS_COLORS: Record<TaskItem['status'], string> = {
  pending: Colors.muted,
  active: Colors.accent,
  done: Colors.success,
  error: Colors.error,
};

export function TaskList({ tasks }: TaskListProps) {
  const done = tasks.filter((t) => t.status === 'done').length;
  const total = tasks.length;

  return (
    <Box flexDirection="column">
      <Box marginBottom={1} gap={1}>
        <Text bold>Todo</Text>
        <Text color={Colors.muted}>
          ({done}/{total})
        </Text>
      </Box>
      {tasks.map((task) => (
        <Box key={task.label} gap={1}>
          <Text color={STATUS_COLORS[task.status]}>{STATUS_ICONS[task.status]}</Text>
          <Text color={task.status === 'pending' ? Colors.muted : undefined}>{task.label}</Text>
        </Box>
      ))}
    </Box>
  );
}
