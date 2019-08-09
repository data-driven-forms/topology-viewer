export const updateDimensions = (canvas) => {
  const coords = canvas.getBoundingClientRect();
  const canvasWidth = canvas.clientWidth;
  const canvasHeight = canvas.clientHeight;
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  return {
    coords,
    canvasWidth,
    canvasHeight
  }
}
