import React from 'react';
import { Box, Flex, Text } from 'components/common';

const Bullet = ({ size }) => (
  <Box
    width={size}
    height={size}
    border="solid 1px #333"
    bg="#333"
    borderRadius={5}
  />
);

export const TimeDisplay = ({ hours, minutes, seconds }) => {
  const [topContent, bottomContent, rightContent] = (() => {
    if (Number.isNaN(hours)) return [minutes, seconds, null];
    return [hours, minutes, seconds];
  })();

  const fontSize1 = 12;
  const fontSize2 = 10;
  const bulletSize = '.5rem';

  return (
    <Box width={125} height={160}>
      <Flex justifyContent="center" className="time-display">
        <Flex alignItems="center">
          <Flex flexDirection="column">
            <Box>
              <Text fontSize={fontSize1}>{topContent}</Text>
            </Box>
            <Box>
              <Flex>
                <Box ml={2}>
                  <Bullet size={bulletSize} />
                </Box>
                <Box ml={3}>
                  <Bullet size={bulletSize} />
                </Box>
              </Flex>
            </Box>
            <Box>
              <Text fontSize={fontSize1}>{bottomContent}</Text>
            </Box>
          </Flex>
          {rightContent && (
            <Flex>
              <Text fontSize={fontSize2}>{seconds}</Text>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Box>
  );
};
