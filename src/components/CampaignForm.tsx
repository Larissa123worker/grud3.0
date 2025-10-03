import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Save, Eye } from 'lucide-react';

interface EmailData {
  sequence_number: number;
  subject: string;
  html_content: string;
  delay_hours: number;
}

export function CampaignForm() {
  const [campaignName, setCampaignName] = useState('');
  const [emails, setEmails] = useState<EmailData[]>([
    { sequence_number: 1, subject: '', html_content: '', delay_hours: 0.0833 }, // 5 minutes
    { sequence_number: 2, subject: '', html_content: '', delay_hours: 12 },    // 12 hours
    { sequence_number: 3, subject: '', html_content: '', delay_hours: 24 },    // 24 hours
    { sequence_number: 4, subject: '', html_content: '', delay_hours: 48 },    // 48 hours
  ]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [previewEmail, setPreviewEmail] = useState<number | null>(null);

  const updateEmail = (index: number, field: keyof EmailData, value: string | number) => {
    const updated = [...emails];
    updated[index] = { ...updated[index], [field]: value };
    setEmails(updated);
  };

  const addEmail = () => {
    if (emails.length < 4) {
      const nextSequence = emails.length + 1;
      const defaultDelay = nextSequence === 1 ? 0.0833 : nextSequence === 2 ? 12 : nextSequence === 3 ? 24 : 48;
      const newEmails = [
        ...emails,
        {
          sequence_number: nextSequence,
          subject: '',
          html_content: '',
          delay_hours: defaultDelay,
        },
      ];
      setEmails(newEmails);
      setPreviewEmail(newEmails.length - 1); // Abrir preview automaticamente para o novo email
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
      await supabase
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
        { sequence_number: 1, subject: '', html_content: '', delay_hours: 0.0833 }, // 5 minutes
        { sequence_number: 2, subject: '', html_content: '', delay_hours: 12 },    // 12 hours
        { sequence_number: 3, subject: '', html_content: '', delay_hours: 24 },    // 24 hours
        { sequence_number: 4, subject: '', html_content: '', delay_hours: 48 },    // 48 hours
      ]);
    } catch (error) {
      setMessage(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
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
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => setPreviewEmail(index)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Eye size={20} />
                    Visualizar
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Horário de Envio
                </label>
                <div className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg">
                  <span className="text-gray-700 font-medium">
                    {email.sequence_number === 1 && "5 minutos após o cadastro"}
                    {email.sequence_number === 2 && "12 horas após o cadastro"}
                    {email.sequence_number === 3 && "24 horas após o cadastro"}
                    {email.sequence_number === 4 && "48 horas após o cadastro"}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Horário fixo em São Paulo (GMT-3)
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

      {previewEmail !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Prévia: {emails[previewEmail].subject || 'Sem assunto'}
              </h3>
              <button
                onClick={() => setPreviewEmail(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div
              className="border border-gray-300 rounded-lg p-4 bg-gray-50"
              dangerouslySetInnerHTML={{ __html: emails[previewEmail].html_content }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
