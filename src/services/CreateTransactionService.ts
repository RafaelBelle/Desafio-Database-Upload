 import AppError from '../errors/AppError';
import {getCustomRepository, getRepository} from 'typeorm';
import {uuid} from 'uuidv4';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({ title, value, type, category }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    if (type === 'outcome') {
      const balance = await transactionsRepository.getBalance();
      if (balance.total - value < 0){
        throw new AppError('Not enough found', 400);
      }
    }

    const checkCategoryExists = await categoriesRepository.findOne({
      where: { title: category }
    });

    let categoryId;

    if (!checkCategoryExists) {
      const newCategory = categoriesRepository.create({
        title: category
      });

      await categoriesRepository.save(newCategory);

      categoryId = newCategory.id;
    }
    else {
      categoryId = checkCategoryExists.id;
    }

    const transaction = transactionsRepository.create({
      id: uuid(),
      title,
      value,
      type,
      category_id: categoryId
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
