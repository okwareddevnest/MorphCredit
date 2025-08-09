import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WagmiConfig } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './lib/wallet';
import { Layout } from './components/Layout';
import { Home } from './routes/Home';
import { Score } from './routes/Score';
import { Repay } from './routes/Repay';
import { Agreements } from './routes/Agreements';
import { Profile } from './routes/Profile';
import { SettingsPage } from './routes/Settings';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <WagmiConfig config={config}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/score" element={<Score />} />
              <Route path="/repay" element={<Repay />} />
              <Route path="/agreements" element={<Agreements />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </Layout>
        </Router>
      </QueryClientProvider>
    </WagmiConfig>
  );
}

export default App; 