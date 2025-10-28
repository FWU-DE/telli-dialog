import Link from 'next/link';
import { fetchFederalStates } from '../../../services/federal-states-service';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ui/components/Table';
import { ROUTES } from '../../../consts/routes';

export default async function FederalStateListView() {
  const federalStates = await fetchFederalStates();

  return (
    <div>
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
          {federalStates.map((federalState) => (
            <TableRow key={federalState.id}>
              <TableCell>{federalState.id}</TableCell>
              <TableCell>{federalState.telliName}</TableCell>
              <TableCell>{federalState.createdAt}</TableCell>
              <TableCell>
                <Link
                  key={federalState.id}
                  href={ROUTES.dialog.federalStateDetails(federalState.id)}
                >
                  Details
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
