/**
 * Asserção do envelope de erro padrão de standards.md:
 *   { error: { code, message, details } }
 */
export function expectEnvelope(body: unknown, code?: string): void {
  expect(body).toHaveProperty('error');
  const erro = (body as { error: { code: unknown; message: unknown; details: unknown } }).error;
  expect(typeof erro.code).toBe('string');
  expect(typeof erro.message).toBe('string');
  expect(Array.isArray(erro.details)).toBe(true);
  if (code) {
    expect(erro.code).toBe(code);
  }
}
