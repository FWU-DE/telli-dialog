import TokenPointsProgressBar from '@/components/token-points-progress-bar';

type MyTokenPointsProps = {
  text: string;
  currentModelCosts: number;
  userPriceLimit: number;
};

export function MyTokenPoints({ text, currentModelCosts, userPriceLimit }: MyTokenPointsProps) {
  return (
    <div className="p-2">
      <div className="text-base mb-2">{text}</div>
      <TokenPointsProgressBar percentage={100 - (currentModelCosts / userPriceLimit) * 100} />
    </div>
  );
}
