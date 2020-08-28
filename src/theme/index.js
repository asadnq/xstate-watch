const generateScale = (distance, total, unit) =>
  Array(total).fill().map((_, idx) => String(`${idx * distance}${unit}`));

export const theme = {
  space: generateScale(0.25, 20, 'rem'),
  fontSizes: generateScale(0.25, 15, 'rem'),
};

export default theme;
