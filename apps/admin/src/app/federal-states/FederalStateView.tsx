export type FederalState = {
  id: string;
  teacherPriceLimit: number;
  studentPriceLimit: number;
  createdAt: string;
  updatedAt: string;
  mandatoryCertificationTeacher: boolean;
  chatStorageTime: number;
  supportContact: string;
  trainingLink: string;
  telliName: string;
  studentAccess: boolean;
  enableCharacter: boolean;
  enableSharedChats: boolean;
  enableCustomGpt: boolean;
};

export type FederalStateViewProps = {
  federalState: FederalState;
};

export function FederalStateView(props: FederalStateViewProps) {
  return (
    <div className="flex gap-4 p-2">
      <span>ID: {props.federalState.id}</span>
      <span>teacherPriceLimit: {props.federalState.teacherPriceLimit}</span>
      <span>studentPriceLimit: {props.federalState.studentPriceLimit}</span>
      <span>mandatoryCertificationTeacher: {props.federalState.mandatoryCertificationTeacher}</span>
      <span>chatStorageTime: {props.federalState.chatStorageTime}</span>
    </div>
  );
}
