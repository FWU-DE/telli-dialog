import '@ui/styles/globals.css';
import { FederalStateOperations } from './FederalStateOperations';

export default async function Layout(props: LayoutProps<'/federal-states/[federalStateId]'>) {
  const { children, params } = props;
  const { federalStateId } = await params;

  return (
    <div className="grid grid-cols-[1fr_auto] gap-8">
      {children}
      <FederalStateOperations federalStateId={federalStateId} />
    </div>
  );
}
