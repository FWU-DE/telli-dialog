import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ui/components/Table';
import { fetchLargeLanguageModels } from '../../services/llm-service';
import { fetchSingleOrganization } from '../../services/organization-service';
import { Checkbox } from '@ui/components/Checkbox';

export async function LargeLanguageModelListView() {
  const organization = await fetchSingleOrganization();
  const languageModels = await fetchLargeLanguageModels(organization.id);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Anzeigename</TableHead>
          <TableHead>Provider</TableHead>
          <TableHead>Neu</TableHead>
          <TableHead>Gelöscht</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {languageModels.map((model) => (
          <TableRow key={model.id}>
            <TableCell>{model.name}</TableCell>
            <TableCell>{model.displayName}</TableCell>
            <TableCell>{model.provider}</TableCell>
            <TableCell>
              <Checkbox checked={model.isNew} disabled />
            </TableCell>
            <TableCell>
              <Checkbox checked={model.isDeleted} disabled />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
