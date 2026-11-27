import { CopyButton, UnstyledButton, Text } from '@mantine/core';

export function CopyableText({ text }: { text: string; display?: string }) {
  return (
    <CopyButton value={text} timeout={1500}>
      {({ copy }) => (
        <UnstyledButton
          onClick={copy}
          style={{ maxWidth: '100%', textAlign: 'left' }}
        >
          <Text style={{ overflowWrap: 'anywhere' }}>{text}</Text>
        </UnstyledButton>
      )}
    </CopyButton>
  );
}
