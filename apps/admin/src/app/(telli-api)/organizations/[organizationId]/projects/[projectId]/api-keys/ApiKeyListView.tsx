import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ui/components/Table';
import { fetchApiKeys } from '../../../../../../../services/api-key-service';
import Link from 'next/link';
import { ROUTES } from '../../../../../../../consts/routes';

export type ApiKeyListViewProps = {
  organizationId: string;
  projectId: string;
};

export async function ApiKeyListView({ organizationId, projectId }: ApiKeyListViewProps) {
  const apiKeys = await fetchApiKeys(organizationId, projectId);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[300px]">Id</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Limit in Cent</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Erstellt am</TableHead>
          <TableHead>Läuft ab am</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {apiKeys.map((apiKey) => (
          <TableRow key={apiKey.id}>
            <TableCell>{apiKey.id}</TableCell>
            <TableCell>{apiKey.name}</TableCell>
            <TableCell>{apiKey.limitInCent}</TableCell>
            <TableCell>{apiKey.state}</TableCell>
            <TableCell>{JSON.stringify(apiKey.createdAt)}</TableCell>
            <TableCell>{JSON.stringify(apiKey.expiresAt)}</TableCell>
            <TableCell>
              <Link href={ROUTES.api.apiKeyModelMappings(organizationId, projectId, apiKey.id)}>
                Sprachmodelle
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
