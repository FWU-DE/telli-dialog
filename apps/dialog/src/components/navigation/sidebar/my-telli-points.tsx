import TelliPointsProgressBar from '@/components/telli-points-progress-bar';

type MyTelliPointsProps = {
  text: string;
  currentModelCosts: number;
  userPriceLimit: number;
};

export function MyTelliPoints({ text, currentModelCosts, userPriceLimit }: MyTelliPointsProps) {
  return (
    <div className="p-2">
      <div className="text-base mb-2">{text}</div>
      <TelliPointsProgressBar percentage={100 - (currentModelCosts / userPriceLimit) * 100} />
    </div>
  );
}
