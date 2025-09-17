import { FederalState } from '../../../types/federal-state';

export type FederalStateViewProps = {
  federalState: FederalState;
};

export function FederalStateView(props: FederalStateViewProps) {
  const federalState = props.federalState;

  return (
    <div className="flex gap-4 p-2">
      <span>ID: {federalState.id}</span>
      <span>teacherPriceLimit: {federalState.teacherPriceLimit}</span>
      <span>studentPriceLimit: {federalState.studentPriceLimit}</span>
      <span>mandatoryCertificationTeacher: {federalState.mandatoryCertificationTeacher}</span>
      <span>chatStorageTime: {federalState.chatStorageTime}</span>
    </div>
  );
}
