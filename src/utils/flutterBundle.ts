import JSZip from 'jszip';

const rawModules = import.meta.glob('/flutter_app/**/*', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

export interface FlutterSourceFile {
  path: string;
  content: string;
}

export function getFlutterProjectFiles(): FlutterSourceFile[] {
  return Object.entries(rawModules)
    .map(([fullPath, content]) => ({
      path: fullPath.replace(/^\/flutter_app\//, ''),
      content,
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

export async function downloadFlutterProjectZip(): Promise<void> {
  const zip = new JSZip();
  const files = getFlutterProjectFiles();
  for (const file of files) {
    zip.file(`sensor_data_dashboard/${file.path}`, file.content);
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'sensor-data-dashboard-flutter.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
