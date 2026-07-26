import { IStorageRepository } from '../../domain/repositories/IStorageRepository';

export class LocalStorageRepository implements IStorageRepository {
  async getStorageUsage(userId: string): Promise<{ usedMb: number; totalMb: number }> {
    return { usedMb: 42.5, totalMb: 2048 };
  }

  async uploadFile(userId: string, file: File | Blob, folder = 'general'): Promise<{ url: string; sizeMb: number }> {
    const sizeMb = parseFloat(((file.size || 50000) / (1024 * 1024)).toFixed(2));
    const objectUrl = URL.createObjectURL(file);
    return {
      url: objectUrl,
      sizeMb: sizeMb || 0.1
    };
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    return true;
  }
}
