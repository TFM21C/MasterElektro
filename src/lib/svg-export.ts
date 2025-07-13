export function exportSvg(svgElement: SVGSVGElement | null, fileName: string): void {
  if (!svgElement) {
    console.error("SVG element not found for export.");
    return;
  }

  // Create a clone of the SVG element to avoid modifying the original
  const svgClone = svgElement.cloneNode(true) as SVGSVGElement;

  // Add XML namespace if not present (important for standalone SVGs)
  if (!svgClone.getAttribute('xmlns')) {
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }
  
  // Find existing style or create one
  let styleElement: SVGStyleElement | null = svgClone.querySelector('style') as SVGStyleElement | null;
  if (!styleElement) {
    styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    svgClone.insertBefore(styleElement, svgClone.firstChild); // Prepend to ensure styles are applied
  }

  // Get global CSS styles that are relevant (simplified example)
  // A more robust solution would involve parsing CSS rules applicable to the SVG elements
  const globalStyles = `
    .line { stroke: black; stroke-width: 1.5; fill: none; }
    .symbol { stroke: black; stroke-width: 1.5; fill: white; }
    .text-pin { font-size: 8px; fill: #555; text-anchor: middle; dominant-baseline: middle; }
    .component-text { font-size: 10px; fill: black; text-anchor: start; dominant-baseline: middle; }
    .font-bold { font-weight: bold; }
  `;
  // Append global styles to existing or new style element
  if (styleElement) {
    styleElement.textContent += globalStyles;
  }


  const svgData = new XMLSerializer().serializeToString(svgClone);
  const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
