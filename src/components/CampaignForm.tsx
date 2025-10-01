import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Save } from 'lucide-react';

interface EmailData {
  sequence_number: number;
  subject: string;
  html_content: string;
  delay_hours: number;
}

export function CampaignForm() {
  const [campaignName, setCampaignName] = useState('');
  const [emails, setEmails] = useState<EmailData[]>([
    { sequence_number: 1, subject: '', html_content: '', delay_hours: 0 },
    { sequence_number: 2, subject: '', html_content: '', delay_hours: 24 },
    { sequence_number: 3, subject: '', html_content: '', delay_hours: 72 },
    { sequence_number: 4, subject: '', html_content: '', delay_hours: 168 },
  ]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const updateEmail = (index: number, field: keyof EmailData, value: string | number) => {
    const updated = [...emails];
    updated[index] = { ...updated[index], [field]: value };
    setEmails(updated);
  };

  const addEmail = () => {
    if (emails.length < 4) {
      setEmails([
        ...emails,
        {
          sequence_number: emails.length + 1,
          subject: '',
          html_content: '',
          delay_hours: 0,
        },
      ]);
    }
  };

  const removeEmail = (index: number) => {
    if (emails.length > 1) {
      const updated = emails.filter((_, i) => i !== index);
      updated.forEach((email, i) => {
        email.sequence_number = i + 1;
      });
      setEmails(updated);
    }
  };

  const saveCampaign = async () => {
    if (!campaignName.trim()) {
      setMessage('Por favor, insira um nome para a campanha');
      return;
    }

    if (emails.some(e => !e.subject.trim() || !e.html_content.trim())) {
      setMessage('Todos os emails devem ter assunto e conteúdo HTML');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const { data: existingCampaigns } = await supabase
        .from('campaigns')
        .update({ is_active: false })
        .eq('is_active', true);

      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .insert({
          name: campaignName,
          from_email: 'isa@isadate.online',
          is_active: true,
        })
        .select()
        .single();

      if (campaignError) throw campaignError;

      const emailsToInsert = emails.map(email => ({
        campaign_id: campaign.id,
        sequence_number: email.sequence_number,
        subject: email.subject,
        html_content: email.html_content,
        delay_hours: email.delay_hours,
      }));

      const { error: emailsError } = await supabase
        .from('campaign_emails')
        .insert(emailsToInsert);

      if (emailsError) throw emailsError;

      setMessage('Campanha criada com sucesso!');
      setCampaignName('');
      setEmails([
        { sequence_number: 1, subject: '', html_content: '', delay_hours: 0 },
        { sequence_number: 2, subject: '', html_content: '', delay_hours: 24 },
        { sequence_number: 3, subject: '', html_content: '', delay_hours: 72 },
        { sequence_number: 4, subject: '', html_content: '', delay_hours: 168 },
      ]);
    } catch (error) {
      setMessage(`Erro: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Criar Nova Campanha</h2>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.includes('sucesso')
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message}
        </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Nome da Campanha
        </label>
        <input
          type="text"
          value={campaignName}
          onChange={(e) => setCampaignName(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Ex: Campanha de Boas-vindas"
        />
      </div>

      <div className="space-y-6">
        {emails.map((email, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Email #{email.sequence_number}
              </h3>
              {emails.length > 1 && (
                <button
                  onClick={() => removeEmail(index)}
                  className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50"
                >
                  <Trash2 size={20} />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assunto
                </label>
                <input
                  type="text"
                  value={email.subject}
                  onChange={(e) => updateEmail(index, 'subject', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Assunto do email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conteúdo HTML
                </label>
                <textarea
                  value={email.html_content}
                  onChange={(e) => updateEmail(index, 'html_content', e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder="<h1>Olá {{name}}</h1><p>Seu conteúdo aqui...</p>"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Atraso (horas)
                </label>
                <input
                  type="number"
                  value={email.delay_hours}
                  onChange={(e) => updateEmail(index, 'delay_hours', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Enviar após {email.delay_hours} horas do cadastro
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {emails.length < 4 && (
        <button
          onClick={addEmail}
          className="mt-6 flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg border border-blue-200"
        >
          <Plus size={20} />
          Adicionar Email
        </button>
      )}

      <button
        onClick={saveCampaign}
        disabled={saving}
        className="mt-8 w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
      >
        <Save size={20} />
        {saving ? 'Salvando...' : 'Salvar Campanha'}
      </button>
    </div>
  );
}
