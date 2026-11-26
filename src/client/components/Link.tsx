import { Anchor, Button } from '@mantine/core';
import type { AnchorProps, ButtonProps, ElementProps } from '@mantine/core';
import { createLink } from '@tanstack/react-router';
import type { LinkComponent } from '@tanstack/react-router';
import { forwardRef } from 'react';

type MantineAnchorProps = AnchorProps & ElementProps<'a', keyof AnchorProps>;
type MantineButtonProps = ButtonProps & ElementProps<'a', keyof ButtonProps>;

const MantineAnchor = forwardRef<HTMLAnchorElement, MantineAnchorProps>(
  (props, ref) => <Anchor {...props} ref={ref} />,
);

const MantineButton = forwardRef<HTMLAnchorElement, MantineButtonProps>(
  (props, ref) => <Button component="a" {...props} ref={ref} />,
);

const CreatedRouterAnchor = createLink(MantineAnchor);
const CreatedRouterButton = createLink(MantineButton);

export const Link: LinkComponent<typeof MantineAnchor> = (props) => (
  <CreatedRouterAnchor {...props} />
);

export const LinkButton: LinkComponent<typeof MantineButton> = (props) => (
  <CreatedRouterButton {...props} />
);
