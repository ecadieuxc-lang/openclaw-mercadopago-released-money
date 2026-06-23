export async function runDoctor() {
  return {
    ok: true,
    service: 'openclaw-mercadopago-released-money',
    mode: 'synthetic',
    checks: {
      api: 'available',
      config_contract: 'documented',
      parser: 'available',
      secrets: 'not_checked_in_sandbox',
      sqlite_persistence: 'not_enabled_in_this_task',
    },
  };
}
