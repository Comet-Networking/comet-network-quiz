import { Anchor } from '@mantine/core';
import type { AnchorProps, ElementProps } from '@mantine/core';
import { createLink } from '@tanstack/react-router';
import type { LinkComponent } from '@tanstack/react-router';
import { forwardRef } from 'react';

type MantineAnchorProps = AnchorProps & ElementProps<'a', keyof AnchorProps>;

const MantineAnchor = forwardRef<HTMLAnchorElement, MantineAnchorProps>(
  (props, ref) => <Anchor {...props} ref={ref} />,
);

const CreatedRouterAnchor = createLink(MantineAnchor);

export const Link: LinkComponent<typeof MantineAnchor> = (props) => (
  <CreatedRouterAnchor {...props} />
);
