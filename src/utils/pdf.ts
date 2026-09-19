/**
 * Utilitários compartilhados para geração de documentos PDF (jsPDF)
 * Utilizado por OrdersView, QuotesView, InventoryView e FinancialView
 */

/**
 * Converte a URL ou imagem do logo do ateliê em representação Base64 válida para inserção no jsPDF.
 * Possui fallback para imagem transparente 1x1 caso a URL seja vazia, emoji ou inacessível.
 */
export const loadLogoBase64 = (logoUrl?: string): Promise<string> => {
  return new Promise((resolve) => {
    const fallbackPixel = 'data:image/png;base64,iVBOR0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR42mP8DwABAQEAWk1vMwAAAABJRU5ErkJggg==';
    
    if (!logoUrl || logoUrl.trim() === '' || logoUrl === '📿') {
      resolve(fallbackPixel);
      return;
    }

    // Se já estiver em base64/dataURL, retorna diretamente
    if (logoUrl.startsWith('data:image/')) {
      resolve(logoUrl);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function() {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
          return;
        }
      } catch (e) {
        console.warn("Canvas conversion failed, using direct source", e);
      }
      resolve(logoUrl);
    };
    img.onerror = function() {
      resolve(fallbackPixel);
    };
    img.src = logoUrl;
  });
};
