
import { useState, useEffect, useCallback } from 'react';
import * as DriveService from '../services/googleDriveService';

export interface DriveFile {
  content: string;
  name: string;
}

export const useGoogleDrive = () => {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        await DriveService.initGoogleDrive();
        if (mounted) {
          setIsReady(DriveService.isGoogleConfigured());
        }
      } catch (err: any) {
        console.error("Failed to initialize Google Drive:", err);
        if (mounted) {
          setError(err.message || 'Failed to initialize Drive');
        }
      }
    };
    init();
    return () => { mounted = false; };
  }, []);

  const pickFile = useCallback(async (): Promise<DriveFile | null> => {
    if (!isReady) {
       throw new Error("Google Drive is not configured.");
    }
    setError(null);
    setIsLoading(true);
    try {
      const result = await DriveService.pickFileFromDrive();
      return result;
    } catch (e: any) {
      if (e === 'Selection cancelled') {
        return null;
      }
      const msg = e.message || String(e);
      setError(msg);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [isReady]);

  const saveFile = useCallback(async (content: string, fileName: string) => {
    if (!isReady) {
       throw new Error("Google Drive is not configured.");
    }
    setError(null);
    setIsLoading(true);
    try {
      await DriveService.saveFileToDrive(content, fileName);
    } catch (e: any) {
      const msg = e.message || String(e);
      setError(msg);
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [isReady]);

  return {
    isReady,
    isLoading,
    error,
    pickFile,
    saveFile
  };
};
