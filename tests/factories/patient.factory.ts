import { faker } from '@faker-js/faker';

export interface Patient {
  id?: string;
  name: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  email?: string;
  phone?: string;
  address?: string;
  createdAt?: string;
}

export const patientFactory = (overrides: Partial<Patient> = {}): Patient => {
  const gender = faker.helpers.arrayElement(['male', 'female', 'other']);
  const firstName = faker.person.firstName(gender === 'male' ? 'male' : 'female');
  const lastName = faker.person.lastName();
  const dateOfBirth = faker.date.birthdate({ min: 18, max: 90, mode: 'age' });

  return {
    id: faker.string.uuid(),
    name: `${firstName} ${lastName}`,
    dateOfBirth: dateOfBirth.toISOString().split('T')[0],
    gender,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    phone: faker.phone.number(),
    address: faker.location.streetAddress(),
    createdAt: faker.date.past().toISOString(),
    ...overrides,
  };
};

export const createMultiplePatients = (count: number, overrides: Partial<Patient> = {}): Patient[] => {
  return Array.from({ length: count }, () => patientFactory(overrides));
};
