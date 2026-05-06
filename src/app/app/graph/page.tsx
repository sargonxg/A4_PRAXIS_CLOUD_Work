import GraphOpsPage from '../graphops/page';
import { CypherConsole } from '@/components/graph/cypher-console';

export default function GraphSurfacePage() {
  return (
    <div className="space-y-5">
      <GraphOpsPage />
      <div className="px-6 pb-6">
        <CypherConsole />
      </div>
    </div>
  );
}
