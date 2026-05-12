import html2canvas from 'html2canvas';

/**
 * 指定 ID の DOM 要素を PNG としてダウンロードする。
 * @param elementId  - スクリーンショット対象要素の id 属性値
 * @param filename   - ダウンロードファイル名（デフォルト: 'mhwilds-result.png'）
 */
export async function exportPng(
  elementId: string,
  filename = 'mhwilds-result.png',
): Promise<void> {
  const el = document.getElementById(elementId);
  if (!el) {
    throw new Error(`exportPng: element #${elementId} not found`);
  }
  const canvas = await html2canvas(el, {
    useCORS: true,
    scale: 2,
    backgroundColor: null,
  });
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
