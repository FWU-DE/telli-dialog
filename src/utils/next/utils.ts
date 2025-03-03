import { PageContext } from './types';

export async function awaitPageContext(pageContext: PageContext) {
  return { params: await pageContext.params, searchParams: await pageContext.searchParams };
}
