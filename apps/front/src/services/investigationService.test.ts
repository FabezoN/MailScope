import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Mock } from 'vitest';
import { investigationService } from './investigationService';
import { api } from './api';

vi.mock('./api', () => ({
  api: { post: vi.fn(), get: vi.fn(), delete: vi.fn() },
}));

describe('investigationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('create poste l\'email et retourne l\'investigation créée', async () => {
    const investigation = { id: 'inv-1', email: 'test@gmail.com', status: 'PENDING' };
    (api.post as Mock).mockResolvedValue({ data: investigation });

    const result = await investigationService.create('test@gmail.com');

    expect(api.post).toHaveBeenCalledWith('/investigations', { email: 'test@gmail.com' });
    expect(result).toEqual(investigation);
  });

  it('findAll appelle l\'API sans filtre par défaut', async () => {
    (api.get as Mock).mockResolvedValue({ data: [] });

    await investigationService.findAll();

    expect(api.get).toHaveBeenCalledWith('/investigations', { params: undefined });
  });

  it('findAll transmet le statut en paramètre de requête', async () => {
    (api.get as Mock).mockResolvedValue({ data: [] });

    await investigationService.findAll('COMPLETED');

    expect(api.get).toHaveBeenCalledWith('/investigations', { params: { status: 'COMPLETED' } });
  });

  it('findOne récupère une investigation par id', async () => {
    const investigation = { id: 'inv-1' };
    (api.get as Mock).mockResolvedValue({ data: investigation });

    const result = await investigationService.findOne('inv-1');

    expect(api.get).toHaveBeenCalledWith('/investigations/inv-1');
    expect(result).toEqual(investigation);
  });

  it('retry relance une investigation par id', async () => {
    const investigation = { id: 'inv-1', status: 'PENDING' };
    (api.post as Mock).mockResolvedValue({ data: investigation });

    const result = await investigationService.retry('inv-1');

    expect(api.post).toHaveBeenCalledWith('/investigations/inv-1/retry');
    expect(result).toEqual(investigation);
  });

  it('remove supprime une investigation par id', async () => {
    (api.delete as Mock).mockResolvedValue({ data: undefined });

    await investigationService.remove('inv-1');

    expect(api.delete).toHaveBeenCalledWith('/investigations/inv-1');
  });

  it('removeAll supprime toutes les investigations', async () => {
    (api.delete as Mock).mockResolvedValue({ data: undefined });

    await investigationService.removeAll();

    expect(api.delete).toHaveBeenCalledWith('/investigations');
  });
});
