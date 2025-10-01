import { useState } from 'react';
import { CampaignForm } from './components/CampaignForm';
import { CampaignList } from './components/CampaignList';
import { EmailStatus } from './components/EmailStatus';
import { Mail, Settings, BarChart } from 'lucide-react';

type Tab = 'create' | 'campaigns' | 'status';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('create');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">GUD 2.0</h1>
          <p className="text-lg text-gray-600">
            Sistema de Automação de Campanhas de Email
          </p>
        </header>

        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-md p-2 flex gap-2">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'create'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Settings size={20} />
              Criar Campanha
            </button>
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'campaigns'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Mail size={20} />
              Campanhas
            </button>
            <button
              onClick={() => setActiveTab('status')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'status'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <BarChart size={20} />
              Status
            </button>
          </div>
        </div>

        <div className="flex justify-center">
          {activeTab === 'create' && <CampaignForm />}
          {activeTab === 'campaigns' && <CampaignList />}
          {activeTab === 'status' && <EmailStatus />}
        </div>

        <footer className="mt-12 text-center text-gray-600">
          <p className="mb-2">Emails enviados de: isa@isadate.online</p>
          <p className="text-sm">
            As campanhas são acionadas automaticamente quando novos usuários são
            cadastrados na tabela user_trials
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;
