import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ui/components/Table';
import { fetchModelApiKeyMappings } from '../../../../../../../../../services/model-api-key-mapping-service';

export type ModelApiKeyMappingListViewProps = {
  organizationId: string;
  projectId: string;
  apiKeyId: string;
};

export async function ModelApiKeyMappingListView({
  organizationId,
  projectId,
  apiKeyId,
}: ModelApiKeyMappingListViewProps) {
  const modelApiKeyMappings = await fetchModelApiKeyMappings(organizationId, projectId, apiKeyId);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[300px]">Id</TableHead>
          <TableHead>API Key Id</TableHead>
          <TableHead>Modell Id</TableHead>
          <TableHead>Erstellt am</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {modelApiKeyMappings.map((mapping) => (
          <TableRow key={mapping.id}>
            <TableCell>{mapping.id}</TableCell>
            <TableCell>{mapping.apiKeyId}</TableCell>
            <TableCell>{mapping.llmModelId}</TableCell>
            <TableCell>{JSON.stringify(mapping.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
