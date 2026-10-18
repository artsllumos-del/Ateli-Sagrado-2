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

    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(fallbackPixel);
      }
    }, 2500);

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function() {
      if (resolved) return;
      clearTimeout(timeout);
      resolved = true;
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
      if (resolved) return;
      clearTimeout(timeout);
      resolved = true;
      resolve(fallbackPixel);
    };
    img.src = logoUrl;
  });
};

/**
 * Converte uma URL de foto de insumo em Base64 para jsPDF com timeout e fallback visual elegante.
 */
export const loadItemImageBase64 = (imageUrl?: string, placeholderLabel = 'PEÇA'): Promise<string> => {
  return new Promise((resolve) => {
    const generateFallback = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 120;
        canvas.height = 120;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Fundo suave neutro
          ctx.fillStyle = '#F8FAFC';
          ctx.fillRect(0, 0, 120, 120);
          
          // Borda sutil
          ctx.strokeStyle = '#E2E8F0';
          ctx.lineWidth = 2;
          ctx.strokeRect(1, 1, 118, 118);

          // Círculo decorativo
          ctx.fillStyle = '#F1F5F9';
          ctx.beginPath();
          ctx.arc(60, 52, 28, 0, Math.PI * 2);
          ctx.fill();

          // Inicial / Sigla
          ctx.fillStyle = '#94A3B8';
          ctx.font = 'bold 22px Helvetica, Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const initials = (placeholderLabel || 'P').substring(0, 2).toUpperCase();
          ctx.fillText(initials, 60, 52);

          // Legenda
          ctx.font = '9px Helvetica, Arial, sans-serif';
          ctx.fillStyle = '#CBD5E1';
          ctx.fillText('SEM FOTO', 60, 92);

          return canvas.toDataURL('image/png');
        }
      } catch (e) {
        // ignore
      }
      return 'data:image/png;base64,iVBOR0KGgoAAAANSUhEUgAAAAEAAAABCAAAAAA6fptVAAAACklEQVR42mP8DwABAQEAWk1vMwAAAABJRU5ErkJggg==';
    };

    if (!imageUrl || imageUrl.trim() === '' || imageUrl === '📿') {
      resolve(generateFallback());
      return;
    }

    if (imageUrl.startsWith('data:image/')) {
      resolve(imageUrl);
      return;
    }

    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(generateFallback());
      }
    }, 2500);

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function() {
      if (resolved) return;
      clearTimeout(timeout);
      resolved = true;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 120;
        canvas.height = img.naturalHeight || img.height || 120;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
          return;
        }
      } catch (e) {
        console.warn("Canvas conversion failed for item image", e);
      }
      resolve(generateFallback());
    };
    img.onerror = function() {
      if (resolved) return;
      clearTimeout(timeout);
      resolved = true;
      resolve(generateFallback());
    };
    img.src = imageUrl;
  });
};
