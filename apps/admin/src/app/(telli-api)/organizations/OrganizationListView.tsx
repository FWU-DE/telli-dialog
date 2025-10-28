import Link from 'next/link';
import { fetchOrganizations } from '../../../services/organization-service';
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
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {organizations.map((org) => (
          <TableRow key={org.id}>
            <TableCell>{org.id}</TableCell>
            <TableCell>{org.name}</TableCell>
            <TableCell>{JSON.stringify(org.createdAt)}</TableCell>
            <TableCell className="flex flex-row gap-4">
              <Link href={`/organizations/${org.id}/llms`}>Modelle</Link>
              <Link href={`/organizations/${org.id}/projects`}>Projekte</Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
