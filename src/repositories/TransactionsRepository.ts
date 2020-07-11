import { EntityRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public async getBalance(): Promise<Balance> {
    const filteredIncomes = await this.find({
      where: { type: 'income' }
    });

    const income = filteredIncomes.reduce(function (accumulator: number, obj: Transaction): number {
      return accumulator + Number(obj.value);
    }, 0);

    const filteredOutcomes = await this.find({
      where: { type: 'outcome' }
    });

    const outcome = filteredOutcomes.reduce(function (accumulator: number, obj: Transaction): number {
        return accumulator + Number(obj.value);
    }, 0);

    const total = income - outcome;

    return {
      income,
      outcome,
      total
    };
  }
}

export default TransactionsRepository;
