import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreatePetInput, UpdatePetInput } from '@purrfect/contracts';
import { Prisma } from '@purrfect/database';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class PetsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    const pets = await this.prisma.pet.findMany({
      where: {
        userId,
        archivedAt: null,
      },
      orderBy: [{ name: 'asc' }, { createdAt: 'asc' }],
    });

    return { items: pets.map(this.mapPet) };
  }

  async findOne(userId: string, petId: string) {
    const pet = await this.prisma.pet.findFirst({
      where: {
        id: petId,
        userId,
        archivedAt: null,
      },
    });

    if (!pet) throw new NotFoundException('Pet not found.');
    return this.mapPet(pet);
  }

  async create(userId: string, input: CreatePetInput) {
    const pet = await this.prisma.pet.create({
      data: {
        userId,
        name: input.name,
        species: input.species,
        breed: input.breed,
        size: input.size,
        weightKg: input.weightKg,
        birthDate: input.birthDate,
        vaccinated: input.vaccinated,
        specialNeeds: input.specialNeeds,
      },
    });

    return this.mapPet(pet);
  }

  async update(userId: string, petId: string, input: UpdatePetInput) {
    const existing = await this.prisma.pet.findFirst({
      where: {
        id: petId,
        userId,
        archivedAt: null,
      },
      select: { id: true },
    });

    if (!existing) throw new NotFoundException('Pet not found.');

    const pet = await this.prisma.pet.update({
      where: { id: petId },
      data: {
        ...(input.name === undefined ? {} : { name: input.name }),
        ...(input.species === undefined ? {} : { species: input.species }),
        ...(input.breed === undefined ? {} : { breed: input.breed }),
        ...(input.size === undefined ? {} : { size: input.size }),
        ...(input.weightKg === undefined ? {} : { weightKg: input.weightKg }),
        ...(input.birthDate === undefined ? {} : { birthDate: input.birthDate }),
        ...(input.vaccinated === undefined ? {} : { vaccinated: input.vaccinated }),
        ...(input.specialNeeds === undefined ? {} : { specialNeeds: input.specialNeeds }),
      },
    });

    return this.mapPet(pet);
  }

  async archive(userId: string, petId: string) {
    const existing = await this.prisma.pet.findFirst({
      where: {
        id: petId,
        userId,
        archivedAt: null,
      },
      select: { id: true },
    });

    if (!existing) throw new NotFoundException('Pet not found.');

    const pet = await this.prisma.pet.update({
      where: { id: petId },
      data: { archivedAt: new Date() },
    });

    return {
      archived: true,
      pet: this.mapPet(pet),
    };
  }

  private mapPet(pet: {
    id: string;
    name: string;
    species: string;
    breed: string;
    size: string;
    weightKg: Prisma.Decimal | null;
    birthDate: Date | null;
    vaccinated: boolean;
    specialNeeds: string | null;
    archivedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: pet.id,
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      size: pet.size,
      weightKg: pet.weightKg === null ? null : Number(pet.weightKg),
      birthDate: pet.birthDate?.toISOString().slice(0, 10) ?? null,
      vaccinated: pet.vaccinated,
      specialNeeds: pet.specialNeeds,
      archivedAt: pet.archivedAt,
      createdAt: pet.createdAt,
      updatedAt: pet.updatedAt,
    };
  }
}
