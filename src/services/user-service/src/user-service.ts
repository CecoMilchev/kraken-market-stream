import { UserRepository } from './repositories/UserRepository.js';

export function createUserRepository() {
  return new UserRepository();
}