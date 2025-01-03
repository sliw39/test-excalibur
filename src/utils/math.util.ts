export const Functions = {
  sigmoid: (ymax = 1, xmin = 0, xmax = 1, slope = 1) => {
    const std = (x: number) => 1 / (1 + Math.exp(-slope * x));
    const norm = Functions.normalize(xmin, xmax);
    return (x: number) => {
      const xn = norm(x) * 12 - 6;
      return std(xn) * ymax;
    };
  },
  falling:
    (ymax = 1, ymin = 0, xmax = 1, fallstart = 0.5) =>
    (x: number) => {
      if (x < fallstart) return ymax;
      return ymin + ((ymax - ymin) * (x - fallstart)) / (xmax - fallstart);
    },
  normalize: (min: number, max: number) => (x: number) => {
    return (x - min) / (max - min);
  },
};
