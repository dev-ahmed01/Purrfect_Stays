import { Injectable } from '@nestjs/common';
import argon2 from 'argon2';

@Injectable()
export class PasswordService {
  private readonly dummyHashPromise = argon2.hash(
    'Purrfect-Timing-Equalizer-Only-2026!',
    this.options,
  );

  private get options(): argon2.Options & { type: number } {
    return {
      type: argon2.argon2id,
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
    };
  }

  hash(password: string) {
    return argon2.hash(password, this.options);
  }

  verify(hash: string, password: string) {
    return argon2.verify(hash, password);
  }

  async consumeComparableWork(password: string) {
    const dummyHash = await this.dummyHashPromise;
    await argon2.verify(dummyHash, password);
  }
}
