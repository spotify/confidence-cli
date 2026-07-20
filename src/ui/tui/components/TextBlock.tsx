import type { ReactNode } from 'react';
import { Box, Text } from 'ink';
type TextBlockProps = {
  children: ReactNode;
  color?: string;
  dimColor?: boolean;
  bold?: boolean;
  marginBottom?: number;
};

export function TextBlock({
  children,
  color,
  dimColor = false,
  bold = false,
  marginBottom = 0,
}: TextBlockProps) {
  return (
    <Box marginBottom={marginBottom}>
      <Text color={color} dimColor={dimColor} bold={bold}>
        {children}
      </Text>
    </Box>
  );
}
