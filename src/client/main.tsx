import '@mantine/core/styles.css';
import { MantineProvider, createTheme, Button } from '@mantine/core';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { routeTree } from './routeTree.gen';

const router = createRouter({ routeTree });

// default attributes for mantine elements
const theme = createTheme({
  components: {
    Button: Button.extend({
      defaultProps: { h: 50, fz: 16},
    }),
  },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root mount point');

createRoot(root).render(
  <StrictMode>
    <MantineProvider theme={theme}>
      <RouterProvider router={router} />
    </MantineProvider>
  </StrictMode>,
);
