import { redirect } from 'next/navigation';

export default function ToolsArchiveRedirect() {
  redirect('/app/tools?show_archive=1');
}
