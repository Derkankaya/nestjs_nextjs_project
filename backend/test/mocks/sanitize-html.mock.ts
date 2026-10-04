// test/mocks/sanitize-html.mock.ts
function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';
  // Test ortamı için basitleştirilmiş ama gerçekçi davranış: script/style etiketlerini ve olay handler'larını temizle
  return dirty
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '');
}

sanitizeHtml.simpleTransform = (_tagName: string, _attribs: Record<string, string>) => {
  return (tagName: string, attribs: Record<string, string>) => ({ tagName, attribs });
};

export default sanitizeHtml;