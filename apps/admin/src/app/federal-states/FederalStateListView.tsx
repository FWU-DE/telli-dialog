import Link from 'next/link';
import { fetchFederalStates } from '../../services/federal-states-service';
import { FEDERAL_STATE_BY_ID_ROUTE } from './[federal-state-id]/page';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@ui/components/Table';

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
                  href={FEDERAL_STATE_BY_ID_ROUTE.replace('{id}', federalState.id)}
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
