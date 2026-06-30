import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { OsintService } from './osint.service';

jest.mock('child_process');

class FakeChildProcess extends EventEmitter {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
}

describe('OsintService', () => {
  let service: OsintService;
  let fakeChild: FakeChildProcess;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    service = new OsintService();
    fakeChild = new FakeChildProcess();
    (spawn as jest.Mock).mockReturnValue(fakeChild);

    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const emitHolehe = (payload: unknown, code = 0) => {
    fakeChild.stdout.emit('data', Buffer.from(JSON.stringify(payload)));
    fakeChild.emit('close', code);
  };

  it('extrait le domaine de l\'email et combine holehe + xon', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ExposedBreaches: null }) });

    const promise = service.analyze({ email: 'test@gmail.com' });
    emitHolehe([{ platform: 'twitter', exists: true, emailRecovery: false, rateLimit: false }]);

    const result = await promise;

    expect(result.email).toBe('test@gmail.com');
    expect(result.domain).toBe('gmail.com');
    expect(result.holehe).toEqual([
      { platform: 'twitter', exists: true, emailRecovery: false, rateLimit: false },
    ]);
    expect(result.xon).toEqual([]);
    expect(typeof result.durationMs).toBe('number');
  });

  it('retourne un tableau vide si holehe quitte avec un code non nul', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ExposedBreaches: null }) });

    const promise = service.analyze({ email: 'test@gmail.com' });
    fakeChild.emit('close', 1);

    const result = await promise;

    expect(result.holehe).toEqual([]);
  });

  it('retourne un tableau vide si la sortie de holehe n\'est pas un JSON valide', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ExposedBreaches: null }) });

    const promise = service.analyze({ email: 'test@gmail.com' });
    fakeChild.stdout.emit('data', Buffer.from('not json'));
    fakeChild.emit('close', 0);

    const result = await promise;

    expect(result.holehe).toEqual([]);
  });

  it('retourne un tableau vide si le process holehe ne démarre pas', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ExposedBreaches: null }) });

    const promise = service.analyze({ email: 'test@gmail.com' });
    fakeChild.emit('error', new Error('ENOENT'));

    const result = await promise;

    expect(result.holehe).toEqual([]);
  });

  it('mappe les fuites XposedOrNot vers le format interne', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        ExposedBreaches: {
          breaches_details: [
            {
              breach: 'Adobe',
              domain: 'adobe.com',
              industry: 'Tech',
              password_risk: 'High',
              xposed_data: 'Emails; Passwords',
              xposed_date: '2013',
              xposed_records: 153000000,
              verified: 'Yes',
            },
          ],
        },
      }),
    });

    const promise = service.analyze({ email: 'test@gmail.com' });
    emitHolehe([]);

    const result = await promise;

    expect(result.xon).toEqual([
      {
        breach: 'Adobe',
        domain: 'adobe.com',
        industry: 'Tech',
        passwordRisk: 'High',
        xposedData: ['Emails', 'Passwords'],
        xposedDate: '2013',
        xposedRecords: 153000000,
        verified: true,
      },
    ]);
  });

  it('retourne un tableau vide si XposedOrNot répond en erreur', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });

    const promise = service.analyze({ email: 'test@gmail.com' });
    emitHolehe([]);

    const result = await promise;

    expect(result.xon).toEqual([]);
  });

  it('retourne un tableau vide si l\'appel à XposedOrNot échoue', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));

    const promise = service.analyze({ email: 'test@gmail.com' });
    emitHolehe([]);

    const result = await promise;

    expect(result.xon).toEqual([]);
  });
});
