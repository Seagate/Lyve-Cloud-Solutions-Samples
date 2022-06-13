export const compareRetNumber: (firstEle: string | number, secondEle: string | number) => number = (
  firstEle,
  secondEle,
) => {
  if (firstEle > secondEle) {
    return 1;
  }
  if (firstEle < secondEle) {
    return -1;
  }
  return 0;
};
