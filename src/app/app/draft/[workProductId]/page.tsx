import { WorkProductEditor } from '@/components/editor/work-product-editor';

export default async function DraftWorkProductPage({ params }: { params: Promise<{ workProductId: string }> }) {
  const { workProductId } = await params;
  return (
    <div className="p-6">
      <WorkProductEditor workProductId={workProductId} />
    </div>
  );
}
