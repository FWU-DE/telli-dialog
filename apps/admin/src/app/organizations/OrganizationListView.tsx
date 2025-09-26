import { fetchOrganizations } from '../../services/organization-service';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ui/components/Table';

export async function OrganizationListView() {
  const organizations = await fetchOrganizations();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[300px]">Id</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Erstellt am</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {organizations.map((org) => (
          <TableRow key={org.id}>
            <TableCell>{org.id}</TableCell>
            <TableCell>{org.name}</TableCell>
            <TableCell>{JSON.stringify(org.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
