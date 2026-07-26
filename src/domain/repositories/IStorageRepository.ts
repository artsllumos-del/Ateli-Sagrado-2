export interface IStorageRepository {
  getStorageUsage(userId: string): Promise<{ usedMb: number; totalMb: number }>;
  uploadFile(userId: string, file: File | Blob, folder?: string): Promise<{ url: string; sizeMb: number }>;
  deleteFile(fileUrl: string): Promise<boolean>;
}
