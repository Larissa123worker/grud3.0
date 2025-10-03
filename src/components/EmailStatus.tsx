import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ScheduledEmail } from '../types/database';
import { Clock, CheckCircle, XCircle, Mail, Ban, Trash2 } from 'lucide-react';

export function EmailStatus() {
  const [emails, setEmails] = useState<ScheduledEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent' | 'failed' | 'cancelled'>('all');

  useEffect(() => {
    loadEmails();
    const channel = supabase
      .channel('scheduled_emails_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scheduled_emails' },
        () => {
          loadEmails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadEmails = async () => {
    try {
      const { data, error } = await supabase
        .from('scheduled_emails')
        .select('*')
        .order('scheduled_for', { ascending: false })
        .limit(50);

      if (error) throw error;
      setEmails(data || []);
    } catch (error) {
      console.error('Error loading emails:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmails = filter === 'all'
    ? emails
    : emails.filter(email => email.status === filter);

  const cancelEmail = async (id: string) => {
    if (!confirm('Tem certeza que deseja cancelar este email? Ele não será enviado.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('scheduled_emails')
        .update({ status: 'cancelled', error_message: 'Cancelado pelo usuário' })
        .eq('id', id)
        .eq('status', 'pending');

      if (error) throw error;
      loadEmails();
    } catch (error) {
      console.error('Error cancelling email:', error);
      alert('Erro ao cancelar email.');
    }
  };

  const deleteCancelledEmails = async () => {
    if (!confirm('Tem certeza que deseja excluir TODOS os emails cancelados? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('scheduled_emails')
        .delete()
        .eq('status', 'cancelled');

      if (error) throw error;
      loadEmails();
      alert('Emails cancelados excluídos com sucesso!');
    } catch (error) {
      console.error('Error deleting cancelled emails:', error);
      alert('Erro ao excluir emails cancelados.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={20} className="text-yellow-600" />;
      case 'sent':
        return <CheckCircle size={20} className="text-green-600" />;
      case 'failed':
        return <XCircle size={20} className="text-red-600" />;
      case 'cancelled':
        return <Ban size={20} className="text-gray-600" />;
      default:
        return <Mail size={20} className="text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-8">
        <p className="text-gray-600">Carregando emails...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Status dos Emails</h2>

        <div className="flex items-center gap-2">
          {['all', 'pending', 'sent', 'failed', 'cancelled'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'cancelled' ? 'Cancelados' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}

          <button
            onClick={deleteCancelledEmails}
            className="flex items-center justify-center w-10 h-10 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition-colors"
            title="Excluir todos os emails cancelados"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {filteredEmails.length === 0 ? (
        <p className="text-gray-600">Nenhum email encontrado.</p>
      ) : (
        <div className="space-y-3">
          {filteredEmails.map((email) => (
            <div
              key={email.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(email.status)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-800">{email.recipient_name}</p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(email.status)}`}>
                        {email.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{email.recipient_email}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>
                        Agendado: {new Date(email.scheduled_for).toLocaleString('pt-BR', {
                          timeZone: 'America/Sao_Paulo',
                          dateStyle: 'short',
                          timeStyle: 'short'
                        })}
                      </span>
                      {email.sent_at && (
                        <span>
                          Enviado: {new Date(email.sent_at).toLocaleString('pt-BR', {
                            timeZone: 'America/Sao_Paulo',
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })}
                        </span>
                      )}
                    </div>
                    {email.error_message && (
                      <p className="text-xs text-red-600 mt-2">
                        Erro: {email.error_message}
                      </p>
                    )}
                  </div>
                </div>

                {email.status === 'pending' && (
                  <button
                    onClick={() => cancelEmail(email.id)}
                    className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium transition-colors text-sm"
                    title="Cancelar envio"
                  >
                    <Ban size={16} />
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
