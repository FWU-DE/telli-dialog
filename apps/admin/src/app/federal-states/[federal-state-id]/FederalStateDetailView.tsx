import Link from 'next/dist/client/link';
import { Button } from '../../../components/common/Button';
import { FederalState } from '../../../types/federal-state';

export type FederalStateViewProps = {
  federalState: FederalState;
};

export function FederalStateView(props: FederalStateViewProps) {
  const federalState = props.federalState;

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold">Bundesland Detailansicht</h1>
        <span className="text-gray-500">({federalState.id})</span>
      </div>
      <div className="flex gap-8">
        <span>Id: {federalState.id}</span>
        <span>Name: {federalState.telliName}</span>
        <span>CreatedAt: {federalState.createdAt}</span>
      </div>
      <div className="flex gap-8">
        <span>teacherPriceLimit: {federalState.teacherPriceLimit}</span>
        <span>StudentAccess: {federalState.studentAccess}</span>
        <span>studentPriceLimit: {federalState.studentPriceLimit}</span>
      </div>
      <div className="flex gap-8">
        <span>chatStorageTime: {federalState.chatStorageTime}</span>
        <span>mandatoryCertificationTeacher: {federalState.mandatoryCertificationTeacher}</span>
        <span>TrainingLink: {federalState.trainingLink}</span>
        <span>SupportContacts: {federalState.supportContacts}</span>
      </div>
      <div className="flex gap-8">
        <span>EnableCharacter: {federalState.enableCharacter}</span>
        <span>EnableCustomGpt: {federalState.enableCustomGpt}</span>
        <span>EnableSharedChats: {federalState.enableSharedChats}</span>
      </div>
      <div>
        <div>DesignConfiguration:</div>
        <div>{JSON.stringify(federalState.designConfiguration)}</div>
      </div>
      <div className="flex gap-8">
        <Link href={`/federal-states/${federalState.id}/vouchers`}>
          <Button>Guthaben Codes</Button>
        </Link>
      </div>
    </div>
  );
}
