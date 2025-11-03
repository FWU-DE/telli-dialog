import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ui/components/Table';
import { fetchProjects } from '../../../../../services/project-service';
import Link from 'next/link';
import { ROUTES } from '../../../../../consts/routes';

export type ProjectListViewProps = {
  organizationId: string;
};

export async function ProjectListView({ organizationId }: ProjectListViewProps) {
  const projects = await fetchProjects(organizationId);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[300px]">Id</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Erstellt am</TableHead>
          <TableHead></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id}>
            <TableCell>{project.id}</TableCell>
            <TableCell>{project.name}</TableCell>
            <TableCell>{JSON.stringify(project.createdAt)}</TableCell>
            <TableCell>
              <Link href={ROUTES.api.apiKeys(organizationId, project.id)}>Api keys</Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
