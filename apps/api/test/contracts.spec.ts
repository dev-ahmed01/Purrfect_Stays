import {
  createPetSchema,
  propertySearchSchema,
  upsertPetPolicySchema,
} from '@purrfect/contracts';

describe('shared contracts', () => {
  it('rejects a one-sided availability search', () => {
    const result = propertySearchSchema.safeParse({
      checkIn: '2026-11-10',
      page: 1,
      pageSize: 12,
    });
    expect(result.success).toBe(false);
  });

  it('normalizes duplicate amenity filters', () => {
    const result = propertySearchSchema.parse({
      amenities: ['garden', 'garden', 'VET-SUPPORT'],
      page: 1,
      pageSize: 12,
    });
    expect(result.amenities).toEqual(['garden', 'vet-support']);
  });

  it('transforms pet date-only fields to UTC calendar dates', () => {
    const pet = createPetSchema.parse({
      name: 'Bruno',
      species: 'DOG',
      breed: 'Golden Retriever',
      size: 'LARGE',
      birthDate: '2022-05-10',
      vaccinated: true,
    });
    expect(pet.birthDate?.toISOString()).toBe('2022-05-10T00:00:00.000Z');
  });

  it('rejects a breed listed as both allowed and restricted', () => {
    const result = upsertPetPolicySchema.safeParse({
      maxPets: 2,
      petFeePaise: 50000,
      petFeeMode: 'PER_STAY',
      allowsDogs: true,
      allowsCats: false,
      allowsOther: false,
      allowedSizes: ['SMALL', 'MEDIUM'],
      allowedBreedKeys: ['beagle'],
      restrictedBreedKeys: ['beagle'],
      requiresVaccination: true,
    });
    expect(result.success).toBe(false);
  });
});
