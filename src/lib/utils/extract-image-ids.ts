/**
 * TipTap JSON contentから画像IDを抽出
 * @param content TipTap JSON content
 * @returns 重複なし画像IDの配列
 */
export function extractImageIds(content: any): string[] {
  const imageIds: string[] = [];

  function traverse(node: any) {
    if (!node) return;

    // 画像ノードの場合、imageIdを抽出
    if (node.type === 'image' && node.attrs?.imageId) {
      imageIds.push(node.attrs.imageId);
    }

    // 子ノードを再帰的に探索
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
  }

  traverse(content);

  // 重複削除
  return [...new Set(imageIds)];
}
