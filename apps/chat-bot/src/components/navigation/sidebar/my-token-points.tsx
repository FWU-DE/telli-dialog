import TokenPointsProgressBar from '@/components/token-points-progress-bar';

type MyTokenPointsProps = {
  text: string;
  usedBudget: number;
  maxBudget: number;
};

export function MyTokenPoints({ text, usedBudget, maxBudget }: MyTokenPointsProps) {
  return (
    <div className="p-2">
      <div className="text-base mb-2">{text}</div>
      <TokenPointsProgressBar percentage={100 - (usedBudget / maxBudget) * 100} />
    </div>
  );
}
