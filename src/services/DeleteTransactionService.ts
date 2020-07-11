import AppError from '../errors/AppError';
import { getCustomRepository } from 'typeorm';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request{
  id: string;
}

class DeleteTransactionService {
  public async execute({id}: Request): Promise<void> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const transaction = await transactionsRepository.findOne({
      where: { id }
    });

    if (transaction) {
      await transactionsRepository.remove(transaction);
    }
    else{
      throw new AppError('Transaction not found', 400);
    }
  }
}

export default DeleteTransactionService;
