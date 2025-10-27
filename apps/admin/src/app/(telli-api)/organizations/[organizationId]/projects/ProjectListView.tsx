import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ui/components/Table';
import { fetchProjects } from '../../../../../services/project-service';

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
        </TableRow>
      </TableHeader>
      <TableBody>
        {projects.map((project) => (
          <TableRow key={project.id}>
            <TableCell>{project.id}</TableCell>
            <TableCell>{project.name}</TableCell>
            <TableCell>{JSON.stringify(project.createdAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
