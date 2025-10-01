import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Campaign } from '../types/database';
import { CheckCircle, XCircle, Mail } from 'lucide-react';

export function CampaignList() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampaigns();
  }, []);

  const loadCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCampaign = async (id: string, currentStatus: boolean) => {
    try {
      if (!currentStatus) {
        await supabase
          .from('campaigns')
          .update({ is_active: false })
          .eq('is_active', true);
      }

      const { error } = await supabase
        .from('campaigns')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      loadCampaigns();
    } catch (error) {
      console.error('Error toggling campaign:', error);
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-8">
        <p className="text-gray-600">Carregando campanhas...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Campanhas Criadas</h2>

      {campaigns.length === 0 ? (
        <p className="text-gray-600">Nenhuma campanha criada ainda.</p>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Mail size={24} className="text-blue-600" />
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">
                      {campaign.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      De: {campaign.from_email}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Criada em: {new Date(campaign.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => toggleCampaign(campaign.id, campaign.is_active)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                    campaign.is_active
                      ? 'bg-green-100 text-green-700 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {campaign.is_active ? (
                    <>
                      <CheckCircle size={20} />
                      Ativa
                    </>
                  ) : (
                    <>
                      <XCircle size={20} />
                      Inativa
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
