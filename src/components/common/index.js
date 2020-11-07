import styled from 'styled-components';
import {
  color,
  border,
  space,
  layout,
  typography,
  flexbox,
} from 'styled-system';

export const Box = styled('div')(
  {
    boxSizing: 'border-box',
  },
  space,
  layout,
  color,
  border,
);

export const Flex = styled('div')(
  {
    boxSizing: 'border-box',
    display: 'flex',
  },
  flexbox,
  space,
  layout,
  color,
);

export const Text = styled('span')({}, typography);
