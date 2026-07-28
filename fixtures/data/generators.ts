import { faker } from '@faker-js/faker';

export function generateUser(overrides?: Partial<{ emailPrefix: string; password: string }>) {
  return {
    email: `${overrides?.emailPrefix ?? faker.internet.userName()}@example.com`,
    password: overrides?.password ?? faker.internet.password({ length: 12, memorable: false }),
  };
}

export function generateSearchTerm(): string {
  return faker.commerce.product();
}

export function generateInvalidSearchTerm(): string {
  const patterns = ['!@#$%^&*"', '<script>alert("xss")</script>', 'a'.repeat(100), ''];
  return faker.helpers.arrayElement(patterns);
}
