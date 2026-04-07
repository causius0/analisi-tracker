import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ChartExportOptions } from '../types/charts';

/**
 * Export chart as PNG
 */
export async function exportAsPNG(
  element: HTMLElement,
  options: Partial<ChartExportOptions> = {}
): Promise<void> {
  const config: ChartExportOptions = {
    format: 'png',
    filename: 'chart',
    includeData: false,
    scale: 2,
    ...options,
  };

  try {
    const canvas = await html2canvas(element, {
      scale: config.scale,
      backgroundColor: '#ffffff',
      logging: false,
    });

    const link = document.createElement('a');
    link.download = `${config.filename}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    console.error('Error exporting as PNG:', error);
    throw new Error('Failed to export chart as PNG');
  }
}

/**
 * Export chart as SVG (by exporting as high-res PNG and embedding)
 */
export async function exportAsSVG(
  element: HTMLElement,
  options: Partial<ChartExportOptions> = {}
): Promise<void> {
  const config: ChartExportOptions = {
    format: 'svg',
    filename: 'chart',
    includeData: false,
    scale: 2,
    ...options,
  };

  try {
    // Get SVG elements within the chart
    const svgElements = element.querySelectorAll('svg');
    if (svgElements.length === 0) {
      throw new Error('No SVG elements found in chart');
    }

    // Serialize SVG
    const serializer = new XMLSerializer();
    let svgString = '';

    svgElements.forEach((svg, index) => {
      const clone = svg.cloneNode(true) as SVGElement;
      clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

      // Get dimensions
      const bbox = svg.getBoundingClientRect();
      clone.setAttribute('width', bbox.width.toString());
      clone.setAttribute('height', bbox.height.toString());

      svgString += serializer.serializeToString(clone);
    });

    // Create blob and download
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${config.filename}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting as SVG:', error);
    throw new Error('Failed to export chart as SVG');
  }
}

/**
 * Export chart as PDF
 */
export async function exportAsPDF(
  element: HTMLElement,
  options: Partial<ChartExportOptions> = {}
): Promise<void> {
  const config: ChartExportOptions = {
    format: 'pdf',
    filename: 'chart',
    includeData: false,
    scale: 2,
    width: 800,
    height: 600,
    ...options,
  };

  try {
    const canvas = await html2canvas(element, {
      scale: config.scale,
      backgroundColor: '#ffffff',
      logging: false,
      width: config.width,
      height: config.height,
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height],
    });

    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(`${config.filename}.pdf`);
  } catch (error) {
    console.error('Error exporting as PDF:', error);
    throw new Error('Failed to export chart as PDF');
  }
}

/**
 * Export chart data as CSV
 */
export async function exportAsCSV(
  data: any[],
  options: Partial<ChartExportOptions> = {}
): Promise<void> {
  const config: ChartExportOptions = {
    format: 'csv',
    filename: 'chart-data',
    includeData: true,
    ...options,
  };

  try {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    // Get headers
    const headers = Object.keys(data[0]);

    // Convert to CSV
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value ?? '');
          if (stringValue.includes(',') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        }).join(',')
      ),
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${config.filename}.csv`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting as CSV:', error);
    throw new Error('Failed to export data as CSV');
  }
}

/**
 * Export chart with multiple format options
 */
export async function exportChart(
  element: HTMLElement,
  data: any[] | null,
  options: ChartExportOptions
): Promise<void> {
  switch (options.format) {
    case 'png':
      await exportAsPNG(element, options);
      break;
    case 'svg':
      await exportAsSVG(element, options);
      break;
    case 'pdf':
      await exportAsPDF(element, options);
      break;
    case 'csv':
      if (!data) {
        throw new Error('Data is required for CSV export');
      }
      await exportAsCSV(data, options);
      break;
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}

/**
 * Print chart (secure implementation using DOM manipulation)
 */
export function printChart(element: HTMLElement): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Failed to open print window');
  }

  // Clone the element
  const clone = element.cloneNode(true) as HTMLElement;

  // Create print document using DOM manipulation (secure approach)
  const doc = printWindow.document;

  // Create document structure
  const doctype = doc.implementation.createDocumentType('html', '', '');
  doc.appendChild(doctype);

  const html = doc.createElement('html');
  doc.appendChild(html);

  const head = doc.createElement('head');
  html.appendChild(head);

  const title = doc.createElement('title');
  title.textContent = 'Chart Print';
  head.appendChild(title);

  const style = doc.createElement('style');
  style.textContent = `
    body {
      margin: 0;
      padding: 20px;
      font-family: Arial, sans-serif;
    }
    @media print {
      body {
        margin: 0;
        padding: 0;
      }
    }
  `;
  head.appendChild(style);

  const body = doc.createElement('body');
  html.appendChild(body);

  // Append cloned element
  body.appendChild(clone);

  // Add print script
  const script = doc.createElement('script');
  script.textContent = `
    window.onload = function() {
      window.print();
      window.onafterprint = function() {
        window.close();
      };
    };
  `;
  body.appendChild(script);
}

/**
 * Share chart as image (copy to clipboard)
 */
export async function shareChartAsImage(
  element: HTMLElement,
  options: Partial<ChartExportOptions> = {}
): Promise<void> {
  const config: ChartExportOptions = {
    format: 'png',
    filename: 'chart',
    includeData: false,
    scale: 2,
    ...options,
  };

  try {
    const canvas = await html2canvas(element, {
      scale: config.scale,
      backgroundColor: '#ffffff',
      logging: false,
    });

    // Convert to blob
    canvas.toBlob(async blob => {
      if (!blob) {
        throw new Error('Failed to create image blob');
      }

      // Copy to clipboard
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        console.log('Chart image copied to clipboard');
      } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        throw new Error('Failed to copy chart to clipboard');
      }
    }, 'image/png');
  } catch (error) {
    console.error('Error sharing chart as image:', error);
    throw new Error('Failed to share chart as image');
  }
}

/**
 * Generate shareable link (if chart data can be serialized)
 */
export function generateShareableLink(
  chartId: string,
  baseUrl: string = window.location.origin
): string {
  // Generate a unique shareable URL
  // In a real app, this would save the chart configuration to a database
  const shareUrl = new URL(baseUrl);
  shareUrl.searchParams.set('chart', chartId);
  shareUrl.searchParams.set('share', 'true');

  return shareUrl.toString();
}

/**
 * Download chart configuration (for sharing)
 */
export function downloadChartConfig(
  config: Record<string, any>,
  filename: string = 'chart-config'
): void {
  const configString = JSON.stringify(config, null, 2);
  const blob = new Blob([configString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `${filename}.json`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
