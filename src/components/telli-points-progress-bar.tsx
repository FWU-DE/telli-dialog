type TelliPointsProgressBarProps = {
  percentage: number;
};

export default function TelliPointsProgressBar({
  percentage: _percentage,
}: TelliPointsProgressBarProps) {
  const percentage = Math.max(Math.ceil(_percentage), 0);

  function getColorByProgress() {
    if (percentage > 30) {
      return '#02A59B';
    }
    if (percentage > 10) {
      return '#FEE585';
    }
    return '#E94D52';
  }

  const color = getColorByProgress();

  return (
    <div className="flex flex-col w-full">
      <div className="w-full">
        <div className="w-full h-3 relative">
          <div
            className="bg-slate-100 h-3 transition-all duration-500 ease-in-out absolute left-0"
            style={{ width: '100%' }}
          ></div>
          <div
            className="h-3 transition-all duration-500 ease-in-out absolute left-0"
            style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: color }}
          ></div>
        </div>
        <div className="mt-2 text-sm text-right text-dark-gray">{percentage} %</div>
      </div>
    </div>
  );
}
