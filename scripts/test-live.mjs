import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY;
const password = process.env.TEST_USER_PASSWORD;
if (!url || !key || !password)
  throw new Error(
    'Copy .env.live.example to .env.live and provide the test password before running npm run test:live.',
  );
const accounts = {
  customer: 'customer@wasl.test',
  other: 'other.customer@wasl.test',
  agent: 'agent@wasl.test',
  second: 'agent.two@wasl.test',
  manager: 'manager@wasl.test',
};
const clients = {};
const users = {};
function ok(result) {
  if (result.error) throw result.error;
  return result.data;
}
async function denied(promise) {
  const result = await promise;
  assert.ok(result.error, 'Expected the server to reject this operation');
}
for (const [role, email] of Object.entries(accounts)) {
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const data = ok(await client.auth.signInWithPassword({ email, password }));
  clients[role] = client;
  users[role] = data.user;
}
const { customer, other, agent, second, manager } = clients;
const id = ok(
  await customer.rpc('create_request', {
    p_title: `Verification ${new Date().toISOString()}`,
    p_description:
      'Automated live verification of shared requests, permissions, private notes, and attachments.',
    p_category: 'technical',
    p_urgency: 'normal',
  }),
);
console.log(`Live request created: ${id}`);
const get = async (client = customer) =>
  ok(await client.from('requests').select('*').eq('id', id).single());
try {
  assert.equal(ok(await other.from('requests').select('id').eq('id', id)).length, 0);
  await denied(
    other.rpc('send_message', {
      p_id: id,
      p_version: 1,
      p_body: 'Unauthorized customer',
      p_internal: false,
    }),
  );
  await denied(customer.from('profiles').update({ role: 'manager' }).eq('id', users.customer.id));
  ok(await agent.rpc('change_request', { p_id: id, p_version: 1, p_action: 'claim' }));
  await denied(second.rpc('change_request', { p_id: id, p_version: 1, p_action: 'claim' }));
  ok(
    await agent.rpc('send_message', {
      p_id: id,
      p_version: (await get()).version,
      p_body: 'A customer-visible reply',
      p_internal: false,
    }),
  );
  ok(
    await agent.rpc('send_message', {
      p_id: id,
      p_version: (await get()).version,
      p_body: 'Private operational diagnosis',
      p_internal: true,
    }),
  );
  const visible = ok(await customer.from('messages').select('*').eq('request_id', id));
  assert.equal(visible.length, 1);
  assert.equal(visible[0].internal, false);
  assert.equal(ok(await agent.from('messages').select('*').eq('request_id', id)).length, 2);
  await denied(agent.rpc('manager_workload'));
  const file = new Blob(['%PDF-1.7\nLive permission verification\n%%EOF'], {
    type: 'application/pdf',
  });
  const attachment = ok(
    await agent
      .rpc('reserve_attachment', {
        p_id: id,
        p_name: 'internal-verification.pdf',
        p_mime: 'application/pdf',
        p_size: file.size,
        p_internal: true,
      })
      .single(),
  );
  ok(
    await agent.storage
      .from('request-attachments')
      .upload(attachment.storage_path, file, { contentType: 'application/pdf' }),
  );
  ok(await agent.rpc('finish_attachment', { p_id: attachment.id }));
  assert.equal(ok(await customer.from('attachments').select('*').eq('request_id', id)).length, 0);
  await denied(customer.storage.from('request-attachments').download(attachment.storage_path));
  assert.equal(
    ok(await agent.storage.from('request-attachments').download(attachment.storage_path)).size,
    file.size,
  );
  const publicFile = ok(
    await customer
      .rpc('reserve_attachment', {
        p_id: id,
        p_name: 'customer-verification.pdf',
        p_mime: 'application/pdf',
        p_size: file.size,
        p_internal: false,
      })
      .single(),
  );
  ok(
    await customer.storage
      .from('request-attachments')
      .upload(publicFile.storage_path, file, { contentType: 'application/pdf' }),
  );
  ok(await customer.rpc('finish_attachment', { p_id: publicFile.id }));
  assert.equal(ok(await customer.from('attachments').select('*').eq('request_id', id)).length, 1);
  assert.equal(
    ok(await customer.storage.from('request-attachments').download(publicFile.storage_path)).size,
    file.size,
  );
  await denied(other.storage.from('request-attachments').download(publicFile.storage_path));
  ok(
    await customer.rpc('send_message', {
      p_id: id,
      p_version: (await get()).version,
      p_body: 'Here is the additional information',
      p_internal: false,
    }),
  );
  ok(
    await agent.rpc('change_request', {
      p_id: id,
      p_version: (await get()).version,
      p_action: 'resolve',
      p_value: 'The issue was investigated and resolved successfully.',
    }),
  );
  await denied(
    customer.rpc('send_message', {
      p_id: id,
      p_version: (await get()).version,
      p_body: 'This is closed',
      p_internal: false,
    }),
  );
  ok(
    await customer.rpc('change_request', {
      p_id: id,
      p_version: (await get()).version,
      p_action: 'reopen',
    }),
  );
  await denied(
    agent.rpc('change_request', {
      p_id: id,
      p_version: (await get()).version,
      p_action: 'assign',
      p_value: users.second.id,
    }),
  );
  ok(
    await manager.rpc('change_request', {
      p_id: id,
      p_version: (await get()).version,
      p_action: 'assign',
      p_value: users.second.id,
    }),
  );
  await denied(
    agent.rpc('send_message', {
      p_id: id,
      p_version: (await get()).version,
      p_body: 'Former owner',
      p_internal: false,
    }),
  );
  assert.equal((await get()).assigned_to, users.second.id);
  assert.ok(Array.isArray(ok(await manager.rpc('manager_workload'))));
  ok(
    await second.rpc('change_request', {
      p_id: id,
      p_version: (await get()).version,
      p_action: 'resolve',
      p_value: 'Live verification completed. This test request can be retained for audit.',
    }),
  );
  console.log(
    'PASS: live authentication, RLS, ownership, concurrency, lifecycle, internal notes, private/public attachments, and manager aggregates.',
  );
  console.log(
    'The resolved verification request and two small files are retained. Use a dedicated test project for repeated runs.',
  );
} finally {
  await Promise.all(
    Object.values(clients).map((client) => client.auth.signOut({ scope: 'local' })),
  );
}
