# GUD 2.0 - Sistema de Automação de Campanhas de Email

## Configuração Inicial

### 1. Configurar API Key do Resend

Edite o arquivo `.env` e adicione sua chave API do Resend:

```
RESEND_API_KEY=re_sua_chave_api_aqui
```

### 2. Configurar Cron Job no Supabase

Para que os emails sejam enviados automaticamente, você precisa configurar um Cron Job no Supabase para executar a Edge Function `process-scheduled-emails` regularmente.

#### Passos:

1. Acesse o Dashboard do Supabase
2. Vá em **Database** → **Extensions**
3. Habilite a extensão `pg_cron`
4. Vá em **SQL Editor** e execute o seguinte comando:

```sql
-- Executar a cada 5 minutos
SELECT cron.schedule(
  'process-scheduled-emails',
  '*/5 * * * *',
  $$
  SELECT
    net.http_post(
      url:='https://eqgkofamfaotektcgofv.supabase.co/functions/v1/process-scheduled-emails',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
    ) as request_id;
  $$
);
```

**Importante:** Substitua `https://eqgkofamfaotektcgofv.supabase.co` pela URL do seu projeto Supabase.

#### Alternativa com Supabase CLI

Se preferir usar o Supabase CLI:

```bash
supabase functions schedule process-scheduled-emails --cron "*/5 * * * *"
```

### 3. Configurar Segredos no Supabase

A API Key do Resend precisa estar disponível como variável de ambiente nas Edge Functions:

1. Acesse o Dashboard do Supabase
2. Vá em **Settings** → **Edge Functions**
3. Em **Secrets**, adicione:
   - Nome: `RESEND_API_KEY`
   - Valor: Sua chave API do Resend

## Como Funciona

### Fluxo Automático

1. **Novo usuário cadastrado** → Um novo registro é inserido na tabela `user_trials`
2. **Trigger automático** → O trigger `trigger_schedule_campaign_emails` agenda automaticamente os 4 emails da campanha ativa
3. **Cron Job** → A cada 5 minutos, o Cron Job executa a função `process-scheduled-emails`
4. **Envio de emails** → A função verifica emails agendados cujo horário já passou e os envia via Resend
5. **Atualização de status** → O status do email é atualizado para "sent" ou "failed"

### Criar uma Campanha

1. Acesse a aba "Criar Campanha"
2. Digite o nome da campanha
3. Configure os 4 emails:
   - Assunto
   - Conteúdo HTML
   - Atraso em horas (0 = imediato, 24 = após 1 dia, etc.)
4. Clique em "Salvar Campanha"

**Nota:** Apenas uma campanha pode estar ativa por vez. Ao ativar uma nova campanha, a anterior será desativada automaticamente.

### Testar o Sistema

Para testar, insira um registro de teste na tabela `user_trials`:

```sql
INSERT INTO user_trials (email, name)
VALUES ('seu-email@example.com', 'Seu Nome');
```

Os 4 emails serão automaticamente agendados e você poderá acompanhar o status na aba "Status".

## Estrutura do Banco de Dados

- **user_trials** - Usuários que se cadastraram
- **campaigns** - Campanhas criadas
- **campaign_emails** - 4 emails de cada campanha
- **scheduled_emails** - Emails agendados para envio

## Edge Functions

- **send-email** - Envia um email via Resend API
- **process-scheduled-emails** - Processa emails agendados (executado pelo Cron Job)

## Variáveis de Ambiente

```
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon
RESEND_API_KEY=sua_chave_resend
```
