import '../styles/global.scss';
import { useRouter } from 'next/router';

import CorkscrewBackground from '../assets/illustrations/corkscrewBlurred';
import Metadata from 'components/general/metadata';
import RestrictedRoute from 'components/general/restrictedRoute';
import AppProviders from 'components/general/appProviders';

/**
 * App root Component
 */
const App = ({ Component, pageProps }: any) => {
  const { pathname } = useRouter();
  const marketingRoutes = ['/', '/tiers', '/about', '/faq', '/terms'];
  const notMarketingSite = !marketingRoutes.includes(pathname);

  return (
    <AppProviders authorizationProps={{ ...pageProps }}>
      <Metadata {...pageProps} />
      {notMarketingSite && <CorkscrewBackground />}
      <RestrictedRoute {...pageProps}>
        <Component {...pageProps} />
      </RestrictedRoute>
    </AppProviders>
  );
};

export default App;